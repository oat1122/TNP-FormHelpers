<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\OrderItemsTracking;
use App\Models\Accounting\DocumentHistory;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuotationService
{
    protected $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    /**
     * สร้าง Quotation จาก Pricing Request
     */
    public function createFromPricingRequest($pricingRequestId, $additionalData = [], $createdBy = null)
    {
        try {
            DB::beginTransaction();

            // ดึงข้อมูล Auto-fill
            $autofillData = $this->autofillService->getAutofillDataFromPricingRequest($pricingRequestId);

            // สร้าง Quotation
            $quotation = new Quotation();
            $quotation->id = \Illuminate\Support\Str::uuid();
            $quotation->number = Quotation::generateQuotationNumber();
            $quotation->pricing_request_id = $autofillData['pr_id'];
            
            // Auto-fill ข้อมูลลูกค้า
            $quotation->customer_id = $autofillData['pr_cus_id'];
            $quotation->customer_company = $autofillData['cus_company'];
            $quotation->customer_tax_id = $autofillData['cus_tax_id'];
            $quotation->customer_address = $autofillData['cus_address'];
            $quotation->customer_zip_code = $autofillData['cus_zip_code'];
            $quotation->customer_tel_1 = $autofillData['cus_tel_1'];
            $quotation->customer_email = $autofillData['cus_email'];
            $quotation->customer_firstname = $autofillData['cus_firstname'];
            $quotation->customer_lastname = $autofillData['cus_lastname'];

            // Auto-fill ข้อมูลงาน
            $quotation->work_name = $autofillData['pr_work_name'];
            $quotation->fabric_type = $autofillData['pr_fabric_type'];
            $quotation->pattern = $autofillData['pr_pattern'];
            $quotation->color = $autofillData['pr_color'];
            $quotation->sizes = $autofillData['pr_sizes'];
            $quotation->quantity = $autofillData['pr_quantity'];
            $quotation->silk_screen = $autofillData['pr_silk'];
            $quotation->dft_screen = $autofillData['pr_dft'];
            $quotation->embroider = $autofillData['pr_embroider'];
            $quotation->sub_screen = $autofillData['pr_sub'];
            $quotation->other_screen = $autofillData['pr_other_screen'];
            $quotation->product_image = $autofillData['pr_image'];
            $quotation->due_date = $autofillData['pr_due_date'];
            $quotation->notes = $autofillData['initial_notes'];

            // ข้อมูลเพิ่มเติมจาก user input
            $quotation->subtotal = $additionalData['subtotal'] ?? 0;
            $quotation->tax_amount = $additionalData['tax_amount'] ?? 0;
            $quotation->total_amount = $additionalData['total_amount'] ?? 0;
            $quotation->deposit_percentage = $additionalData['deposit_percentage'] ?? 0;
            $quotation->deposit_amount = $additionalData['deposit_amount'] ?? 0;
            $quotation->payment_terms = $additionalData['payment_terms'] ?? null;
            
            // Append additional notes ถ้ามี
            if (!empty($additionalData['notes'])) {
                $quotation->notes = $quotation->notes ? $quotation->notes . "\n\n" . $additionalData['notes'] : $additionalData['notes'];
            }

            $quotation->status = 'draft';
            $quotation->created_by = $createdBy;
            $quotation->save();

            // สร้าง Order Items Tracking
            if ($quotation->quantity && is_numeric($quotation->quantity)) {
                OrderItemsTracking::create([
                    'quotation_id' => $quotation->id,
                    'pricing_request_id' => $pricingRequestId,
                    'work_name' => $quotation->work_name,
                    'fabric_type' => $quotation->fabric_type,
                    'pattern' => $quotation->pattern,
                    'color' => $quotation->color,
                    'sizes' => $quotation->sizes,
                    'ordered_quantity' => intval($quotation->quantity),
                    'unit_price' => $quotation->total_amount > 0 ? $quotation->total_amount / intval($quotation->quantity) : 0
                ]);
            }

            // บันทึก History
            DocumentHistory::logCreation('quotation', $quotation->id, $createdBy, 'สร้างจาก Pricing Request: ' . $autofillData['pr_work_name']);

            DB::commit();

            return $quotation->load(['customer', 'pricingRequest', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::createFromPricingRequest error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Quotation ใหม่ (ไม่ได้จาก Pricing Request)
     */
    public function create($data, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = new Quotation();
            $quotation->id = \Illuminate\Support\Str::uuid();
            $quotation->number = Quotation::generateQuotationNumber();
            $quotation->fill($data);
            $quotation->status = 'draft';
            $quotation->created_by = $createdBy;
            $quotation->save();

            // สร้าง Order Items Tracking ถ้ามีข้อมูลจำนวน
            if (!empty($quotation->quantity) && is_numeric($quotation->quantity)) {
                OrderItemsTracking::create([
                    'quotation_id' => $quotation->id,
                    'work_name' => $quotation->work_name,
                    'fabric_type' => $quotation->fabric_type,
                    'pattern' => $quotation->pattern,
                    'color' => $quotation->color,
                    'sizes' => $quotation->sizes,
                    'ordered_quantity' => intval($quotation->quantity),
                    'unit_price' => $quotation->total_amount > 0 ? $quotation->total_amount / intval($quotation->quantity) : 0
                ]);
            }

            // บันทึก History
            DocumentHistory::logCreation('quotation', $quotation->id, $createdBy, 'สร้างใบเสนอราคาใหม่');

            DB::commit();

            return $quotation->load(['customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::create error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปเดต Quotation
     */
    public function update($id, $data, $updatedBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            $oldStatus = $quotation->status;

            $quotation->fill($data);
            $quotation->save();

            // อัปเดต Order Items Tracking ถ้าจำนวนเปลี่ยน
            if (isset($data['quantity']) && is_numeric($data['quantity'])) {
                $tracking = OrderItemsTracking::where('quotation_id', $id)->first();
                if ($tracking) {
                    $tracking->ordered_quantity = intval($data['quantity']);
                    $tracking->unit_price = $quotation->total_amount > 0 ? $quotation->total_amount / intval($data['quantity']) : 0;
                    $tracking->save();
                }
            }

            // บันทึก History ถ้าสถานะเปลี่ยน
            if ($oldStatus !== $quotation->status) {
                DocumentHistory::logStatusChange('quotation', $quotation->id, $oldStatus, $quotation->status, $updatedBy);
            } else {
                DocumentHistory::logAction('quotation', $quotation->id, 'updated', $updatedBy, 'แก้ไขข้อมูลใบเสนอราคา');
            }

            DB::commit();

            return $quotation->load(['customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งใบเสนอราคาเพื่อขออนุมัติ
     */
    public function submitForReview($id, $submittedBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            if ($quotation->status !== 'draft') {
                throw new \Exception('Can only submit draft quotations for review');
            }

            $quotation->status = 'pending_review';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logStatusChange('quotation', $quotation->id, 'draft', 'pending_review', $submittedBy, 'ส่งขออนุมัติ');

            DB::commit();

            return $quotation;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::submitForReview error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อนุมัติใบเสนอราคา
     */
    public function approve($id, $approvedBy = null, $notes = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            if ($quotation->status !== 'pending_review') {
                throw new \Exception('Can only approve quotations that are pending review');
            }

            $quotation->status = 'approved';
            $quotation->approved_by = $approvedBy;
            $quotation->approved_at = now();
            $quotation->save();

            // บันทึก History
            DocumentHistory::logApproval('quotation', $quotation->id, $approvedBy, $notes);

            DB::commit();

            return $quotation;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::approve error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ปฏิเสธใบเสนอราคา
     */
    public function reject($id, $rejectedBy = null, $reason = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            if ($quotation->status !== 'pending_review') {
                throw new \Exception('Can only reject quotations that are pending review');
            }

            $quotation->status = 'rejected';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logRejection('quotation', $quotation->id, $rejectedBy, $reason);

            DB::commit();

            return $quotation;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::reject error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * แปลงเป็น Invoice
     */
    public function convertToInvoice($id, $convertedBy = null, $additionalData = [])
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            if (!$quotation->canConvertToInvoice()) {
                throw new \Exception('Quotation cannot be converted to invoice in current status');
            }

            // ดึงข้อมูล Auto-fill
            $autofillData = $this->autofillService->getCascadeAutofillForInvoice($id);

            // สร้าง Invoice
            $invoice = new Invoice();
            $invoice->id = \Illuminate\Support\Str::uuid();
            $invoice->number = Invoice::generateInvoiceNumber();
            $invoice->quotation_id = $quotation->id;
            
            // Auto-fill ข้อมูลจาก Quotation
            foreach ($autofillData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            // ข้อมูลเพิ่มเติม
            foreach ($additionalData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            $invoice->status = 'draft';
            $invoice->created_by = $convertedBy;
            $invoice->save();

            // อัปเดตสถานะ Quotation
            $quotation->status = 'completed';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logAction('quotation', $quotation->id, 'converted', $convertedBy, 'แปลงเป็นใบแจ้งหนี้: ' . $invoice->number);
            DocumentHistory::logCreation('invoice', $invoice->id, $convertedBy, 'สร้างจากใบเสนอราคา: ' . $quotation->number);

            DB::commit();

            return $invoice->load(['quotation', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::convertToInvoice error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ลบใบเสนอราคา (Soft Delete)
     */
    public function delete($id, $deletedBy = null, $reason = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            // ตรวจสอบว่าสามารถลบได้หรือไม่
            if (in_array($quotation->status, ['approved', 'sent', 'completed'])) {
                throw new \Exception('Cannot delete quotation that has been approved, sent, or completed');
            }

            // Soft delete (ในที่นี้เปลี่ยนสถานะแทนการลบจริง)
            $quotation->status = 'deleted';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logAction('quotation', $quotation->id, 'deleted', $deletedBy, $reason ?? 'ลบใบเสนอราคา');

            DB::commit();

            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::delete error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการใบเสนอราคาพร้อม filter
     */
    public function getList($filters = [], $perPage = 15)
    {
        try {
            $query = Quotation::with(['customer', 'creator', 'pricingRequest'])
                            ->whereNotIn('status', ['deleted']);

            // Apply filters
            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (!empty($filters['customer_id'])) {
                $query->where('customer_id', $filters['customer_id']);
            }

            if (!empty($filters['created_by'])) {
                $query->where('created_by', $filters['created_by']);
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            if (!empty($filters['search'])) {
                $search = '%' . $filters['search'] . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', $search)
                      ->orWhere('work_name', 'like', $search)
                      ->orWhere('customer_company', 'like', $search);
                });
            }

            return $query->orderBy('created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('QuotationService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }
}
