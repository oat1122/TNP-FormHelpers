<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\QuotationItem;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\OrderItemsTracking;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\DocumentAttachment;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

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
            $quotation->company_id = $additionalData['company_id']
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            // เลขที่เอกสารจะถูกกำหนดตอนอนุมัติ เพื่อลดการสูญเสียเลขจากการสลับบริษัทระหว่างร่าง
            // Lean schema: primary pricing request linkage
            $quotation->primary_pricing_request_id = $autofillData['pr_id'] ?? null;

            // Auto-fill ข้อมูลลูกค้า (lean: เก็บ snapshot รวม + customer_id)
            $quotation->customer_id = $autofillData['pr_cus_id'] ?? null;
            $quotation->customer_snapshot = [
                'cus_company' => $autofillData['cus_company'] ?? null,
                'cus_tax_id' => $autofillData['cus_tax_id'] ?? null,
                'cus_address' => $autofillData['cus_address'] ?? null,
                'cus_zip_code' => $autofillData['cus_zip_code'] ?? null,
                'cus_tel_1' => $autofillData['cus_tel_1'] ?? null,
                'cus_email' => $autofillData['cus_email'] ?? null,
                'cus_firstname' => $autofillData['cus_firstname'] ?? null,
                'cus_lastname' => $autofillData['cus_lastname'] ?? null,
            ];

            // Auto-fill ข้อมูลงาน (lean: เก็บเฉพาะหัวใบและวันที่ครบกำหนด)
            $quotation->work_name = $autofillData['pr_work_name'] ?? null;
            $quotation->due_date = $autofillData['pr_due_date'] ?? null;
            $quotation->notes = $autofillData['initial_notes'] ?? null;

            // ป้องกัน client ส่ง number มา
            unset($additionalData['number']);

            // ข้อมูลเพิ่มเติมจาก user input
            $quotation->subtotal = $additionalData['subtotal'] ?? 0;
            $quotation->tax_amount = $additionalData['tax_amount'] ?? 0;
            // ⭐ New financial fields
            $quotation->special_discount_percentage = $additionalData['special_discount_percentage'] ?? 0;
            $quotation->special_discount_amount = $additionalData['special_discount_amount'] ?? 0;
            $quotation->has_withholding_tax = $additionalData['has_withholding_tax'] ?? false;
            $quotation->withholding_tax_percentage = $additionalData['withholding_tax_percentage'] ?? 0;
            $quotation->withholding_tax_amount = $additionalData['withholding_tax_amount'] ?? 0;
            $quotation->final_total_amount = $additionalData['final_total_amount'] ?? (($additionalData['total_amount'] ?? 0) - ($additionalData['special_discount_amount'] ?? 0) - ($additionalData['withholding_tax_amount'] ?? 0));
            $quotation->total_amount = $additionalData['total_amount'] ?? 0;
            // Sample images from UI (optional on create-from-PR)
            if (array_key_exists('sample_images', $additionalData)) {
                $quotation->sample_images = is_array($additionalData['sample_images']) ? $additionalData['sample_images'] : [];
            }
            // Deposit logic: allow either percentage or explicit amount via deposit_mode
            $depositMode = $additionalData['deposit_mode'] ?? 'percentage';
            if ($depositMode === 'amount' && isset($additionalData['deposit_amount'])) {
                $quotation->deposit_amount = max(0, floatval($additionalData['deposit_amount']));
                $baseFinal = $quotation->final_total_amount ?? (($additionalData['total_amount'] ?? 0) - ($additionalData['special_discount_amount'] ?? 0) - ($additionalData['withholding_tax_amount'] ?? 0));
                $quotation->deposit_percentage = $baseFinal > 0 ? round(($quotation->deposit_amount / $baseFinal) * 100, 4) : 0;
            } else {
                $quotation->deposit_percentage = $additionalData['deposit_percentage'] ?? 0;
                $baseFinal = $quotation->final_total_amount ?? (($additionalData['total_amount'] ?? 0) - ($additionalData['special_discount_amount'] ?? 0) - ($additionalData['withholding_tax_amount'] ?? 0));
                $pct = max(0, min(100, floatval($quotation->deposit_percentage)));
                $quotation->deposit_amount = round($baseFinal * ($pct/100), 2);
            }
            $quotation->deposit_mode = $depositMode;
            $quotation->payment_terms = $additionalData['payment_terms'] ?? null;
            
            // Append additional notes ถ้ามี
            if (!empty($additionalData['notes'])) {
                $quotation->notes = $quotation->notes ? $quotation->notes . "\n\n" . $additionalData['notes'] : $additionalData['notes'];
            }

            $quotation->status = 'draft';
            // Sample images from UI
            if (array_key_exists('sample_images', $additionalData)) {
                $quotation->sample_images = is_array($additionalData['sample_images']) ? $additionalData['sample_images'] : [];
            }
            // Ensure unique draft number to satisfy (company_id, number) unique index
            if (empty($quotation->number)) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
            $quotation->created_by = $createdBy;
            $quotation->save();

            // Recompute deposit if deposit_mode / amount provided (use $additionalData; avoid undefined $data)
            $recomputeDepositMode = $additionalData['deposit_mode'] ?? $quotation->deposit_mode ?? 'percentage';
            $finalBase = $quotation->final_total_amount ?? ($quotation->total_amount - $quotation->special_discount_amount - $quotation->withholding_tax_amount);
            if ($recomputeDepositMode === 'amount' && array_key_exists('deposit_amount', $additionalData)) {
                $amount = max(0, floatval($additionalData['deposit_amount']));
                if ($finalBase > 0) {
                    $quotation->deposit_percentage = round(($amount / $finalBase) * 100, 4);
                }
                $quotation->deposit_amount = min($amount, $finalBase);
            } elseif (array_key_exists('deposit_percentage', $additionalData)) {
                $pct = max(0, min(100, floatval($additionalData['deposit_percentage'])));
                $quotation->deposit_percentage = $pct;
                $quotation->deposit_amount = round($finalBase * ($pct/100), 2);
            }
            $quotation->deposit_mode = $recomputeDepositMode;
            $quotation->save();

            // Tracking logic optional in lean; skip creating OrderItemsTracking here to decouple quoting from production

            // บันทึก History
            DocumentHistory::logCreation('quotation', $quotation->id, $createdBy, 'สร้างจาก Pricing Request: ' . $autofillData['pr_work_name']);

            // มาร์ค Pricing Request ว่าใช้แล้วสำหรับสร้าง Quotation
            $this->autofillService->markPricingRequestAsUsed($pricingRequestId, $createdBy);

            DB::commit();

            return $quotation->load(['customer', 'pricingRequest', 'creator', 'company']);

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
            $quotation->company_id = $data['company_id']
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            // เลขที่เอกสารจะถูกกำหนดตอนอนุมัติ เท่านั้น
            // ป้องกัน client ส่ง number มา
            unset($data['number']);
            // ป้องกัน client ส่ง number มา
            unset($data['number']);
            $quotation->fill($data);

            // If any of the extended financial fields provided, recalc final_total_amount if not explicitly sent
            $financialKeys = ['special_discount_percentage','special_discount_amount','has_withholding_tax','withholding_tax_percentage','withholding_tax_amount','total_amount'];
            $touched = false;
            foreach ($financialKeys as $k) {
                if (array_key_exists($k, $data)) { $touched = true; break; }
            }
            if ($touched && !array_key_exists('final_total_amount', $data)) {
                $quotation->final_total_amount = ($quotation->total_amount - $quotation->special_discount_amount - $quotation->withholding_tax_amount);
            }
            // Ensure financial extended fields are set even if omitted (fill might already cover if fillable)
            $quotation->special_discount_percentage = $data['special_discount_percentage'] ?? ($quotation->special_discount_percentage ?? 0);
            $quotation->special_discount_amount = $data['special_discount_amount'] ?? ($quotation->special_discount_amount ?? 0);
            $quotation->has_withholding_tax = $data['has_withholding_tax'] ?? ($quotation->has_withholding_tax ?? false);
            $quotation->withholding_tax_percentage = $data['withholding_tax_percentage'] ?? ($quotation->withholding_tax_percentage ?? 0);
            $quotation->withholding_tax_amount = $data['withholding_tax_amount'] ?? ($quotation->withholding_tax_amount ?? 0);
            $quotation->final_total_amount = $data['final_total_amount'] ?? ($quotation->total_amount - $quotation->special_discount_amount - $quotation->withholding_tax_amount);
            $quotation->status = 'draft';
            // Ensure unique draft number to satisfy (company_id, number) unique index
            if (empty($quotation->number)) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
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

            return $quotation->load(['customer', 'creator', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::create error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Quotation จาก Multiple Pricing Requests
     */
    public function createFromMultiplePricingRequests($pricingRequestIds, $customerId, $additionalData = [], $createdBy = null)
    {
        try {
            DB::beginTransaction();

            Log::info('Creating quotation from multiple pricing requests', [
                'pricing_request_ids' => $pricingRequestIds,
                'customer_id' => $customerId,
                'created_by' => $createdBy
            ]);

            // ตรวจสอบว่า pricing requests ทั้งหมดมีอยู่จริง
            $pricingRequests = \DB::table('pricing_requests')
                ->whereIn('pr_id', $pricingRequestIds)
                ->where('pr_cus_id', $customerId)
                ->get();

            if ($pricingRequests->count() !== count($pricingRequestIds)) {
                throw new \Exception('Some pricing requests not found or do not belong to the specified customer');
            }

            // ดึงข้อมูลลูกค้า
            $customer = \DB::table('master_customers')->where('cus_id', $customerId)->first();
            if (!$customer) {
                throw new \Exception('Customer not found');
            }

            // คำนวณยอดรวมจาก pricing requests
            $totalAmount = $additionalData['total_amount'] ?? 0;
            $subtotal = $additionalData['subtotal'] ?? 0;
            $taxAmount = $additionalData['tax_amount'] ?? 0;

            // สร้าง Quotation
            $quotation = new Quotation();
            $quotation->id = \Illuminate\Support\Str::uuid();
            $quotation->company_id = $additionalData['company_id']
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            // เลขที่เอกสารจะถูกกำหนดตอนอนุมัติ เท่านั้น

            // ⭐ รองรับ multiple primary pricing request IDs (พร้อม backward compatibility)
            if (Schema::hasColumn('quotations', 'primary_pricing_request_ids')) {
                $quotation->primary_pricing_request_ids = $pricingRequestIds; // จะถูก cast เป็น JSON โดย Model
            } else {
                $quotation->primary_pricing_request_id = $pricingRequestIds[0] ?? null;
            }
            
            // Auto-fill ข้อมูลลูกค้า
            $quotation->customer_id = $customer->cus_id;
            $quotation->customer_snapshot = [
                'cus_company' => $customer->cus_company,
                'cus_tax_id' => $customer->cus_tax_id,
                'cus_address' => $customer->cus_address,
                'cus_zip_code' => $customer->cus_zip_code,
                'cus_tel_1' => $customer->cus_tel_1,
                'cus_email' => $customer->cus_email,
                'cus_firstname' => $customer->cus_firstname,
                'cus_lastname' => $customer->cus_lastname,
            ];

            // รวมข้อมูลงานจาก pricing requests ทั้งหมด
            $workNames = $pricingRequests->pluck('pr_work_name')->filter()->toArray();
            $quotation->work_name = implode(', ', $workNames);
            
            // Lean: ไม่เก็บ quantity บนหัวใบ

            // ข้อมูลราคา
            $quotation->subtotal = $subtotal;
            $quotation->tax_amount = $taxAmount;
            // ⭐ New financial fields (multi-create)
            $quotation->special_discount_percentage = $additionalData['special_discount_percentage'] ?? 0;
            $quotation->special_discount_amount = $additionalData['special_discount_amount'] ?? 0;
            $quotation->has_withholding_tax = $additionalData['has_withholding_tax'] ?? false;
            $quotation->withholding_tax_percentage = $additionalData['withholding_tax_percentage'] ?? 0;
            $quotation->withholding_tax_amount = $additionalData['withholding_tax_amount'] ?? 0;
            $quotation->final_total_amount = $additionalData['final_total_amount'] ?? ($totalAmount - ($additionalData['special_discount_amount'] ?? 0) - ($additionalData['withholding_tax_amount'] ?? 0));
            $quotation->total_amount = $totalAmount;
            // Sample images from UI
            if (array_key_exists('sample_images', $additionalData)) {
                $quotation->sample_images = is_array($additionalData['sample_images']) ? $additionalData['sample_images'] : [];
            }

            // ข้อมูลการชำระเงิน
            $depositMode = $additionalData['deposit_mode'] ?? 'percentage';
            if ($depositMode === 'amount' && isset($additionalData['deposit_amount'])) {
                $quotation->deposit_amount = max(0, floatval($additionalData['deposit_amount']));
                $finalBase = $quotation->final_total_amount ?? ($totalAmount - ($additionalData['special_discount_amount'] ?? 0) - ($additionalData['withholding_tax_amount'] ?? 0));
                $quotation->deposit_percentage = $finalBase > 0 ? round(($quotation->deposit_amount / $finalBase) * 100, 4) : 0;
            } else {
                $quotation->deposit_percentage = $additionalData['deposit_percentage'] ?? 50;
                $pct = max(0, min(100, floatval($quotation->deposit_percentage)));
                $finalBase = $quotation->final_total_amount ?? ($totalAmount - ($additionalData['special_discount_amount'] ?? 0) - ($additionalData['withholding_tax_amount'] ?? 0));
                $quotation->deposit_amount = round($finalBase * ($pct/100), 2);
            }
            $quotation->deposit_mode = $depositMode;
            $quotation->payment_terms = $additionalData['payment_terms'] ?? 'credit_30';

            // หมายเหตุ
            // ป้องกัน client ส่ง number มา
            unset($additionalData['number']);
            $quotation->notes = $additionalData['additional_notes'] ?? '';

            $quotation->status = 'draft';
            // Ensure unique draft number to satisfy (company_id, number) unique index
            if (empty($quotation->number)) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
            $quotation->created_by = $createdBy;
            $quotation->save();

            // ⭐ สร้าง Junction Records ใน quotation_pricing_requests table (ถ้ามี)
            if (Schema::hasTable('quotation_pricing_requests')) {
                foreach ($pricingRequestIds as $index => $pricingRequestId) {
                    $pr = $pricingRequests->where('pr_id', $pricingRequestId)->first();

                    \DB::table('quotation_pricing_requests')->insert([
                        'id' => \Illuminate\Support\Str::uuid(),
                        'quotation_id' => $quotation->id,
                        'pricing_request_id' => $pricingRequestId,
                        'sequence_order' => $index + 1,
                        'allocated_amount' => $pr->pr_total_cost ?? 0,
                        'allocated_quantity' => $pr->pr_quantity ? intval($pr->pr_quantity) : 0,
                        'created_by' => $createdBy,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // สร้าง Order Items Tracking สำหรับแต่ละ pricing request
            // Lean: ไม่สร้าง OrderItemsTracking อัตโนมัติที่นี่ เพื่อลด coupling

            // สร้าง Quotation Items ถ้ามีส่งมา
            if (!empty($additionalData['items']) && is_array($additionalData['items'])) {
                foreach ($additionalData['items'] as $index => $item) {
                    QuotationItem::create([
                        'quotation_id' => $quotation->id,
                        'pricing_request_id' => $item['pricing_request_id'] ?? null,
                        'item_name' => $item['item_name'] ?? 'ไม่ระบุชื่องาน',
                        'item_description' => $item['item_description'] ?? null,
                        'sequence_order' => $item['sequence_order'] ?? ($index + 1),
                        'pattern' => $item['pattern'] ?? null,
                        'fabric_type' => $item['fabric_type'] ?? null,
                        'color' => $item['color'] ?? null,
                        'size' => $item['size'] ?? null,
                        'unit_price' => $item['unit_price'] ?? 0,
                        'quantity' => $item['quantity'] ?? 0,
                        'unit' => array_key_exists('unit', $item) ? ($item['unit'] === '' ? null : $item['unit']) : null,
                        'discount_percentage' => $item['discount_percentage'] ?? 0,
                        'discount_amount' => $item['discount_amount'] ?? 0,
                        'notes' => $item['notes'] ?? null,
                        'status' => $item['status'] ?? 'draft',
                        'created_by' => $createdBy,
                        'updated_by' => $createdBy,
                    ]);
                }
            }

            // บันทึก History
            $workNamesList = implode(', ', $workNames);
            DocumentHistory::logCreation('quotation', $quotation->id, $createdBy, "สร้างจาก Multiple Pricing Requests: {$workNamesList}");

            // มาร์ค Pricing Requests ว่าใช้แล้วสำหรับสร้าง Quotation
            foreach ($pricingRequestIds as $prId) {
                $this->autofillService->markPricingRequestAsUsed($prId, $createdBy);
            }

            DB::commit();

            Log::info('Quotation created successfully', [
                'quotation_id' => $quotation->id,
                'quotation_number' => $quotation->number,
                'primary_pricing_request_ids' => $pricingRequestIds
            ]);

            return $quotation->load(['customer', 'creator', 'items', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::createFromMultiplePricingRequests error: ' . $e->getMessage(), [
                'pricing_request_ids' => $pricingRequestIds,
                'customer_id' => $customerId
            ]);
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
            $oldCompanyId = $quotation->company_id;

            $quotation->fill($data);

            // หากเป็นเอกสารที่อนุมัติแล้ว/ส่งแล้ว/เสร็จสิ้น ห้ามเปลี่ยนบริษัท
            if (
                array_key_exists('company_id', $data) &&
                !empty($data['company_id']) &&
                $data['company_id'] !== $oldCompanyId &&
                in_array($quotation->status, ['approved', 'sent', 'completed'])
            ) {
                throw new \Exception('Cannot change company for approved/sent/completed quotation');
            }

            // ถ้าบริษัทถูกเปลี่ยนและยังไม่ Final ให้ตั้งเลขชั่วคราว (DRAFT-xxxx) เพื่อออกใหม่ตอนอนุมัติ
            if (
                array_key_exists('company_id', $data) &&
                !empty($data['company_id']) &&
                $data['company_id'] !== $oldCompanyId &&
                !in_array($quotation->status, ['approved', 'sent', 'completed'])
            ) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }

            $quotation->save();

            // If frontend sends full items array, replace existing quotation_items accordingly
            if (array_key_exists('items', $data) && is_array($data['items'])) {
                // Remove all existing items first to simplify ordering and grouping logic
                QuotationItem::where('quotation_id', $id)->delete();

                $seqSeen = [];
                foreach ($data['items'] as $index => $item) {
                    // Ensure continuous, unique sequence_order per quotation
                    $seq = isset($item['sequence_order']) && is_numeric($item['sequence_order'])
                        ? intval($item['sequence_order'])
                        : ($index + 1);
                    if (isset($seqSeen[$seq])) {
                        // Bump to next available sequence
                        while (isset($seqSeen[$seq])) { $seq++; }
                    }
                    $seqSeen[$seq] = true;

                    QuotationItem::create([
                        'quotation_id' => $quotation->id,
                        'pricing_request_id' => $item['pricing_request_id'] ?? null,
                        'item_name' => $item['item_name'] ?? 'ไม่ระบุชื่องาน',
                        'item_description' => $item['item_description'] ?? null,
                        'sequence_order' => $seq,
                        'pattern' => $item['pattern'] ?? null,
                        'fabric_type' => $item['fabric_type'] ?? null,
                        'color' => $item['color'] ?? null,
                        'size' => $item['size'] ?? null,
                        'unit_price' => $item['unit_price'] ?? 0,
                        'quantity' => $item['quantity'] ?? 0,
                        'unit' => array_key_exists('unit', $item) ? ($item['unit'] === '' ? null : $item['unit']) : null,
                        'discount_percentage' => $item['discount_percentage'] ?? 0,
                        'discount_amount' => $item['discount_amount'] ?? 0,
                        'notes' => $item['notes'] ?? null,
                        'status' => $item['status'] ?? 'draft',
                        'created_by' => $updatedBy,
                        'updated_by' => $updatedBy,
                    ]);
                }

                // Also sync the quotation's primary_pricing_request_ids to reflect remaining jobs
                try {
                    if (\Illuminate\Support\Facades\Schema::hasColumn('quotations', 'primary_pricing_request_ids')) {
                        $remainingPrIds = collect($data['items'])
                            ->pluck('pricing_request_id')
                            ->filter()
                            ->unique()
                            ->values()
                            ->all();
                        $quotation->primary_pricing_request_ids = $remainingPrIds;
                        $quotation->save();
                    } elseif (\Illuminate\Support\Facades\Schema::hasColumn('quotations', 'primary_pricing_request_id')) {
                        // Fallback: set to first remaining PR or null
                        $first = collect($data['items'])->pluck('pricing_request_id')->first();
                        $quotation->primary_pricing_request_id = $first;
                        $quotation->save();
                    }
                } catch (\Throwable $e) {
                    Log::warning('Failed to sync primary_pricing_request_ids on quotation update: ' . $e->getMessage());
                }
            }

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

            return $quotation->load(['customer', 'creator', 'items']);

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

            // กำหนดเลขที่เอกสารตอนอนุมัติ (ครั้งแรกหรือกรณีเป็นเลขชั่วคราว DRAFT-xxxx)
            if (empty($quotation->number) || \Illuminate\Support\Str::startsWith($quotation->number, 'DRAFT-')) {
                // ใช้ปี/เดือนปัจจุบันในการออกเลข
                $quotation->number = Quotation::generateQuotationNumber($quotation->company_id);
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
            $invoice->company_id = $quotation->company_id
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $invoice->number = Invoice::generateInvoiceNumber($invoice->company_id);
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
            // Eager-load relations needed by frontend; guard junction table existence
            $with = ['customer', 'creator', 'pricingRequest', 'items', 'company'];
            if (Schema::hasTable('quotation_pricing_requests')) {
                $with[] = 'pricingRequests';
            }

            $query = Quotation::with($with)
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
                $rawSearch = trim($filters['search']);
                $like = '%' . $rawSearch . '%';

                // Pre-compute which quotation columns exist
                $hasCustomerCompany = Schema::hasColumn('quotations', 'customer_company');
                $hasCustomerFirst = Schema::hasColumn('quotations', 'customer_firstname');
                $hasCustomerLast = Schema::hasColumn('quotations', 'customer_lastname');

                // Decide joins first (outside closure) so they definitely exist in final SQL
                $joinedMaster = false;
                if (Schema::hasTable('master_customers')) {
                    $query->leftJoin('master_customers', 'quotations.customer_id', '=', 'master_customers.cus_id');
                    $joinedMaster = true;
                }
                $joinedPricing = false;
                if (Schema::hasTable('pricing_requests')) {
                    $pricingFk = null;
                    if (Schema::hasColumn('quotations', 'pricing_request_id')) {
                        $pricingFk = 'pricing_request_id';
                    } elseif (Schema::hasColumn('quotations', 'primary_pricing_request_id')) {
                        $pricingFk = 'primary_pricing_request_id';
                    }
                    if ($pricingFk) {
                        $query->leftJoin('pricing_requests', "quotations.$pricingFk", '=', 'pricing_requests.pr_id');
                        $joinedPricing = true;
                    }
                }

                // Prevent column collision + duplication
                $query->select('quotations.*');

                $query->where(function ($q) use ($like, $hasCustomerCompany, $hasCustomerFirst, $hasCustomerLast, $joinedMaster, $joinedPricing) {
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
                            if (Schema::hasColumn('master_customers', $col)) {
                                $q->orWhere("master_customers.$col", 'like', $like);
                            }
                        }
                    }
                    if ($joinedPricing) {
                        foreach (['pr_no','pr_work_name'] as $col) {
                            if (Schema::hasColumn('pricing_requests', $col)) {
                                $q->orWhere("pricing_requests.$col", 'like', $like);
                            }
                        }
                    }
                });
            }

            return $query->orderBy('created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('QuotationService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งกลับแก้ไข (Account ส่งกลับให้ Sales)
     */
    public function sendBackForEdit($quotationId, $reason, $actionBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบว่าอยู่ในสถานะที่ส่งกลับได้
            if ($quotation->status !== 'pending_review') {
                throw new \Exception('Quotation must be in pending review status to send back');
            }

            $quotation->status = 'draft';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'quotation', 
                $quotationId, 
                'pending_review', 
                'draft', 
                'ส่งกลับแก้ไข', 
                $actionBy, 
                $reason
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::sendBackForEdit error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ยกเลิกการอนุมัติ (Account)
     */
    public function revokeApproval($quotationId, $reason, $actionBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบว่าอยู่ในสถานะที่ยกเลิกได้
            if (!in_array($quotation->status, ['approved', 'sent'])) {
                throw new \Exception('Quotation must be in approved or sent status to revoke approval');
            }

            $previousStatus = $quotation->status;
            $quotation->status = 'pending_review';
            $quotation->approved_by = null;
            $quotation->approved_at = null;
            // Free the official number so the sequence can be reused (numbers are assigned only for approved)
            if (!empty($quotation->number) && !\Illuminate\Support\Str::startsWith($quotation->number, 'DRAFT-')) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
            $quotation->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'quotation', 
                $quotationId, 
                $previousStatus, 
                'pending_review', 
                'ยกเลิกการอนุมัติ', 
                $actionBy, 
                $reason
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::revokeApproval error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง PDF ใบเสนอราคา (ใหม่ - ใช้ Master Service)
     */
    public function generatePdf($quotationId, $options = [])
    {
        try {
            $quotation = Quotation::with(['customer', 'pricingRequest', 'company', 'items', 'creator'])
                                  ->findOrFail($quotationId);

            // กำหนดสถานะเอกสาร
            $isFinal = in_array($quotation->status, ['approved', 'sent', 'completed']);

            // ใช้ Master PDF Service (mPDF) เป็นหลัก
            try {
                $masterService = app(\App\Services\Accounting\Pdf\QuotationPdfMasterService::class);
                $result = $masterService->generatePdf($quotation, $options);
                
                // บันทึก History
                DocumentHistory::logAction(
                    'quotation',
                    $quotationId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF (mPDF): {$result['filename']} ({$result['type']})"
                );

                // ระบุ engine ที่ใช้
                $result['engine'] = 'mPDF';
                return $result;
                
            } catch (\Throwable $e) {
                Log::warning('QuotationService::generatePdf mPDF failed, fallback to FPDF: ' . $e->getMessage());
                
                // Fallback to FPDF only if mPDF completely fails
                $fpdfService = app(\App\Services\Accounting\Pdf\QuotationPdfService::class);
                $pdfPath = $fpdfService->render($quotation);
                $filename = basename($pdfPath);
                $pdfUrl = url('storage/pdfs/quotations/' . $filename);
                $fileSize = is_file($pdfPath) ? filesize($pdfPath) : 0;

                DocumentHistory::logAction(
                    'quotation',
                    $quotationId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF (FPDF fallback): {$filename} - " . $e->getMessage()
                );

                return [
                    'url' => $pdfUrl,
                    'filename' => $filename,
                    'size' => $fileSize,
                    'path' => $pdfPath,
                    'type' => $isFinal ? 'final' : 'preview',
                    'engine' => 'fpdf'
                ];
            }

        } catch (\Exception $e) {
            Log::error('QuotationService::generatePdf error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream PDF สำหรับดู/ดาวน์โหลดทันที
     */
    public function streamPdf($quotationId, $options = [])
    {
        try {
            $quotation = Quotation::with(['customer', 'company', 'items'])
                                  ->findOrFail($quotationId);
                                  
            // ใช้ Master PDF Service (mPDF) เป็นหลัก
            $masterService = app(\App\Services\Accounting\Pdf\QuotationPdfMasterService::class);
            return $masterService->streamPdf($quotation, $options);
            
        } catch (\Throwable $e) {
            Log::warning('QuotationService::streamPdf mPDF failed, fallback to FPDF: ' . $e->getMessage());
            
            // Fallback to FPDF
            $fpdfService = app(\App\Services\Accounting\Pdf\QuotationPdfService::class);
            $quotation = Quotation::with(['customer', 'company', 'items'])->findOrFail($quotationId);
            $pdfPath = $fpdfService->render($quotation);
            
            $filename = sprintf('quotation-%s.pdf', $quotation->number ?? $quotation->id);
            
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $filename . '"'
            ]);
        }
    }

    /**
     * ตรวจสอบสถานะระบบ PDF
     */
    public function checkPdfSystemStatus()
    {
        try {
            $masterService = app(\App\Services\Accounting\Pdf\QuotationPdfMasterService::class);
            $status = $masterService->checkSystemStatus();
            
            return [
                'system_ready' => $status['all_ready'],
                'components' => $status,
                'recommendations' => $this->getPdfRecommendations($status),
                'preferred_engine' => $status['all_ready'] ? 'mPDF' : 'FPDF'
            ];
            
        } catch (\Exception $e) {
            Log::error('QuotationService::checkPdfSystemStatus error: ' . $e->getMessage());
            
            return [
                'system_ready' => false,
                'components' => ['error' => $e->getMessage()],
                'recommendations' => ['ติดตั้ง mPDF package และ dependencies ที่จำเป็น'],
                'preferred_engine' => 'FPDF'
            ];
        }
    }

    /**
     * ให้คำแนะนำสำหรับการแก้ไขระบบ PDF
     */
    private function getPdfRecommendations($status)
    {
        $recommendations = [];
        
        if (empty($status['mpdf_available']) || !$status['mpdf_available']) {
            $recommendations[] = 'ติดตั้ง mPDF: composer require carlos-meneses/laravel-mpdf';
        }
        
        if (empty($status['thai_fonts_available']) || !$status['thai_fonts_available']) {
            $recommendations[] = 'ดาวน์โหลดและติดตั้งฟอนต์ Sarabun ในโฟลเดอร์ public/fonts/thsarabun/';
            $recommendations[] = 'ตรวจสอบไฟล์: Sarabun-Regular.ttf และ Sarabun-Bold.ttf';
        }
        
        if (empty($status['storage_writable']) || !$status['storage_writable']) {
            $recommendations[] = 'ตรวจสอบสิทธิ์การเขียนในโฟลเดอร์ storage/app/public';
        }
        
        if (empty($status['views_exist']) || !$status['views_exist']) {
            $recommendations[] = 'สร้างไฟล์ view templates ตามที่ระบุในคู่มือ';
            $recommendations[] = 'ตรวจสอบไฟล์: pdf.quotation-master, pdf.partials.quotation-header, pdf.partials.quotation-footer';
        }
        
        if (empty($recommendations)) {
            $recommendations[] = 'ระบบพร้อมใช้งาน mPDF แล้ว!';
        }
        
        return $recommendations;
    }

    /**
     * ส่งอีเมลใบเสนอราคา
     */
    public function sendEmail($quotationId, $emailData, $sentBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::with(['customer'])->findOrFail($quotationId);

            // ตรวจสอบสถานะ
            if ($quotation->status !== 'approved') {
                throw new \Exception('Quotation must be approved before sending email');
            }

            // สร้าง PDF ก่อนส่ง (ถ้าต้องการ)
            $pdfData = null;
            if ($emailData['include_pdf'] ?? true) {
                $pdfData = $this->generatePdf($quotationId);
            }

            // TODO: Implement actual email sending
            // For now, just log the email data
            $emailDetails = [
                'to' => $emailData['recipient_email'],
                'subject' => $emailData['subject'] ?? "ใบเสนอราคา {$quotation->number} จาก TNP Group",
                'message' => $emailData['message'] ?? "เรียน คุณลูกค้า\n\nได้แนบใบเสนอราคาตามที่ร้องขอ...",
                'pdf_attachment' => $pdfData['path'] ?? null,
                'sent_at' => now(),
                'sent_by' => $sentBy
            ];

            Log::info('QuotationService::sendEmail - Email details:', $emailDetails);

            // บันทึก History
            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'send_email',
                $sentBy,
                "ส่งอีเมลถึง: {$emailData['recipient_email']}"
            );

            DB::commit();

            return [
                'email_sent' => true,
                'recipient' => $emailData['recipient_email'],
                'sent_at' => now()->format('Y-m-d\TH:i:s\Z'),
                'pdf_included' => !empty($pdfData)
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::sendEmail error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปโหลดหลักฐานการส่ง
     */
    public function uploadEvidence($quotationId, $files, $description = null, $uploadedBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            $uploadedFiles = [];

            foreach ($files as $file) {
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('quotations/evidence', $filename, 'public');

                // สร้าง attachment record
                $attachment = DocumentAttachment::create([
                    'document_type' => 'quotation',
                    'document_id' => $quotationId,
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

            // บันทึก History
            $fileCount = count($files);
            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'upload_evidence',
                $uploadedBy,
                "อัปโหลดหลักฐาน {$fileCount} ไฟล์" . ($description ? ": {$description}" : "")
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
            Log::error('QuotationService::uploadEvidence error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปโหลดรูปหลักฐานการเซ็น (เฉพาะใบเสนอราคาที่ Approved แล้ว)
     */
    public function uploadSignatures($quotationId, $files, $uploadedBy = null)
    {
        try {
            DB::beginTransaction();

            /** @var Quotation $quotation */
            $quotation = Quotation::findOrFail($quotationId);
            if ($quotation->status !== 'approved') {
                throw new \Exception('อัปโหลดได้เฉพาะใบเสนอราคาที่อนุมัติแล้ว');
            }

            $existing = is_array($quotation->signature_images) ? $quotation->signature_images : [];
            $stored = [];

            if (!is_array($files) && !($files instanceof \Traversable)) {
                throw new \Exception('รูปแบบไฟล์ไม่ถูกต้อง (expected array)');
            }

            foreach ($files as $file) {
                if (!$file) { continue; }
                $ext = $file->getClientOriginalExtension();
                $safeExt = strtolower($ext ?: 'jpg');
                $filename = date('Ymd_His') . '_' . \Illuminate\Support\Str::random(8) . '.' . $safeExt;
                $path = $file->storeAs('public/images/quotation', $filename); // storage/app/public/images/quotation
                // Use full absolute URL (handles APP_URL). Storage::url may return relative if APP_URL unset.
                $relative = str_replace('public/', '', $path); // images/quotation/...
                $publicUrl = url('storage/' . $relative);
                $stored[] = [
                    'filename' => $filename,
                    'path' => $path,
                    'url' => $publicUrl,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'uploaded_at' => now()->toIso8601String(),
                    'uploaded_by' => $uploadedBy,
                ];
            }

            $quotation->signature_images = array_values(array_merge($existing, $stored));
            $quotation->save();

            // History
            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'upload_signatures',
                $uploadedBy,
                'อัปโหลดรูปหลักฐานการเซ็นจำนวน ' . count($files) . ' ไฟล์'
            );

            DB::commit();

            return [
                'signature_images' => $quotation->signature_images,
                'uploaded_count' => count($files),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::uploadSignatures error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ลบรูปหลักฐานการเซ็น 1 รูปโดยอ้างอิง filename หรือ index
     */
    public function deleteSignatureImage($quotationId, $identifier, $deletedBy = null)
    {
        try {
            DB::beginTransaction();

            /** @var Quotation $quotation */
            $quotation = Quotation::findOrFail($quotationId);
            $images = is_array($quotation->signature_images) ? $quotation->signature_images : [];
            if (empty($images)) {
                throw new \Exception('ไม่พบรูปสำหรับลบ');
            }

            $removed = null;
            // Identifier may be numeric index or filename
            if (is_numeric($identifier)) {
                $idx = (int)$identifier;
                if ($idx < 0 || $idx >= count($images)) {
                    throw new \Exception('ตำแหน่งรูปไม่ถูกต้อง');
                }
                $removed = $images[$idx];
                unset($images[$idx]);
            } else {
                foreach ($images as $i => $img) {
                    if (($img['filename'] ?? null) === $identifier) {
                        $removed = $img;
                        unset($images[$i]);
                        break;
                    }
                }
                if (!$removed) {
                    throw new \Exception('ไม่พบไฟล์ที่ระบุ');
                }
            }

            // Delete actual stored file if still exists
            if (!empty($removed['path']) && Storage::exists($removed['path'])) {
                try { Storage::delete($removed['path']); } catch (\Throwable $t) { /* ignore */ }
            }

            $quotation->signature_images = array_values($images);
            $quotation->save();

            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'delete_signature_image',
                $deletedBy,
                'ลบรูปหลักฐานการเซ็น: ' . ($removed['filename'] ?? 'unknown')
            );

            DB::commit();
            return [
                'deleted' => $removed,
                'signature_images' => $quotation->signature_images,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::deleteSignatureImage error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload sample images and append to quotation->sample_images
     * Files are stored under storage/app/public/images/quotation-samples
     */
    public function uploadSampleImages($quotationId, $files, $uploadedBy = null)
    {
        try {
            DB::beginTransaction();

            /** @var Quotation $quotation */
            $quotation = Quotation::findOrFail($quotationId);

            $existing = is_array($quotation->sample_images) ? $quotation->sample_images : [];
            $stored = [];

            if (!is_array($files) && !($files instanceof \Traversable)) {
                throw new \Exception('Invalid files payload (expected array)');
            }

            foreach ($files as $file) {
                if (!$file) { continue; }
                $ext = $file->getClientOriginalExtension();
                $safeExt = strtolower($ext ?: 'jpg');
                $filename = date('Ymd_His') . '_' . \Illuminate\Support\Str::random(8) . '.' . $safeExt;
                $path = $file->storeAs('public/images/quotation-samples', $filename);
                $relative = str_replace('public/', '', $path); // images/quotation-samples/...
                $publicUrl = url('storage/' . $relative);
                $stored[] = [
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => $publicUrl,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'uploaded_at' => now()->toIso8601String(),
                    'uploaded_by' => $uploadedBy,
                ];
            }

            $quotation->sample_images = array_values(array_merge($existing, $stored));
            $quotation->save();

            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'upload_sample_images',
                $uploadedBy,
                'อัปโหลดรูปภาพตัวอย่างจำนวน ' . count($stored) . ' ไฟล์'
            );

            DB::commit();

            return [
                'sample_images' => $quotation->sample_images,
                'uploaded_count' => count($stored),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::uploadSampleImages error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload sample images without persisting to any quotation (for create form)
     */
    public function uploadSampleImagesNoBind($files, $uploadedBy = null)
    {
        try {
            $stored = [];
            if (!is_array($files) && !($files instanceof \Traversable)) {
                throw new \Exception('Invalid files payload (expected array)');
            }
            foreach ($files as $file) {
                if (!$file) { continue; }
                $ext = $file->getClientOriginalExtension();
                $safeExt = strtolower($ext ?: 'jpg');
                $filename = date('Ymd_His') . '_' . \Illuminate\Support\Str::random(8) . '.' . $safeExt;
                $path = $file->storeAs('public/images/quotation-samples', $filename);
                $relative = str_replace('public/', '', $path);
                $publicUrl = url('storage/' . $relative);
                $stored[] = [
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => $publicUrl,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'uploaded_at' => now()->toIso8601String(),
                    'uploaded_by' => $uploadedBy,
                ];
            }
            return [
                'sample_images' => $stored,
                'uploaded_count' => count($stored),
            ];
        } catch (\Exception $e) {
            Log::error('QuotationService::uploadSampleImagesNoBind error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * มาร์คว่าลูกค้าตอบรับแล้ว
     */
    public function markCompleted($quotationId, $data, $completedBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบสถานะ
            if ($quotation->status !== 'sent') {
                throw new \Exception('Quotation must be in sent status to mark as completed');
            }

            $quotation->status = 'completed';
            $quotation->save();

            // บันทึก History
            $notes = $data['completion_notes'] ?? 'ลูกค้าตอบรับใบเสนอราคาแล้ว';
            if (!empty($data['customer_response'])) {
                $notes .= "\nข้อความจากลูกค้า: " . $data['customer_response'];
            }

            DocumentHistory::logStatusChange(
                'quotation',
                $quotationId,
                'sent',
                'completed',
                'ลูกค้าตอบรับ',
                $completedBy,
                $notes
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::markCompleted error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * บันทึกการส่งเอกสาร (อัปเดตสถานะเป็น 'sent')
     */
    public function markSent($quotationId, $data, $sentBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบสถานะ
            if ($quotation->status !== 'approved') {
                throw new \Exception('Quotation must be approved before marking as sent');
            }

            $quotation->status = 'sent';
            $quotation->save();

            // บันทึก History
            $notes = "ส่งเอกสารด้วยวิธี: " . $data['delivery_method'];
            if (!empty($data['recipient_name'])) {
                $notes .= "\nผู้รับ: " . $data['recipient_name'];
            }
            if (!empty($data['delivery_notes'])) {
                $notes .= "\nหมายเหตุ: " . $data['delivery_notes'];
            }

            DocumentHistory::logStatusChange(
                'quotation',
                $quotationId,
                'approved',
                'sent',
                'ส่งเอกสาร',
                $sentBy,
                $notes
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::markSent error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้างเนื้อหา PDF (placeholder implementation)
     */
    // legacy placeholder generator removed in favor of FPDF service
}
