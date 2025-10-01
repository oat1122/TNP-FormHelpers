<?php

namespace App\Services\Accounting;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\DocumentAttachment;
use App\Models\Accounting\InvoiceItem;
use App\Models\Accounting\Invoice;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

class DeliveryNoteService
{
    protected $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    /**
     * Get invoice items that can be converted to delivery notes
     */
    public function getInvoiceItemSources($filters = [], $perPage = 20)
    {
        try {
            $query = InvoiceItem::with(['invoice' => function ($invoiceQuery) {
                // Build a safe select list that only includes existing columns
                $columns = [
                    'id',
                    'number',
                    'status',
                    'customer_company',
                    'customer_firstname',
                    'customer_lastname',
                    'customer_tel_1',
                    'customer_address',
                    'company_id',
                    'customer_id',
                    'created_at',
                    'updated_at',
                ];
                // Include work_name only if it exists in the current schema
                if (Schema::hasColumn('invoices', 'work_name')) {
                    $columns[] = 'work_name';
                }

                $invoiceQuery->select($columns);
            }])->whereHas('invoice', function ($invoiceQuery) {
                $invoiceQuery->whereIn('status', ['sent', 'partial_paid', 'fully_paid', 'approved']);
            });

            if (!empty($filters['search'])) {
                $search = '%' . $filters['search'] . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('item_name', 'like', $search)
                      ->orWhere('pattern', 'like', $search)
                      ->orWhere('color', 'like', $search)
                      ->orWhere('size', 'like', $search)
                      ->orWhereHas('invoice', function ($invoiceQuery) use ($search) {
                          $invoiceQuery->where('number', 'like', $search)
                              ->orWhere('customer_company', 'like', $search);
                          // Search by work_name only if the column exists
                          if (Schema::hasColumn('invoices', 'work_name')) {
                              $invoiceQuery->orWhere('work_name', 'like', $search);
                          }
                      });
                });
            }

            if (!empty($filters['invoice_status'])) {
                $query->whereHas('invoice', function ($invoiceQuery) use ($filters) {
                    $invoiceQuery->where('status', $filters['invoice_status']);
                });
            }

            if (!empty($filters['company_id'])) {
                $query->whereHas('invoice', function ($invoiceQuery) use ($filters) {
                    $invoiceQuery->where('company_id', $filters['company_id']);
                });
            }

            if (!empty($filters['customer_id'])) {
                $query->whereHas('invoice', function ($invoiceQuery) use ($filters) {
                    $invoiceQuery->where('customer_id', $filters['customer_id']);
                });
            }

            if (!empty($filters['invoice_id'])) {
                $query->where('invoice_id', $filters['invoice_id']);
            }

            $query->orderByDesc('created_at');

            $paginator = $query->paginate($perPage);

            return $paginator->through(function (InvoiceItem $item) {
                $invoice = $item->invoice;

                return [
                    'invoice_item_id' => $item->id,
                    'invoice_id' => $invoice?->id,
                    'invoice_number' => $invoice?->number,
                    'invoice_status' => $invoice?->status,
                    'company_id' => $invoice?->company_id,
                    'customer_id' => $invoice?->customer_id,
                    'customer_company' => $invoice?->customer_company,
                    'customer_name' => trim(($invoice?->customer_firstname ?? '') . ' ' . ($invoice?->customer_lastname ?? '')),
                    'customer_phone' => $invoice?->customer_tel_1,
                    'delivery_address' => $invoice?->customer_address,
                    'work_name' => $invoice?->work_name ?? $item->item_name,
                    'item_name' => $item->item_name,
                    'item_description' => $item->item_description,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'unit_price' => $item->unit_price,
                    'final_amount' => $item->final_amount,
                    'sequence_order' => $item->sequence_order,
                    'created_at' => $invoice?->created_at,
                ];
            });
        } catch (\Exception $e) {
            Log::error('DeliveryNoteService::getInvoiceItemSources error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get invoices that can be converted to delivery notes (with their items included)
     */
    public function getInvoiceSources($filters = [], $perPage = 20)
    {
        try {
            $query = Invoice::with(['items', 'customer'])
                ->whereIn('status', ['sent', 'partial_paid', 'fully_paid', 'approved']);

            if (!empty($filters['search'])) {
                $search = '%' . $filters['search'] . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', $search)
                      ->orWhere('customer_company', 'like', $search)
                      ->orWhere('customer_firstname', 'like', $search)
                      ->orWhere('customer_lastname', 'like', $search);
                    
                    // Search by work_name only if the column exists
                    if (Schema::hasColumn('invoices', 'work_name')) {
                        $q->orWhere('work_name', 'like', $search);
                    }

                    // Search in related invoice items
                    $q->orWhereHas('items', function ($itemQuery) use ($search) {
                        $itemQuery->where('item_name', 'like', $search)
                                 ->orWhere('pattern', 'like', $search)
                                 ->orWhere('color', 'like', $search);
                    });
                });
            }

            if (!empty($filters['status'])) {
                $statuses = is_array($filters['status']) ? $filters['status'] : [$filters['status']];
                $query->whereIn('status', $statuses);
            }

            if (!empty($filters['company_id'])) {
                $query->where('company_id', $filters['company_id']);
            }

            if (!empty($filters['customer_id'])) {
                $query->where('customer_id', $filters['customer_id']);
            }

            $query->orderByDesc('created_at');

            $paginator = $query->paginate($perPage);

            return $paginator->through(function (Invoice $invoice) {
                $data = [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'status' => $invoice->status,
                    'company_id' => $invoice->company_id,
                    'customer_id' => $invoice->customer_id,
                    'customer_company' => $invoice->customer_company,
                    'customer_firstname' => $invoice->customer_firstname,
                    'customer_lastname' => $invoice->customer_lastname,
                    'customer_address' => $invoice->customer_address,
                    'customer_tel_1' => $invoice->customer_tel_1,
                    'total_amount' => $invoice->total_amount,
                    'created_at' => $invoice->created_at,
                    'updated_at' => $invoice->updated_at,
                ];

                // Include work_name only if it exists in the current schema
                if (Schema::hasColumn('invoices', 'work_name')) {
                    $data['work_name'] = $invoice->work_name;
                }

                // Include customer relationship data if available
                if ($invoice->customer) {
                    $data['customer'] = [
                        'cus_company' => $invoice->customer->cus_company ?? null,
                        'cus_address' => $invoice->customer->cus_address ?? null,
                    ];
                }

                // Include invoice items
                $data['items'] = $invoice->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'item_name' => $item->item_name,
                        'item_description' => $item->item_description,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'unit_price' => $item->unit_price,
                        'final_amount' => $item->final_amount,
                        'subtotal' => $item->subtotal,
                        'pattern' => $item->pattern,
                        'color' => $item->color,
                        'size' => $item->size,
                        'work_name' => $item->work_name ?? $item->item_name,
                        'sequence_order' => $item->sequence_order,
                    ];
                });

                return $data;
            });
        } catch (\Exception $e) {
            Log::error('DeliveryNoteService::getInvoiceSources error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Delivery Note จาก Receipt (One-Click Conversion)
     */
    public function createFromReceipt($receiptId, $deliveryData, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            // ตรวจสอบสถานะ Receipt
            if ($receipt->status !== 'approved') {
                throw new \Exception('Receipt must be approved before creating delivery note');
            }

            // ตรวจสอบว่าได้สร้าง Delivery Note แล้วหรือยัง
            $existingDeliveryNote = DeliveryNote::where('receipt_id', $receiptId)->first();
            if ($existingDeliveryNote) {
                throw new \Exception('Delivery note already exists for this receipt');
            }

            // ดึงข้อมูล Auto-fill จาก Receipt
            $autofillData = $this->autofillService->getCascadeAutofillForDeliveryNote($receiptId);

            // สร้าง Delivery Note
            $deliveryNote = new DeliveryNote();
            $deliveryNote->id = \Illuminate\Support\Str::uuid();
            $deliveryNote->company_id = $receipt->company_id
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $deliveryNote->number = DeliveryNote::generateDeliveryNoteNumber($deliveryNote->company_id);
            $deliveryNote->invoice_id = $data['invoice_id'] ?? null;
            $deliveryNote->invoice_item_id = $data['invoice_item_id'] ?? null;
            $deliveryNote->receipt_id = $receipt->id;
            
            // Auto-fill ข้อมูลจาก Receipt
            $deliveryNote->customer_id = $autofillData['customer_id'];
            $deliveryNote->customer_company = $autofillData['customer_company'];
            $deliveryNote->customer_address = $autofillData['customer_address'];
            $deliveryNote->customer_zip_code = $autofillData['customer_zip_code'];
            $deliveryNote->customer_tel_1 = $autofillData['customer_tel_1'];
            $deliveryNote->customer_firstname = $autofillData['customer_firstname'];
            $deliveryNote->customer_lastname = $autofillData['customer_lastname'];
            $deliveryNote->work_name = $autofillData['work_name'];
            $deliveryNote->quantity = $autofillData['quantity'] ?? '1 ชิ้น';
            
            // ข้อมูลการจัดส่งจาก Input
            $deliveryNote->delivery_method = $deliveryData['delivery_method'] ?? 'courier';
            $deliveryNote->courier_company = $deliveryData['courier_company'] ?? null;
            $deliveryNote->delivery_address = $deliveryData['delivery_address'] ?? $autofillData['customer_address'];
            $deliveryNote->recipient_name = $deliveryData['recipient_name'] ?? $autofillData['customer_firstname'] . ' ' . $autofillData['customer_lastname'];
            $deliveryNote->recipient_phone = $deliveryData['recipient_phone'] ?? $autofillData['customer_tel_1'];
            $deliveryNote->delivery_date = $deliveryData['delivery_date'] ?? now()->addDays(1)->format('Y-m-d');
            $deliveryNote->delivery_notes = $deliveryData['delivery_notes'] ?? null;
            $deliveryNote->notes = $deliveryData['notes'] ?? null;
            
            // Status และ Audit
            $deliveryNote->status = 'preparing';
            $deliveryNote->created_by = $createdBy;
            
            $deliveryNote->save();

            // บันทึก Document History
            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                null,
                'preparing',
                'สร้างใบส่งของ',
                $createdBy,
                'สร้างใบส่งของจากใบเสร็จ ' . $receipt->receipt_number
            );

            DB::commit();

            return $deliveryNote->load(['receipt', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::createFromReceipt error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Delivery Note แบบ Manual
     */
    public function create($data, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = new DeliveryNote();
            $deliveryNote->id = \Illuminate\Support\Str::uuid();
            $deliveryNote->company_id = $data['company_id']
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $deliveryNote->number = DeliveryNote::generateDeliveryNoteNumber($deliveryNote->company_id);
            $deliveryNote->invoice_id = $data['invoice_id'] ?? null;
            $deliveryNote->invoice_item_id = $data['invoice_item_id'] ?? null;
            
            // ข้อมูลลูกค้า
            $deliveryNote->customer_id = $data['customer_id'] ?? null;
            $deliveryNote->customer_company = $data['customer_company'];
            $deliveryNote->customer_address = $data['customer_address'];
            $deliveryNote->customer_zip_code = $data['customer_zip_code'] ?? null;
            $deliveryNote->customer_tel_1 = $data['customer_tel_1'] ?? null;
            $deliveryNote->customer_firstname = $data['customer_firstname'] ?? null;
            $deliveryNote->customer_lastname = $data['customer_lastname'] ?? null;
            
            // ข้อมูลงาน
            $deliveryNote->work_name = $data['work_name'];
            $deliveryNote->quantity = $data['quantity'] ?? '1 ชิ้น';
            
            // ข้อมูลการจัดส่ง
            $deliveryNote->delivery_method = $data['delivery_method'] ?? 'courier';
            $deliveryNote->courier_company = $data['courier_company'] ?? null;
            $deliveryNote->tracking_number = $data['tracking_number'] ?? null;
            $deliveryNote->delivery_address = $data['delivery_address'];
            $deliveryNote->recipient_name = $data['recipient_name'];
            $deliveryNote->recipient_phone = $data['recipient_phone'] ?? null;
            $deliveryNote->delivery_date = $data['delivery_date'] ?? now()->addDays(1)->format('Y-m-d');
            $deliveryNote->delivery_notes = $data['delivery_notes'] ?? null;
            $deliveryNote->notes = $data['notes'] ?? null;
            
            // Status และ Audit
            $deliveryNote->status = 'preparing';
            $deliveryNote->created_by = $createdBy;
            
            $deliveryNote->save();

            // บันทึก Document History
            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                null,
                'preparing',
                'สร้างใบส่งของ',
                $createdBy,
                'สร้างใบส่งของแบบ Manual'
            );

            DB::commit();

            return $deliveryNote->load(['customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::create error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปเดต Delivery Note
     */
    public function update($deliveryNoteId, $data, $updatedBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            // ตรวจสอบสถานะ - อนุญาตแก้ไขเฉพาะสถานะ preparing
            if ($deliveryNote->status !== 'preparing') {
                throw new \Exception('Only delivery notes in preparing status can be updated');
            }

            $oldData = $deliveryNote->toArray();

            // อัปเดตข้อมูล
            $deliveryNote->fill(array_filter($data, function($value) {
                return $value !== null;
            }));
            
            $deliveryNote->save();

            // บันทึกการเปลี่ยนแปลง
            $changes = array_diff_assoc($deliveryNote->toArray(), $oldData);
            if (!empty($changes)) {
                DocumentHistory::logAction(
                    'delivery_note',
                    $deliveryNote->id,
                    'updated',
                    $updatedBy,
                    'แก้ไขใบส่งของ: ' . implode(', ', array_keys($changes))
                );
            }

            DB::commit();

            return $deliveryNote->load(['receipt', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการ Delivery Notes พร้อม Filter
     */
    public function getList($filters = [], $perPage = 20)
    {
        try {
            $query = DeliveryNote::with(['receipt', 'invoice', 'invoiceItem', 'customer', 'creator']);

            // Apply filters
            if (!empty($filters['search'])) {
                $search = '%' . $filters['search'] . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', $search)
                      ->orWhere('customer_company', 'like', $search)
                      ->orWhere('work_name', 'like', $search)
                      ->orWhere('recipient_name', 'like', $search)
                      ->orWhere('tracking_number', 'like', $search)
                      ->orWhereHas('invoice', function ($invoiceQuery) use ($search) {
                          $invoiceQuery->where('number', 'like', $search)
                              ->orWhere('customer_company', 'like', $search)
                              ->orWhere('work_name', 'like', $search);
                      })
                      ->orWhereHas('invoiceItem', function ($itemQuery) use ($search) {
                          $itemQuery->where('item_name', 'like', $search);
                      });
                });
            }

            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (!empty($filters['delivery_method'])) {
                $query->where('delivery_method', $filters['delivery_method']);
            }

            if (!empty($filters['customer_id'])) {
                $query->where('customer_id', $filters['customer_id']);
            }

            if (!empty($filters['invoice_id'])) {
                $query->where('invoice_id', $filters['invoice_id']);
            }

            if (!empty($filters['invoice_item_id'])) {
                $query->where('invoice_item_id', $filters['invoice_item_id']);
            }

            if (!empty($filters['courier_company'])) {
                $query->where('courier_company', $filters['courier_company']);
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('delivery_date', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('delivery_date', '<=', $filters['date_to']);
            }

            return $query->orderBy('created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * เริ่มการจัดส่ง (Preparing → Shipping)
     */
    public function startShipping($deliveryNoteId, $shippingData, $shippedBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if ($deliveryNote->status !== 'preparing') {
                throw new \Exception('Only delivery notes in preparing status can be shipped');
            }

            // อัปเดตสถานะและข้อมูลการจัดส่ง
            $deliveryNote->status = 'shipping';
            
            if (!empty($shippingData['tracking_number'])) {
                $deliveryNote->tracking_number = $shippingData['tracking_number'];
            }
            
            if (!empty($shippingData['courier_company'])) {
                $deliveryNote->courier_company = $shippingData['courier_company'];
            }

            $deliveryNote->save();

            // บันทึก History
            $notes = "เริ่มการจัดส่ง";
            if (!empty($shippingData['tracking_number'])) {
                $notes .= " - Tracking: " . $shippingData['tracking_number'];
            }
            if (!empty($shippingData['courier_company'])) {
                $notes .= " - ผู้ส่ง: " . $shippingData['courier_company'];
            }

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                'preparing',
                'shipping',
                'เริ่มการจัดส่ง',
                $shippedBy,
                $notes
            );

            DB::commit();

            return $deliveryNote->load(['receipt', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::startShipping error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปเดตสถานะการขนส่ง (Shipping → In Transit)
     */
    public function updateTrackingStatus($deliveryNoteId, $trackingData, $updatedBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if (!in_array($deliveryNote->status, ['shipping', 'in_transit'])) {
                throw new \Exception('Tracking status can only be updated for shipped or in-transit items');
            }

            $deliveryNote->status = 'in_transit';
            $deliveryNote->save();

            // บันทึก Tracking Event
            $notes = $trackingData['status_description'] ?? 'อัปเดตสถานะการติดตาม';
            if (!empty($trackingData['location'])) {
                $notes .= " - สถานที่: " . $trackingData['location'];
            }

            DocumentHistory::logAction(
                'delivery_note',
                $deliveryNote->id,
                'tracking_update',
                $updatedBy,
                $notes
            );

            DB::commit();

            return $deliveryNote->load(['receipt', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::updateTrackingStatus error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ยืนยันการส่งสำเร็จ (In Transit → Delivered)
     */
    public function markAsDelivered($deliveryNoteId, $deliveryData, $deliveredBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if (!in_array($deliveryNote->status, ['shipping', 'in_transit'])) {
                throw new \Exception('Only shipped or in-transit items can be marked as delivered');
            }

            $deliveryNote->status = 'delivered';
            $deliveryNote->delivered_at = now();
            $deliveryNote->delivered_by = $deliveredBy;

            if (!empty($deliveryData['delivery_notes'])) {
                $deliveryNote->delivery_notes = $deliveryData['delivery_notes'];
            }

            $deliveryNote->save();

            // บันทึก History
            $notes = "ส่งสำเร็จ";
            if (!empty($deliveryData['recipient_name'])) {
                $notes .= " - ผู้รับ: " . $deliveryData['recipient_name'];
            }
            if (!empty($deliveryData['delivery_notes'])) {
                $notes .= " - หมายเหตุ: " . $deliveryData['delivery_notes'];
            }

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                'in_transit',
                'delivered',
                'ส่งสำเร็จ',
                $deliveredBy,
                $notes
            );

            DB::commit();

            return $deliveryNote->load(['receipt', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::markAsDelivered error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ปิดงาน (Delivered → Completed)
     */
    public function markAsCompleted($deliveryNoteId, $completionData, $completedBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if ($deliveryNote->status !== 'delivered') {
                throw new \Exception('Only delivered items can be marked as completed');
            }

            $deliveryNote->status = 'completed';
            
            if (!empty($completionData['notes'])) {
                $deliveryNote->notes = $completionData['notes'];
            }

            $deliveryNote->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                'delivered',
                'completed',
                'ปิดงาน',
                $completedBy,
                $completionData['notes'] ?? 'ปิดงานเรียบร้อย'
            );

            DB::commit();

            return $deliveryNote->load(['receipt', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::markAsCompleted error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * รายงานปัญหา (Any Status → Failed)
     */
    public function markAsFailed($deliveryNoteId, $failureData, $reportedBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            $oldStatus = $deliveryNote->status;
            $deliveryNote->status = 'failed';
            
            if (!empty($failureData['notes'])) {
                $deliveryNote->notes = $failureData['notes'];
            }

            $deliveryNote->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                $oldStatus,
                'failed',
                'รายงานปัญหา',
                $reportedBy,
                $failureData['reason'] ?? 'ไม่สามารถจัดส่งได้'
            );

            DB::commit();

            return $deliveryNote->load(['receipt', 'customer', 'creator']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::markAsFailed error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปโหลดหลักฐานการจัดส่ง
     */
    public function uploadEvidence($deliveryNoteId, $files, $description = null, $uploadedBy = null)
    {
        try {
            DB::beginTransaction();

            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);
            $uploadedFiles = [];

            foreach ($files as $file) {
                // สร้างชื่อไฟล์ที่ไม่ซ้ำ
                $filename = time() . '_' . \Illuminate\Support\Str::random(10) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('delivery_notes/evidence', $filename, 'public');

                // บันทึกข้อมูลไฟล์
                $attachment = new DocumentAttachment();
                $attachment->id = \Illuminate\Support\Str::uuid();
                $attachment->document_type = 'delivery_note';
                $attachment->document_id = $deliveryNote->id;
                $attachment->file_name = $filename;
                $attachment->original_name = $file->getClientOriginalName();
                $attachment->file_path = $path;
                $attachment->file_size = $file->getSize();
                $attachment->mime_type = $file->getMimeType();
                $attachment->description = $description;
                $attachment->uploaded_by = $uploadedBy;
                $attachment->save();

                $uploadedFiles[] = $attachment;
            }

            // บันทึก History
            DocumentHistory::logAction(
                'delivery_note',
                $deliveryNote->id,
                'evidence_uploaded',
                $uploadedBy,
                'อัปโหลดหลักฐานการจัดส่ง: ' . count($files) . ' ไฟล์'
            );

            DB::commit();

            return $uploadedFiles;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeliveryNoteService::uploadEvidence error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง PDF ใบส่งของ
     */
    public function generatePdf($deliveryNoteId)
    {
        try {
            $deliveryNote = DeliveryNote::with(['receipt', 'customer', 'creator'])->findOrFail($deliveryNoteId);

            // TODO: Implement actual PDF generation
            // สำหรับตอนนี้ return mock data
            return [
                'pdf_url' => '/storage/delivery_notes/pdfs/' . $deliveryNote->number . '.pdf',
                'filename' => 'ใบส่งของ_' . $deliveryNote->number . '.pdf',
                'size' => 245760 // Mock size
            ];

        } catch (\Exception $e) {
            Log::error('DeliveryNoteService::generatePdf error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการบริษัทขนส่ง
     */
    public function getCourierCompanies()
    {
        return [
            [
                'id' => 'kerry',
                'name' => 'Kerry Express',
                'services' => ['standard', 'express'],
                'tracking_url' => 'https://th.kerryexpress.com/en/track/?track='
            ],
            [
                'id' => 'thailand_post',
                'name' => 'ไปรษณีย์ไทย',
                'services' => ['ems', 'registered'],
                'tracking_url' => 'https://track.thailandpost.co.th/?trackNumber='
            ],
            [
                'id' => 'flash',
                'name' => 'Flash Express',
                'services' => ['standard', 'same_day'],
                'tracking_url' => 'https://www.flashexpress.co.th/tracking/?se='
            ],
            [
                'id' => 'j_t',
                'name' => 'J&T Express',
                'services' => ['standard', 'express'],
                'tracking_url' => 'https://www.jtexpress.co.th/index/query/gzquery.html?bills='
            ]
        ];
    }

    /**
     * ดึงรายการวิธีการจัดส่ง
     */
    public function getDeliveryMethods()
    {
        return [
            [
                'value' => 'self_delivery',
                'label' => 'ส่งเอง',
                'description' => 'พนักงานบริษัทส่งเอง',
                'requires_courier' => false,
                'requires_tracking' => false
            ],
            [
                'value' => 'courier',
                'label' => 'บริษัทขนส่ง',
                'description' => 'ใช้บริการบริษัทขนส่ง',
                'requires_courier' => true,
                'requires_tracking' => true
            ],
            [
                'value' => 'customer_pickup',
                'label' => 'ลูกค้ามารับเอง',
                'description' => 'ลูกค้ามารับที่บริษัท',
                'requires_courier' => false,
                'requires_tracking' => false
            ]
        ];
    }

    /**
     * ดึง Timeline การจัดส่ง
     */
    public function getDeliveryTimeline($deliveryNoteId)
    {
        try {
            $deliveryNote = DeliveryNote::with(['documentHistory' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])->findOrFail($deliveryNoteId);

            $timeline = [];
            
            foreach ($deliveryNote->documentHistory as $history) {
                $timeline[] = [
                    'id' => $history->id,
                    'timestamp' => $history->created_at,
                    'status' => $history->new_status ?? $history->action,
                    'description' => $history->description,
                    'notes' => $history->notes,
                    'user' => $history->user->user_nickname ?? 'System'
                ];
            }

            return $timeline;

        } catch (\Exception $e) {
            Log::error('DeliveryNoteService::getDeliveryTimeline error: ' . $e->getMessage());
            throw $e;
        }
    }
}

