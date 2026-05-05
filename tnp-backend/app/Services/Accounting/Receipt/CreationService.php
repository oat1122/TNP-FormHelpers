<?php

namespace App\Services\Accounting\Receipt;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Company;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Receipt creation flows: manual create + create-from-payment (when an
 * approved invoice is paid).
 */
class CreationService
{
    public function __construct(
        private AutofillService $autofillService,
        private Calculator $calculator,
    ) {}

    /**
     * Create a receipt from an approved invoice's payment record.
     *
     * @param  array<string, mixed>  $paymentData
     */
    public function createFromPayment(string $invoiceId, array $paymentData, ?string $createdBy = null): Receipt
    {
        return DB::transaction(function () use ($invoiceId, $paymentData, $createdBy) {
            $invoice = Invoice::findOrFail($invoiceId);

            if (! in_array($invoice->status, ['sent', 'partial_paid'])) {
                throw new \Exception('Invoice must be sent or partially paid to create receipt');
            }

            $autofillData = $this->autofillService->getCascadeAutofillForReceipt($invoiceId);
            $receiptType = $this->calculator->determineReceiptType($invoice, $paymentData);
            $totalAmount = $this->calculator->resolveTotalAmount($paymentData);
            $amounts = $this->calculator->calculateReceiptAmounts($totalAmount, $receiptType);
            $companyId = $invoice->company_id
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);

            $receipt = new Receipt;
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

            $this->calculator->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            DocumentHistory::logAction(
                'receipt',
                $receipt->id,
                'create_from_payment',
                $createdBy,
                "Created receipt from payment {$invoice->number} (amount: ".number_format($totalAmount, 2).')'
            );

            return $receipt->load(['invoice']);
        });
    }

    /**
     * Create a receipt manually.
     *
     * @param  array<string, mixed>  $receiptData
     */
    public function create(array $receiptData, ?string $createdBy = null): Receipt
    {
        return DB::transaction(function () use ($receiptData, $createdBy) {
            $data = $this->normalizeCreateData($receiptData);
            $companyId = $data['company_id']
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);

            $receipt = new Receipt;
            $receipt->id = (string) Str::uuid();
            $receipt->company_id = $companyId;
            $receipt->number = Receipt::generateReceiptNumber($companyId, $data['type']);
            $receipt->fill($data);
            $receipt->company_id = $companyId;
            $receipt->status = 'draft';
            $receipt->issued_by = $createdBy;

            $this->calculator->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            DocumentHistory::logAction(
                'receipt',
                $receipt->id,
                'create',
                $createdBy,
                'Created receipt'
            );

            return $receipt;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeCreateData(array $data): array
    {
        $type = $this->calculator->resolveReceiptType($data);
        $totalAmount = $this->calculator->resolveTotalAmount($data);
        $amounts = $this->calculator->calculateReceiptAmounts($totalAmount, $type);
        $payload = $this->calculator->copyReceiptColumns($data);

        $payload['type'] = $type;
        $payload['subtotal'] = $data['subtotal'] ?? $amounts['subtotal'];
        $payload['tax_amount'] = $data['tax_amount'] ?? ($data['vat_amount'] ?? $amounts['tax_amount']);
        $payload['total_amount'] = $totalAmount;
        $payload['payment_reference'] = $data['payment_reference'] ?? ($data['reference_number'] ?? null);

        return $payload;
    }
}
