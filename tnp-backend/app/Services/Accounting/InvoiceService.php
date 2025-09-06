<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Invoice;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\DocumentAttachment;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    protected $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    /**
     * Fetch quotations that are signed and approved, and have no invoice yet.
     * Used by Invoices page to list candidates for invoice creation.
     */
    public function getQuotationsAwaiting($filters = [], $perPage = 20)
    {
        try {
            // Keep consistent with QuotationService eager-loads so UI gets same shape
            $with = ['customer', 'creator', 'pricingRequest', 'items', 'company'];
            if (\Illuminate\Support\Facades\Schema::hasTable('quotation_pricing_requests')) {
                $with[] = 'pricingRequests';
            }

            $query = \App\Models\Accounting\Quotation::with($with)
                ->where('status', 'approved')
                ->whereNotNull('signature_images')
                ->whereRaw('JSON_VALID(signature_images)')
                ->whereRaw('JSON_LENGTH(signature_images) > 0')
                ->whereNotExists(function ($q) {
                    $q->select(\DB::raw(1))
                      ->from('invoices')
                      ->whereColumn('invoices.quotation_id', 'quotations.id');
                });

            // Optional text search by number, work_name, customer fields
            if (!empty($filters['search'])) {
                $rawSearch = trim($filters['search']);
                $like = '%' . $rawSearch . '%';

                $hasCustomerCompany = \Illuminate\Support\Facades\Schema::hasColumn('quotations', 'customer_company');
                $hasCustomerFirst = \Illuminate\Support\Facades\Schema::hasColumn('quotations', 'customer_firstname');
                $hasCustomerLast = \Illuminate\Support\Facades\Schema::hasColumn('quotations', 'customer_lastname');

                $joinedMaster = false;
                if (\Illuminate\Support\Facades\Schema::hasTable('master_customers')) {
                    $query->leftJoin('master_customers', 'quotations.customer_id', '=', 'master_customers.cus_id');
                    $joinedMaster = true;
                }

                $query->select('quotations.*');

                $query->where(function ($q) use ($like, $hasCustomerCompany, $hasCustomerFirst, $hasCustomerLast, $joinedMaster) {
                    $q->where('quotations.number', 'like', $like)
                      ->orWhere('quotations.work_name', 'like', $like);
                    if ($hasCustomerCompany) {
                        $q->orWhere('quotations.customer_company', 'like', $like);
                    }
                    if ($hasCustomerFirst) {
                        $q->orWhere('quotations.customer_firstname', 'like', $like);
                    }
                    if ($hasCustomerLast) {
                        $q->orWhere('quotations.customer_lastname', 'like', $like);
                    }
                    if ($joinedMaster) {
                        foreach (['cus_company','cus_firstname','cus_lastname','cus_name'] as $col) {
                            if (\Illuminate\Support\Facades\Schema::hasColumn('master_customers', $col)) {
                                $q->orWhere("master_customers.$col", 'like', $like);
                            }
                        }
                    }
                });
            }

            return $query->orderBy('created_at', 'desc')->paginate(min($perPage, 50));
        } catch (\Exception $e) {
            \Log::error('InvoiceService::getQuotationsAwaiting error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * One-Click Conversion จาก Quotation เป็น Invoice
     */
    public function createFromQuotation($quotationId, $invoiceData, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::with(['items', 'customer'])->findOrFail($quotationId);

            // ตรวจสอบสถานะ Quotation
            if ($quotation->status !== 'approved') {
                throw new \Exception('Quotation must be approved before converting to invoice');
            }

            // ดึงข้อมูล Auto-fill จาก Quotation
            $autofillData = $this->autofillService->getCascadeAutofillForInvoice($quotationId);

            // สร้าง Invoice
            $invoice = new Invoice();
            $invoice->id = \Illuminate\Support\Str::uuid();
            $invoice->company_id = $quotation->company_id
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $invoice->number = Invoice::generateInvoiceNumber($invoice->company_id);
            $invoice->quotation_id = $quotation->id;
            
            // ข้อมูล Primary Pricing Request
            $invoice->primary_pricing_request_id = $quotation->primary_pricing_request_id;
            $invoice->primary_pricing_request_ids = $quotation->primary_pricing_request_ids;
            
            // Auto-fill ข้อมูลลูกค้า
            $invoice->customer_id = $autofillData['customer_id'];
            $invoice->customer_company = $autofillData['customer_company'];
            $invoice->customer_tax_id = $autofillData['customer_tax_id'];
            
            // ใช้ที่อยู่จาก form หากมีการแก้ไข ไม่เช่นนั้นใช้จาก autofill
            $invoice->customer_address = $invoiceData['custom_billing_address'] ?? $autofillData['customer_address'];
            
            $invoice->customer_zip_code = $autofillData['customer_zip_code'];
            $invoice->customer_tel_1 = $autofillData['customer_tel_1'];
            $invoice->customer_email = $autofillData['customer_email'];
            $invoice->customer_firstname = $autofillData['customer_firstname'];
            $invoice->customer_lastname = $autofillData['customer_lastname'];

            // Snapshot ข้อมูลลูกค้า ณ เวลาที่สร้าง Invoice
            $invoice->customer_snapshot = [
                'customer_id' => $invoice->customer_id,
                'customer_company' => $invoice->customer_company,
                'customer_tax_id' => $invoice->customer_tax_id,
                'customer_address' => $invoice->customer_address, // ใช้ที่อยู่ที่เลือกจริงใน form
                'customer_zip_code' => $invoice->customer_zip_code,
                'customer_tel_1' => $invoice->customer_tel_1,
                'customer_email' => $invoice->customer_email,
                'customer_firstname' => $invoice->customer_firstname,
                'customer_lastname' => $invoice->customer_lastname,
                'original_customer_address' => $autofillData['customer_address'], // เก็บที่อยู่เดิมไว้อ้างอิง
                'custom_address_used' => !empty($invoiceData['custom_billing_address']), // บอกว่าใช้ที่อยู่กำหนดเองหรือไม่
                'snapshot_at' => now()->toISOString()
            ];

            // Default customer data source to 'master' unless FE specified otherwise
            $invoice->customer_data_source = $invoiceData['customer_data_source'] ?? 'master';

            // คำนวณยอดตามประเภท Invoice และข้อมูลทางการเงินที่ส่งมาจาก Frontend
            $invoiceType = $invoiceData['type'] ?? 'remaining';
            $invoice->type = $invoiceType;

            // ใช้ข้อมูลการเงินที่ส่งมาจาก Frontend (ที่คำนวณแล้ว)
            $invoice->subtotal = $invoiceData['subtotal'] ?? 0;
            $invoice->special_discount_percentage = $invoiceData['special_discount_percentage'] ?? 0;
            $invoice->special_discount_amount = $invoiceData['special_discount_amount'] ?? 0;
            
            // VAT configuration
            $invoice->has_vat = $invoiceData['has_vat'] ?? $quotation->has_vat ?? true;
            $invoice->vat_percentage = $invoiceData['vat_percentage'] ?? $quotation->vat_percentage ?? 7;
            $invoice->vat_amount = $invoiceData['vat_amount'] ?? 0;
            
            // Withholding Tax configuration
            $invoice->has_withholding_tax = $invoiceData['has_withholding_tax'] ?? false;
            $invoice->withholding_tax_percentage = $invoiceData['withholding_tax_percentage'] ?? 0;
            $invoice->withholding_tax_amount = $invoiceData['withholding_tax_amount'] ?? 0;
            
            // Amounts
            $invoice->total_amount = $invoiceData['total_amount'] ?? 0;
            $invoice->final_total_amount = $invoiceData['final_total_amount'] ?? $invoice->total_amount;
            
            // Deposit information
            $invoice->deposit_mode = $invoiceData['deposit_mode'] ?? $quotation->deposit_mode ?? 'percentage';
            $invoice->deposit_percentage = $invoiceData['deposit_percentage'] ?? $quotation->deposit_percentage ?? 0;
            $invoice->deposit_amount = $invoiceData['deposit_amount'] ?? $quotation->deposit_amount ?? 0;
            
            // Payment information
            $invoice->payment_method = $invoiceData['payment_method'] ?? $quotation->payment_method ?? null;
            $invoice->payment_terms = $invoiceData['payment_terms'] ?? $quotation->payment_terms ?? null;
            
            // คำนวณวันครบกำหนดชำระ
            $invoice->due_date = $invoiceData['due_date'] ?? $this->calculateDueDate($invoice->payment_terms);
            
            // ข้อมูลเพิ่มเติม
            $invoice->notes = $invoiceData['notes'] ?? $quotation->notes ?? null;
            $invoice->document_header_type = $invoiceData['document_header_type'] ?? $quotation->document_header_type ?? 'ต้นฉบับ';
            
            // Signature และ Sample images (copy จาก Quotation ถ้ามี)
            $invoice->signature_images = $invoiceData['signature_images'] ?? $quotation->signature_images ?? null;
            $invoice->sample_images = $invoiceData['sample_images'] ?? $quotation->sample_images ?? null;
            
            // Status และ Audit trail
            $invoice->status = 'draft';
            $invoice->paid_amount = 0;
            $invoice->created_by = $createdBy;
            $invoice->created_at = now();

            $invoice->save();

            // สร้าง Invoice Items จาก Quotation Items
            if ($quotation->items && $quotation->items->count() > 0) {
                $this->createInvoiceItemsFromQuotation($invoice->id, $quotation->items, $createdBy);
            }

            // บันทึก History
            DocumentHistory::logAction(
                'invoice',
                $invoice->id,
                'create_from_quotation',
                $createdBy,
                "สร้างใบแจ้งหนี้จากใบเสนอราคา {$quotation->number} (ประเภท: {$invoiceType})"
            );

            DB::commit();

            return $invoice->load(['quotation', 'customer', 'items']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::createFromQuotation error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Invoice Items จาก Quotation Items
     */
    private function createInvoiceItemsFromQuotation($invoiceId, $quotationItems, $createdBy = null)
    {
        try {
            foreach ($quotationItems as $index => $qItem) {
                $invoiceItem = new \App\Models\Accounting\InvoiceItem();
                $invoiceItem->id = \Illuminate\Support\Str::uuid();
                $invoiceItem->invoice_id = $invoiceId;
                $invoiceItem->quotation_item_id = $qItem->id;
                $invoiceItem->pricing_request_id = $qItem->pricing_request_id;
                
                // Copy ข้อมูลจาก Quotation Item
                $invoiceItem->item_name = $qItem->item_name;
                $invoiceItem->item_description = $qItem->item_description;
                $invoiceItem->sequence_order = $index + 1;
                $invoiceItem->pattern = $qItem->pattern;
                $invoiceItem->fabric_type = $qItem->fabric_type;
                $invoiceItem->color = $qItem->color;
                $invoiceItem->size = $qItem->size;
                $invoiceItem->unit_price = $qItem->unit_price;
                $invoiceItem->quantity = $qItem->quantity;
                $invoiceItem->unit = $qItem->unit ?? 'ชิ้น';
                $invoiceItem->discount_percentage = $qItem->discount_percentage ?? 0;
                $invoiceItem->discount_amount = $qItem->discount_amount ?? 0;
                $invoiceItem->item_images = $qItem->item_images;
                $invoiceItem->notes = $qItem->notes;
                $invoiceItem->status = 'draft';
                $invoiceItem->created_by = $createdBy;
                
                $invoiceItem->save();
            }
        } catch (\Exception $e) {
            Log::error('InvoiceService::createInvoiceItemsFromQuotation error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Invoice แบบ Manual
     */
    public function create($invoiceData, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = new Invoice();
            $invoice->id = \Illuminate\Support\Str::uuid();
            $invoice->company_id = $invoiceData['company_id']
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $invoice->number = Invoice::generateInvoiceNumber($invoice->company_id);
            
            // กรอกข้อมูลจาก input
            foreach ($invoiceData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            $invoice->status = 'draft';
            $invoice->created_by = $createdBy;
            $invoice->created_at = now();

            $invoice->save();

            // บันทึก History
            DocumentHistory::logAction(
                'invoice',
                $invoice->id,
                'create',
                $createdBy,
                "สร้างใบแจ้งหนี้ใหม่"
            );

            DB::commit();

            return $invoice;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::create error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปเดต Invoice
     */
    public function update($invoiceId, $updateData, $updatedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            // ตรวจสอบสถานะ
            if (!in_array($invoice->status, ['draft', 'pending_review'])) {
                throw new \Exception('Invoice cannot be updated in current status');
            }

            $oldData = $invoice->toArray();

            // อัปเดตข้อมูล
            foreach ($updateData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            $invoice->updated_by = $updatedBy;
            $invoice->save();

            // บันทึก History การแก้ไข - track only simple field changes
            $updatedFields = array_keys($updateData);
            $changedFields = array_filter($updatedFields, function($field) use ($invoice) {
                return $invoice->isFillable($field) && !in_array($field, [
                    'primary_pricing_request_ids', 'customer_snapshot', 
                    'signature_images', 'sample_images'
                ]);
            });
            
            if (!empty($changedFields)) {
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'update',
                    $updatedBy,
                    "แก้ไขใบแจ้งหนี้: " . implode(', ', $changedFields)
                );
            }

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งใบแจ้งหนี้เพื่อขออนุมัติ (Sales → Account)
     */
    public function submit($invoiceId, $submittedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'draft') {
                throw new \Exception('Invoice must be in draft status to submit');
            }

            $invoice->status = 'pending_review';
            $invoice->submitted_by = $submittedBy;
            $invoice->submitted_at = now();
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'draft',
                'pending_review',
                'ส่งขออนุมัติ',
                $submittedBy
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::submit error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อนุมัติใบแจ้งหนี้ (Account)
     */
    public function approve($invoiceId, $approvedBy = null, $notes = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending_review') {
                throw new \Exception('Invoice must be pending review to approve');
            }

            $invoice->status = 'approved';
            $invoice->approved_by = $approvedBy;
            $invoice->approved_at = now();
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending_review',
                'approved',
                'อนุมัติ',
                $approvedBy,
                $notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::approve error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ปฏิเสธใบแจ้งหนี้ (Account)
     */
    public function reject($invoiceId, $reason, $rejectedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending_review') {
                throw new \Exception('Invoice must be pending review to reject');
            }

            $invoice->status = 'rejected';
            $invoice->rejected_by = $rejectedBy;
            $invoice->rejected_at = now();
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending_review',
                'rejected',
                'ปฏิเสธ',
                $rejectedBy,
                $reason
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::reject error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งกลับแก้ไข (Account ส่งกลับให้ Sales)
     */
    public function sendBack($invoiceId, $reason, $actionBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending_review') {
                throw new \Exception('Invoice must be pending review to send back');
            }

            $invoice->status = 'draft';
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending_review',
                'draft',
                'ส่งกลับแก้ไข',
                $actionBy,
                $reason
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::sendBack error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งใบแจ้งหนี้ให้ลูกค้า
     */
    public function sendToCustomer($invoiceId, $sendData, $sentBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'approved') {
                throw new \Exception('Invoice must be approved before sending to customer');
            }

            $invoice->status = 'sent';
            $invoice->sent_by = $sentBy;
            $invoice->sent_at = now();
            $invoice->save();

            // บันทึก History
            $notes = "ส่งให้ลูกค้าด้วยวิธี: " . ($sendData['delivery_method'] ?? 'อีเมล');
            if (!empty($sendData['recipient_email'])) {
                $notes .= "\nส่งถึง: " . $sendData['recipient_email'];
            }

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'approved',
                'sent',
                'ส่งให้ลูกค้า',
                $sentBy,
                $notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::sendToCustomer error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * บันทึกการชำระเงิน
     */
    public function recordPayment($invoiceId, $paymentData, $recordedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if (!in_array($invoice->status, ['sent', 'partial_paid'])) {
                throw new \Exception('Invoice must be sent before recording payment');
            }

            $paymentAmount = $paymentData['amount'];
            $currentPaid = $invoice->paid_amount ?? 0;
            $newPaidAmount = $currentPaid + $paymentAmount;

            if ($newPaidAmount > $invoice->total_amount) {
                throw new \Exception('Payment amount cannot exceed invoice total');
            }

            $invoice->paid_amount = $newPaidAmount;
            
            // อัปเดตสถานะ
            if ($newPaidAmount >= $invoice->total_amount) {
                $invoice->status = 'fully_paid';
                $invoice->paid_at = now();
            } else {
                $invoice->status = 'partial_paid';
            }

            $invoice->save();

            // บันทึก History
            $notes = "ชำระเงิน: ฿" . number_format($paymentAmount, 2);
            if (!empty($paymentData['payment_method'])) {
                $notes .= "\nวิธีการชำระ: " . $paymentData['payment_method'];
            }
            if (!empty($paymentData['reference_number'])) {
                $notes .= "\nเลขที่อ้างอิง: " . $paymentData['reference_number'];
            }

            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
                'record_payment',
                $recordedBy,
                $notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::recordPayment error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการ Invoice พร้อม Filter
     */
    public function getList($filters = [], $perPage = 20)
    {
        try {
            $query = Invoice::with(['quotation', 'customer', 'documentHistory', 'manager', 'items'])
                          ->select('invoices.*')
                          // Join quotations to expose quotation number for easy consumption on FE
                          ->leftJoin('quotations', 'quotations.id', '=', 'invoices.quotation_id')
                          ->addSelect(DB::raw('quotations.number as quotation_number'));

            // Filters
            if (!empty($filters['search'])) {
                $search = trim($filters['search']);
                $like = "%{$search}%";

                // Optionally include master_customers in text search if table exists
                $joinedMaster = false;
                if (\Illuminate\Support\Facades\Schema::hasTable('master_customers')) {
                    $query->leftJoin('master_customers', 'invoices.customer_id', '=', 'master_customers.cus_id');
                    $joinedMaster = true;
                }

                $query->where(function($q) use ($like, $joinedMaster) {
                    $q->where('invoices.number', 'like', $like)
                      ->orWhere('invoices.customer_company', 'like', $like)
                      ->orWhere('invoices.work_name', 'like', $like)
                      // Search by referenced quotation number too
                      ->orWhere('quotations.number', 'like', $like);

                    if ($joinedMaster) {
                        foreach (['cus_company','cus_firstname','cus_lastname','cus_name'] as $col) {
                            if (\Illuminate\Support\Facades\Schema::hasColumn('master_customers', $col)) {
                                $q->orWhere("master_customers.$col", 'like', $like);
                            }
                        }
                    }
                });
            }

            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (!empty($filters['type'])) {
                $query->where('type', $filters['type']);
            }

            if (!empty($filters['customer_id'])) {
                $query->where('customer_id', $filters['customer_id']);
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            if (!empty($filters['due_date_from'])) {
                $query->whereDate('due_date', '>=', $filters['due_date_from']);
            }

            if (!empty($filters['due_date_to'])) {
                $query->whereDate('due_date', '<=', $filters['due_date_to']);
            }

            if (!empty($filters['overdue'])) {
                $query->where('due_date', '<', now())
                      ->whereIn('status', ['sent', 'partial_paid']);
            }

            return $query->orderBy('invoices.created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('InvoiceService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง PDF ใบแจ้งหนี้
     */
    public function generatePdf($invoiceId, $options = [])
    {
        try {
            $invoice = Invoice::with(['quotation', 'quotation.items', 'customer', 'company'])->findOrFail($invoiceId);

            // กำหนดสถานะเอกสาร
            $isFinal = in_array($invoice->status, ['approved', 'sent', 'partial_paid', 'fully_paid', 'completed']);

            // ใช้ Invoice PDF Master Service (mPDF) เป็นหลัก
            try {
                $masterService = app(\App\Services\Accounting\Pdf\InvoicePdfMasterService::class);
                $result = $masterService->generatePdf($invoice, $options);
                
                // บันทึก History
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF (mPDF): {$result['filename']} ({$result['type']})"
                );

                // ระบุ engine ที่ใช้
                $result['engine'] = 'mPDF';
                return $result;
                
            } catch (\Throwable $e) {
                Log::warning('InvoiceService::generatePdf mPDF failed, fallback to simple PDF: ' . $e->getMessage());
                
                // Fallback to simple PDF generation
                $filename = "invoice-{$invoice->number}-" . now()->format('Y-m-d-His') . ".pdf";
                $pdfPath = storage_path("app/public/pdfs/invoices/{$filename}");

                // สร้าง directory ถ้าไม่มี
                $directory = dirname($pdfPath);
                if (!file_exists($directory)) {
                    mkdir($directory, 0755, true);
                }

                // สร้าง PDF แบบง่าย
                $content = $this->generatePdfContent($invoice);
                file_put_contents($pdfPath, $content);

                $fileSize = filesize($pdfPath);
                $pdfUrl = url("storage/pdfs/invoices/{$filename}");

                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF (fallback): {$filename} - " . $e->getMessage()
                );

                return [
                    'url' => $pdfUrl,
                    'filename' => $filename,
                    'size' => $fileSize,
                    'path' => $pdfPath,
                    'type' => $isFinal ? 'final' : 'preview',
                    'engine' => 'fallback'
                ];
            }

        } catch (\Exception $e) {
            Log::error('InvoiceService::generatePdf error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream PDF สำหรับดู/ดาวน์โหลดทันที
     */
    public function streamPdf($invoiceId, $options = [])
    {
        try {
            $invoice = Invoice::with(['quotation', 'quotation.items', 'customer', 'company'])
                              ->findOrFail($invoiceId);
                              
            // ใช้ Invoice PDF Master Service (mPDF) เป็นหลัก
            $masterService = app(\App\Services\Accounting\Pdf\InvoicePdfMasterService::class);
            return $masterService->streamPdf($invoice, $options);
            
        } catch (\Throwable $e) {
            Log::warning('InvoiceService::streamPdf mPDF failed: ' . $e->getMessage());
            
            // Fallback to simple response
            $invoice = Invoice::with(['quotation', 'customer'])->findOrFail($invoiceId);
            $content = $this->generatePdfContent($invoice);
            $filename = sprintf('invoice-%s.pdf', $invoice->number ?? $invoice->id);
            
            return response($content)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
        }
    }

    /**
     * ตรวจสอบสถานะระบบ PDF
     */
    public function checkPdfSystemStatus()
    {
        try {
            $masterService = app(\App\Services\Accounting\Pdf\InvoicePdfMasterService::class);
            $status = $masterService->checkSystemStatus();
            
            return [
                'system_ready' => $status['all_ready'],
                'components' => $status,
                'recommendations' => $this->getPdfRecommendations($status),
                'preferred_engine' => $status['all_ready'] ? 'mPDF' : 'fallback'
            ];
            
        } catch (\Exception $e) {
            Log::error('InvoiceService::checkPdfSystemStatus error: ' . $e->getMessage());
            
            return [
                'system_ready' => false,
                'components' => ['error' => $e->getMessage()],
                'recommendations' => ['ติดตั้ง mPDF package และ dependencies ที่จำเป็น'],
                'preferred_engine' => 'fallback'
            ];
        }
    }

    /**
     * คำแนะนำสำหรับการแก้ไขปัญหา PDF
     */
    private function getPdfRecommendations($status)
    {
        $recommendations = [];

        if (!($status['mpdf'] ?? false)) {
            $recommendations[] = 'ติดตั้ง mPDF: composer require mpdf/mpdf';
        }

        if (!($status['thai_fonts'] ?? false)) {
            $recommendations[] = 'ดาวน์โหลดฟอนต์ Sarabun และวางไว้ใน public/fonts/thsarabun/';
        }

        if (!($status['temp_dir'] ?? false)) {
            $recommendations[] = 'ตรวจสอบสิทธิ์การเขียนไฟล์ใน storage/app/mpdf-temp/';
        }

        if (!($status['output_dir'] ?? false)) {
            $recommendations[] = 'ตรวจสอบสิทธิ์การเขียนไฟล์ใน storage/app/public/pdfs/invoices/';
        }

        return $recommendations;
    }

    /**
     * คำนวณยอดเงินตามประเภท Invoice
     */
    private function calculateInvoiceAmounts($quotation, $type, $invoiceData = [])
    {
        // Use VAT configuration from invoice data or fallback to quotation/default
        $hasVat = $invoiceData['has_vat'] ?? $quotation->has_vat ?? true;
        $vatPercentage = $invoiceData['vat_percentage'] ?? $quotation->vat_percentage ?? 7;
        $vatRate = $hasVat ? ($vatPercentage / 100) : 0;

        switch ($type) {
            case 'full_amount':
                // Use provided financial data if available, otherwise calculate from quotation
                if (isset($invoiceData['subtotal'], $invoiceData['vat_amount'], $invoiceData['total_amount'])) {
                    return [
                        'subtotal' => $invoiceData['subtotal'],
                        'tax_amount' => $invoiceData['vat_amount'],
                        'total_amount' => $invoiceData['total_amount']
                    ];
                }
                return [
                    'subtotal' => $quotation->subtotal,
                    'tax_amount' => $quotation->tax_amount,
                    'total_amount' => $quotation->total_amount
                ];

            case 'remaining':
                $totalAmount = $quotation->total_amount - ($quotation->deposit_amount ?? 0);
                if ($hasVat && $vatRate > 0) {
                    $subtotal = $totalAmount / (1 + $vatRate);
                    $taxAmount = $totalAmount - $subtotal;
                } else {
                    $subtotal = $totalAmount;
                    $taxAmount = 0;
                }
                
                return [
                    'subtotal' => round($subtotal, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'total_amount' => $totalAmount
                ];

            case 'deposit':
                $totalAmount = $quotation->deposit_amount ?? 0;
                if ($hasVat && $vatRate > 0) {
                    $subtotal = $totalAmount / (1 + $vatRate);
                    $taxAmount = $totalAmount - $subtotal;
                } else {
                    $subtotal = $totalAmount;
                    $taxAmount = 0;
                }
                
                return [
                    'subtotal' => round($subtotal, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'total_amount' => $totalAmount
                ];

            case 'partial':
                $totalAmount = $invoiceData['custom_amount'] ?? 0;
                if ($hasVat && $vatRate > 0) {
                    $subtotal = $totalAmount / (1 + $vatRate);
                    $taxAmount = $totalAmount - $subtotal;
                } else {
                    $subtotal = $totalAmount;
                    $taxAmount = 0;
                }
                
                return [
                    'subtotal' => round($subtotal, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'total_amount' => $totalAmount
                ];

            default:
                throw new \Exception('Invalid invoice type');
        }
    }

    /**
     * คำนวณวันครบกำหนดชำระ
     */
    private function calculateDueDate($paymentTerms)
    {
        $days = 30; // Default 30 days

        if (preg_match('/(\d+)/', $paymentTerms, $matches)) {
            $days = intval($matches[1]);
        }

        return now()->addDays($days)->format('Y-m-d');
    }

    /**
     * สร้างเนื้อหา PDF (placeholder)
     */
    private function generatePdfContent($invoice)
    {
        return "
TNP GROUP
ใบแจ้งหนี้ {$invoice->number}

ลูกค้า: {$invoice->customer_company}
เลขภาษี: {$invoice->customer_tax_id}
ที่อยู่: {$invoice->customer_address}

รายละเอียดงาน:
{$invoice->work_name}
จำนวน: {$invoice->quantity}

ราคา:
ยอดก่อนภาษี: " . number_format($invoice->subtotal, 2) . " บาท
ภาษีมูลค่าเพิ่ม: " . number_format($invoice->tax_amount, 2) . " บาท
ยอดรวม: " . number_format($invoice->total_amount, 2) . " บาท

เงื่อนไขการชำระ: {$invoice->payment_terms}
วันครบกำหนด: {$invoice->due_date}

หมายเหตุ:
{$invoice->notes}

วันที่: " . now()->format('d/m/Y') . "
";
    }
}
