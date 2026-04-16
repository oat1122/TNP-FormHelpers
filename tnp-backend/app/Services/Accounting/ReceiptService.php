<?php

namespace App\Services\Accounting;

use App\Models\Accounting\DocumentAttachment;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Company;
use App\Services\Support\DocumentNumberService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptService
{
    private const RECEIPT_TYPES_WITH_VAT = ['tax_invoice', 'full_tax_invoice'];

    protected AutofillService $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    public function createFromPayment($invoiceId, $paymentData, $createdBy = null): Receipt
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if (!in_array($invoice->status, ['sent', 'partial_paid'])) {
                throw new \Exception('Invoice must be sent or partially paid to create receipt');
            }

            $autofillData = $this->autofillService->getCascadeAutofillForReceipt($invoiceId);
            $receiptType = $this->determineReceiptType($invoice, $paymentData);
            $totalAmount = $this->resolveTotalAmount($paymentData);
            $amounts = $this->calculateReceiptAmounts($totalAmount, $receiptType);
            $companyId = $invoice->company_id
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);

            $receipt = new Receipt();
            $receipt->id = (string) Str::uuid();
            $receipt->company_id = $companyId;
            $receipt->number = Receipt::generateReceiptNumber($companyId, $receiptType);
            $receipt->invoice_id = $invoice->id;
            $receipt->customer_id = $autofillData['customer_id'] ?? null;
            $receipt->customer_company = $autofillData['customer_company'] ?? null;
            $receipt->customer_tax_id = $autofillData['customer_tax_id'] ?? null;
            $receipt->customer_address = $autofillData['customer_address'] ?? null;
            $receipt->customer_zip_code = $autofillData['customer_zip_code'] ?? null;
            $receipt->customer_tel_1 = $autofillData['customer_tel_1'] ?? null;
            $receipt->customer_email = $autofillData['customer_email'] ?? null;
            $receipt->customer_firstname = $autofillData['customer_firstname'] ?? null;
            $receipt->customer_lastname = $autofillData['customer_lastname'] ?? null;
            $receipt->work_name = $autofillData['work_name'] ?? null;
            $receipt->quantity = $autofillData['quantity'] ?? null;
            $receipt->type = $receiptType;
            $receipt->subtotal = $amounts['subtotal'];
            $receipt->tax_amount = $amounts['tax_amount'];
            $receipt->total_amount = $totalAmount;
            $receipt->payment_method = $paymentData['payment_method'] ?? null;
            $receipt->payment_reference = $paymentData['payment_reference'] ?? ($paymentData['reference_number'] ?? null);
            $receipt->notes = $paymentData['notes'] ?? null;
            $receipt->status = 'draft';
            $receipt->issued_by = $createdBy;

            $this->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            DocumentHistory::logAction(
                'receipt',
                $receipt->id,
                'create_from_payment',
                $createdBy,
                "Created receipt from payment {$invoice->number} (amount: " . number_format($totalAmount, 2) . ")"
            );

            DB::commit();

            return $receipt->load(['invoice']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::createFromPayment error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function create($receiptData, $createdBy = null): Receipt
    {
        try {
            DB::beginTransaction();

            $data = $this->normalizeCreateData($receiptData);
            $companyId = $data['company_id']
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);

            $receipt = new Receipt();
            $receipt->id = (string) Str::uuid();
            $receipt->company_id = $companyId;
            $receipt->number = Receipt::generateReceiptNumber($companyId, $data['type']);
            $receipt->fill($data);
            $receipt->company_id = $companyId;
            $receipt->status = 'draft';
            $receipt->issued_by = $createdBy;

            $this->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            DocumentHistory::logAction(
                'receipt',
                $receipt->id,
                'create',
                $createdBy,
                'Created receipt'
            );

            DB::commit();

            return $receipt;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::create error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function update($receiptId, $updateData, $updatedBy = null): Receipt
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'draft') {
                throw new \Exception('Receipt cannot be updated in current status');
            }

            $oldData = $receipt->toArray();
            $receipt->fill($this->normalizeUpdateData($updateData, $receipt));
            $this->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            $changes = array_diff_assoc($receipt->toArray(), $oldData);
            if (!empty($changes)) {
                DocumentHistory::logAction(
                    'receipt',
                    $receiptId,
                    'update',
                    $updatedBy,
                    'Updated receipt: ' . implode(', ', array_keys($changes))
                );
            }

            DB::commit();

            return $receipt->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function submit($receiptId, $submittedBy = null): Receipt
    {
        Receipt::findOrFail($receiptId);

        throw new \Exception('Receipt submit workflow is not available with the legacy receipt schema');
    }

    public function approve($receiptId, $approvedBy = null, $notes = null): Receipt
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'draft') {
                throw new \Exception('Receipt must be draft to approve');
            }

            $previousStatus = $receipt->status;
            $receipt->status = 'approved';
            $receipt->approved_by = $approvedBy;
            $receipt->approved_at = now();

            $this->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            if ($receipt->invoice_id) {
                $this->updateInvoicePaymentStatus($receipt->invoice_id, $receipt->total_amount);
            }

            DocumentHistory::logStatusChange(
                'receipt',
                $receiptId,
                $previousStatus,
                'approved',
                $approvedBy,
                'Approved' . ($notes ? ': ' . $notes : '')
            );

            DB::commit();

            return $receipt->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::approve error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function reject($receiptId, $reason, $rejectedBy = null): Receipt
    {
        Receipt::findOrFail($receiptId);

        throw new \Exception('Receipt reject workflow is not available with the legacy receipt schema');
    }

    public function uploadEvidence($receiptId, $files, $description = null, $uploadedBy = null): array
    {
        try {
            DB::beginTransaction();

            Receipt::findOrFail($receiptId);

            $uploadedFiles = [];

            foreach ($files as $file) {
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('receipts/evidence', $filename, 'public');

                $attachment = DocumentAttachment::create([
                    'document_type' => 'receipt',
                    'document_id' => $receiptId,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'uploaded_by' => $uploadedBy
                ]);

                $uploadedFiles[] = [
                    'id' => $attachment->id,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'url' => Storage::url($path),
                    'size' => $file->getSize()
                ];
            }

            $fileCount = count($files);
            DocumentHistory::logAction(
                'receipt',
                $receiptId,
                'upload_evidence',
                $uploadedBy,
                "Uploaded {$fileCount} evidence file(s)" . ($description ? ": {$description}" : '')
            );

            DB::commit();

            return [
                'uploaded_files' => $uploadedFiles,
                'description' => $description,
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now()->format('Y-m-d\TH:i:s\Z')
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::uploadEvidence error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getList($filters = [], $perPage = 20)
    {
        try {
            $query = Receipt::with(['invoice', 'documentHistory'])
                ->select('receipts.*');

            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                        ->orWhere('customer_company', 'like', "%{$search}%")
                        ->orWhere('work_name', 'like', "%{$search}%")
                        ->orWhere('tax_invoice_number', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (!empty($filters['receipt_type'])) {
                $query->where('type', $filters['receipt_type']);
            }

            if (!empty($filters['type'])) {
                $query->where('type', $filters['type']);
            }

            if (!empty($filters['customer_id'])) {
                $query->where('customer_id', $filters['customer_id']);
            }

            if (!empty($filters['payment_method'])) {
                $query->where('payment_method', $filters['payment_method']);
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            return $query->orderBy('created_at', 'desc')->paginate($perPage);
        } catch (\Exception $e) {
            Log::error('ReceiptService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function generatePdf($receiptId): array
    {
        try {
            $receipt = Receipt::with(['invoice'])->findOrFail($receiptId);

            if ($receipt->status !== 'approved') {
                throw new \Exception('Receipt must be approved before generating PDF');
            }

            $filename = $this->generatePdfFilename($receipt);
            $pdfPath = storage_path("app/public/pdfs/receipts/{$filename}");
            $directory = dirname($pdfPath);

            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            $content = $this->generatePdfContent($receipt);
            file_put_contents($pdfPath, $content);

            $fileSize = filesize($pdfPath);
            $pdfUrl = url("storage/pdfs/receipts/{$filename}");

            DocumentHistory::logAction(
                'receipt',
                $receiptId,
                'generate_pdf',
                auth()->user()->user_uuid ?? null,
                "Generated PDF: {$filename}"
            );

            return [
                'url' => $pdfUrl,
                'filename' => $filename,
                'size' => $fileSize,
                'path' => $pdfPath
            ];
        } catch (\Exception $e) {
            Log::error('ReceiptService::generatePdf error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function normalizeCreateData(array $data): array
    {
        $type = $this->resolveReceiptType($data);
        $totalAmount = $this->resolveTotalAmount($data);
        $amounts = $this->calculateReceiptAmounts($totalAmount, $type);
        $payload = $this->copyReceiptColumns($data);

        $payload['type'] = $type;
        $payload['subtotal'] = $data['subtotal'] ?? $amounts['subtotal'];
        $payload['tax_amount'] = $data['tax_amount'] ?? ($data['vat_amount'] ?? $amounts['tax_amount']);
        $payload['total_amount'] = $totalAmount;
        $payload['payment_reference'] = $data['payment_reference'] ?? ($data['reference_number'] ?? null);

        return $payload;
    }

    private function normalizeUpdateData(array $data, Receipt $receipt): array
    {
        $payload = $this->copyReceiptColumns($data, false);

        if (array_key_exists('type', $data) || array_key_exists('receipt_type', $data)) {
            $payload['type'] = $this->resolveReceiptType($data);
        }

        if (array_key_exists('payment_reference', $data) || array_key_exists('reference_number', $data)) {
            $payload['payment_reference'] = $data['payment_reference'] ?? ($data['reference_number'] ?? null);
        }

        if (array_key_exists('tax_amount', $data) || array_key_exists('vat_amount', $data)) {
            $payload['tax_amount'] = $data['tax_amount'] ?? $data['vat_amount'];
        }

        if (array_key_exists('subtotal', $data)) {
            $payload['subtotal'] = $data['subtotal'];
        }

        if (
            array_key_exists('total_amount', $data)
            || array_key_exists('payment_amount', $data)
            || array_key_exists('amount', $data)
        ) {
            $totalAmount = $this->resolveTotalAmount($data);
            $type = $payload['type'] ?? $receipt->type;
            $amounts = $this->calculateReceiptAmounts($totalAmount, $type);

            $payload['total_amount'] = $totalAmount;
            $payload['subtotal'] = $payload['subtotal'] ?? $amounts['subtotal'];
            $payload['tax_amount'] = $payload['tax_amount'] ?? $amounts['tax_amount'];
        }

        return $payload;
    }

    private function copyReceiptColumns(array $data, bool $includeImmutableColumns = true): array
    {
        $columns = [
            'customer_id',
            'customer_company',
            'customer_tax_id',
            'customer_address',
            'customer_zip_code',
            'customer_tel_1',
            'customer_email',
            'customer_firstname',
            'customer_lastname',
            'work_name',
            'quantity',
            'payment_method',
            'tax_invoice_number',
            'notes',
        ];

        if ($includeImmutableColumns) {
            array_unshift($columns, 'company_id', 'invoice_id');
        }

        $payload = [];
        foreach ($columns as $column) {
            if (array_key_exists($column, $data)) {
                $payload[$column] = $data[$column];
            }
        }

        return $payload;
    }

    private function determineReceiptType(Invoice $invoice, array $paymentData): string
    {
        return $this->resolveReceiptType($paymentData, $invoice);
    }

    private function resolveReceiptType(array $data, ?Invoice $invoice = null): string
    {
        $type = $data['type'] ?? ($data['receipt_type'] ?? null);

        if (in_array($type, ['receipt', 'tax_invoice', 'full_tax_invoice'], true)) {
            return $type;
        }

        if ($invoice && $invoice->customer_tax_id && strlen($invoice->customer_tax_id) === 13) {
            return 'tax_invoice';
        }

        return 'receipt';
    }

    private function resolveTotalAmount(array $data): float
    {
        return (float) ($data['total_amount'] ?? ($data['payment_amount'] ?? ($data['amount'] ?? 0)));
    }

    private function calculateReceiptAmounts($totalAmount, $receiptType): array
    {
        $totalAmount = (float) $totalAmount;

        if (in_array($receiptType, self::RECEIPT_TYPES_WITH_VAT, true)) {
            $vatRate = 0.07;
            $subtotal = $totalAmount / (1 + $vatRate);
            $taxAmount = $totalAmount - $subtotal;

            return [
                'subtotal' => round($subtotal, 2),
                'vat_rate' => $vatRate,
                'vat_amount' => round($taxAmount, 2),
                'tax_amount' => round($taxAmount, 2),
            ];
        }

        return [
            'subtotal' => $totalAmount,
            'vat_rate' => 0,
            'vat_amount' => 0,
            'tax_amount' => 0,
        ];
    }

    private function assignTaxInvoiceNumberIfNeeded(Receipt $receipt): void
    {
        if (in_array($receipt->type, self::RECEIPT_TYPES_WITH_VAT, true) && empty($receipt->tax_invoice_number)) {
            $receipt->tax_invoice_number = app(DocumentNumberService::class)
                ->next($receipt->company_id, 'tax_invoice');
        }
    }

    private function updateInvoicePaymentStatus($invoiceId, $paymentAmount): void
    {
        $invoice = Invoice::findOrFail($invoiceId);
        $currentPaid = (float) ($invoice->paid_amount ?? 0);
        $paymentAmount = (float) $paymentAmount;
        $newPaidAmount = $currentPaid + $paymentAmount;

        $invoice->paid_amount = $newPaidAmount;

        if ($newPaidAmount >= $invoice->total_amount) {
            $invoice->status = 'fully_paid';
            $invoice->paid_at = now();
        } else {
            $invoice->status = 'partial_paid';
        }

        $invoice->save();
    }

    private function generatePdfFilename($receipt): string
    {
        $type = $receipt->type === 'tax_invoice' ? 'tax-invoice' : 'receipt';
        return "{$type}-{$receipt->number}.pdf";
    }

    private function generatePdfContent($receipt): string
    {
        $title = $receipt->type === 'tax_invoice' ? 'Tax Invoice' : 'Receipt';
        $paymentDate = optional($receipt->created_at)->format('Y-m-d') ?? '';
        $vatRate = $receipt->type === 'receipt' ? 0 : 0.07;

        return "
TNP GROUP
{$title} {$receipt->number}
" . ($receipt->tax_invoice_number ? "Tax invoice no.: {$receipt->tax_invoice_number}" : '') . "

Customer: {$receipt->customer_company}
Tax ID: {$receipt->customer_tax_id}
Address: {$receipt->customer_address}

Work:
{$receipt->work_name}
Quantity: {$receipt->quantity}

Payment:
Payment date: {$paymentDate}
Payment method: {$receipt->payment_method}
Reference: {$receipt->payment_reference}

Amount:
Subtotal: " . number_format($receipt->subtotal, 2) . " THB
VAT " . ($vatRate * 100) . "%: " . number_format($receipt->tax_amount, 2) . " THB
Total: " . number_format($receipt->total_amount, 2) . " THB

Notes:
{$receipt->notes}

Date: " . now()->format('d/m/Y') . "
";
    }
}
