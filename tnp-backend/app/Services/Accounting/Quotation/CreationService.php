<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\OrderItemsTracking;
use App\Models\Accounting\DocumentHistory;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CreationService
{
    protected AutofillService $autofillService;
    protected Calculator $calculator;

    public function __construct(
        AutofillService $autofillService,
        Calculator $calculator
    ) {
        $this->autofillService = $autofillService;
        $this->calculator = $calculator;
    }

    /**
     * สร้าง Quotation จาก Pricing Request
     * @param mixed $pricingRequestId
     * @param mixed $additionalData
     * @param mixed $createdBy
     * @return Quotation
     */
    public function createFromPricingRequest($pricingRequestId, $additionalData = [], $createdBy = null): Quotation
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
            //  New financial fields
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
            // Deposit logic: allow either percentage or explicit amount via deposit_mode (use pre-VAT base)
            $depositMode = $additionalData['deposit_mode'] ?? 'percentage';
            if ($depositMode === 'amount' && isset($additionalData['deposit_amount'])) {
                $quotation->deposit_amount = max(0, floatval($additionalData['deposit_amount']));
                $preVatBase = $this->calculator->computeDepositBasePreVat($quotation, $additionalData);
                $quotation->deposit_percentage = $preVatBase > 0 ? round(($quotation->deposit_amount / $preVatBase) * 100, 4) : 0;
            } else {
                $quotation->deposit_percentage = $additionalData['deposit_percentage'] ?? 0;
                $pct = max(0, min(100, floatval($quotation->deposit_percentage)));
                $preVatBase = $this->calculator->computeDepositBasePreVat($quotation, $additionalData);
                $quotation->deposit_amount = round($preVatBase * ($pct/100), 2);
            }
            $quotation->deposit_mode = $depositMode;
            $quotation->payment_terms = $additionalData['payment_terms'] ?? null;
            
            // Append additional notes ถ้ามี
            if (!empty($additionalData['notes'])) {
                $quotation->notes = $quotation->notes ? $quotation->notes . "\n\n" . $additionalData['notes'] : $additionalData['notes'];
            }

            // VAT and pricing mode fields
            $quotation->has_vat = $additionalData['has_vat'] ?? true;
            $quotation->vat_percentage = $additionalData['vat_percentage'] ?? 7.00;
            $quotation->pricing_mode = $additionalData['pricing_mode'] ?? 'net';

            $quotation->status = 'draft';
            // Ensure unique draft number to satisfy (company_id, number) unique index
            if (empty($quotation->number)) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
            $quotation->created_by = $createdBy;
            $quotation->save();

            // สร้าง Order Items Tracking ถ้ามีข้อมูลจำนวน
            if (!empty($autofillData['quantity']) && is_numeric($autofillData['quantity'])) {
                OrderItemsTracking::create([
                    'quotation_id' => $quotation->id,
                    'work_name' => $quotation->work_name,
                    'fabric_type' => $autofillData['fabric_type'] ?? null,
                    'pattern' => $autofillData['pattern'] ?? null,
                    'color' => $autofillData['color'] ?? null,
                    'sizes' => $autofillData['sizes'] ?? null,
                    'ordered_quantity' => intval($autofillData['quantity']),
                    'unit_price' => $quotation->total_amount > 0 ? $quotation->total_amount / intval($autofillData['quantity']) : 0
                ]);
            }

            // บันทึก History
            DocumentHistory::logCreation('quotation', $quotation->id, $createdBy, 'สร้างใบเสนอราคาจาก Pricing Request');

            DB::commit();

            return $quotation->load(['customer', 'creator', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::createFromPricingRequest error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Quotation ใหม่ (ไม่ได้จาก Pricing Request)
     * @param mixed $data
     * @param mixed $createdBy
     * @return Quotation
     */
    public function create($data, $createdBy = null): Quotation
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
     * สร้างใบเสนอราคาแบบ Standalone (ไม่ต้องอิง Pricing Request)
     * รองรับการกรอกข้อมูลครบถ้วนเพื่อใช้ในการสร้าง PDF
     * @param array<string,mixed> $data
     * @param string|null $createdBy
     * @return Quotation
     */
    public function createStandalone(array $data, $createdBy = null): Quotation
    {
        try {
            DB::beginTransaction();

            // ดึงข้อมูล Customer
            $customer = \App\Models\MasterCustomer::findOrFail($data['customer_id']);
            
            // สร้าง customer_snapshot สำหรับใช้ในการสร้าง PDF
            $customerSnapshot = [
                'cus_id' => $customer->cus_id,
                'cus_company' => $customer->cus_company,
                'cus_firstname' => $customer->cus_firstname,
                'cus_lastname' => $customer->cus_lastname,
                'cus_tax_id' => $customer->cus_tax_id,
                'cus_tel_1' => $customer->cus_tel_1,
                'cus_tel_2' => $customer->cus_tel_2,
                'cus_email' => $customer->cus_email,
                'cus_address' => $customer->cus_address,
                'cus_zip_code' => $customer->cus_zip_code,
                'cus_depart' => $customer->cus_depart,
            ];

            // คำนวณ subtotal จาก items
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $unitPrice = (float) ($item['unit_price'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 0);
                $discountAmount = (float) ($item['discount_amount'] ?? 0);
                $discountPercentage = (float) ($item['discount_percentage'] ?? 0);
                
                $itemSubtotal = $unitPrice * $quantity;
                
                // คำนวณส่วนลด
                if ($discountAmount > 0) {
                    $itemSubtotal -= $discountAmount;
                } elseif ($discountPercentage > 0) {
                    $itemSubtotal -= ($itemSubtotal * $discountPercentage / 100);
                }
                
                $subtotal += max(0, $itemSubtotal);
            }

            // คำนวณส่วนลดพิเศษ
            $specialDiscountPercentage = (float) ($data['special_discount_percentage'] ?? 0);
            $specialDiscountAmount = (float) ($data['special_discount_amount'] ?? 0);
            
            if ($specialDiscountAmount <= 0 && $specialDiscountPercentage > 0) {
                $specialDiscountAmount = $subtotal * $specialDiscountPercentage / 100;
            } elseif ($specialDiscountPercentage <= 0 && $specialDiscountAmount > 0) {
                $specialDiscountPercentage = $subtotal > 0 ? ($specialDiscountAmount / $subtotal * 100) : 0;
            }

            $subtotalAfterDiscount = $subtotal - $specialDiscountAmount;

            // คำนวณ VAT based on pricing_mode
            $pricingMode = $data['pricing_mode'] ?? 'net'; // 'net' or 'vat_included'
            $hasVat = $data['has_vat'] ?? true;
            $vatPercentage = $hasVat ? (float) ($data['vat_percentage'] ?? 7.00) : 0;
            
            $vatAmount = 0;
            $netSubtotal = $subtotalAfterDiscount;
            
            if ($pricingMode === 'vat_included' && $hasVat) {
                // Reverse calculation: extract VAT from included price
                // Formula: netPrice = totalPrice / (1 + vatRate)
                $vatMultiplier = 1 + ($vatPercentage / 100);
                $netSubtotal = $subtotalAfterDiscount / $vatMultiplier;
                $vatAmount = $subtotalAfterDiscount - $netSubtotal;
                $totalAmount = $subtotalAfterDiscount; // Already includes VAT
            } else {
                // Standard: net price + VAT
                $vatAmount = $subtotalAfterDiscount * $vatPercentage / 100;
                $totalAmount = $subtotalAfterDiscount + $vatAmount;
            }

            // คำนวณภาษีหัก ณ ที่จ่าย (always on net amount)
            $hasWithholdingTax = $data['has_withholding_tax'] ?? false;
            $withholdingTaxPercentage = $hasWithholdingTax ? (float) ($data['withholding_tax_percentage'] ?? 0) : 0;
            $withholdingTaxAmount = $netSubtotal * $withholdingTaxPercentage / 100;

            // คำนวณยอดสุทธิสุดท้าย
            $finalTotalAmount = $totalAmount - $withholdingTaxAmount;

            // คำนวณเงินมัดจำ
            $depositMode = $data['deposit_mode'] ?? 'percentage';
            $depositPercentage = 0;
            $depositAmount = 0;
            
            if ($depositMode === 'percentage') {
                $depositPercentage = (float) ($data['deposit_percentage'] ?? 0);
                // คำนวณ deposit จาก subtotal หลังหักส่วนลดพิเศษ (ก่อน VAT)
                $depositAmount = $subtotalAfterDiscount * $depositPercentage / 100;
            } else {
                $depositAmount = (float) ($data['deposit_amount'] ?? 0);
                $depositPercentage = $subtotalAfterDiscount > 0 ? ($depositAmount / $subtotalAfterDiscount * 100) : 0;
            }

            // สร้าง Quotation
            $quotation = new Quotation();
            $quotation->id = \Illuminate\Support\Str::uuid();
            $quotation->company_id = $data['company_id']
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $quotation->customer_id = $customer->cus_id;
            $quotation->customer_snapshot = $customerSnapshot;
            
            // รองรับการ duplicate: เก็บ primary_pricing_request_id และ primary_pricing_request_ids
            if (array_key_exists('primary_pricing_request_id', $data)) {
                $quotation->primary_pricing_request_id = $data['primary_pricing_request_id'];
            }
            if (array_key_exists('primary_pricing_request_ids', $data)) {
                $quotation->primary_pricing_request_ids = $data['primary_pricing_request_ids'];
            }
            
            $quotation->work_name = $data['work_name'] ?? 'งานทั่วไป';
            $quotation->due_date = $data['due_date'] ?? null;
            $quotation->notes = $data['notes'] ?? null;
            $quotation->payment_terms = $data['payment_terms'] ?? null;
            
            // Financials
            $quotation->subtotal = $subtotal;
            $quotation->special_discount_percentage = $specialDiscountPercentage;
            $quotation->special_discount_amount = $specialDiscountAmount;
            $quotation->has_vat = $hasVat;
            $quotation->vat_percentage = $vatPercentage;
            $quotation->total_amount = $totalAmount;
            $quotation->has_withholding_tax = $hasWithholdingTax;
            $quotation->withholding_tax_percentage = $withholdingTaxPercentage;
            $quotation->withholding_tax_amount = $withholdingTaxAmount;
            $quotation->final_total_amount = $finalTotalAmount;
            $quotation->pricing_mode = $pricingMode;
            
            // Deposit
            $quotation->deposit_mode = $depositMode;
            $quotation->deposit_percentage = $depositPercentage;
            $quotation->deposit_amount = $depositAmount;
            
            // Sample images
            if (array_key_exists('sample_images', $data)) {
                $quotation->sample_images = is_array($data['sample_images']) ? $data['sample_images'] : [];
            }
            
            $quotation->status = 'draft';
            // Ensure unique draft number
            if (empty($quotation->number)) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
            $quotation->created_by = $createdBy;
            $quotation->save();

            // บันทึก Items with defense-in-depth sequence normalization
            if (empty($data['items']) || !is_array($data['items'])) {
                throw new \Exception('Items array is required for standalone quotation');
            }

            // ✅ DEFENSE-IN-DEPTH: Ensure unique, continuous sequence orders (Creation Time)
            $seqSeen = [];
            foreach ($data['items'] as $index => $item) {
                // Calculate normalized sequence
                $seq = isset($item['sequence_order']) && is_numeric($item['sequence_order'])
                    ? intval($item['sequence_order'])
                    : ($index + 1);
                
                // If duplicate detected, bump to next available sequence
                if (isset($seqSeen[$seq])) {
                    Log::warning('QuotationService::createStandalone - Duplicate sequence detected, auto-correcting', [
                        'quotation_id' => $quotation->id,
                        'item_index' => $index,
                        'original_sequence' => $seq
                    ]);
                    
                    while (isset($seqSeen[$seq])) {
                        $seq++;
                    }
                }
                $seqSeen[$seq] = true;

                $quotationItem = new \App\Models\Accounting\QuotationItem();
                $quotationItem->id = \Illuminate\Support\Str::uuid();
                $quotationItem->quotation_id = $quotation->id;
                $quotationItem->pricing_request_id = $item['pricing_request_id'] ?? null;
                $quotationItem->item_name = $item['item_name'] ?? 'ไม่ระบุชื่องาน';
                $quotationItem->item_description = $item['item_description'] ?? null;
                $quotationItem->sequence_order = $seq; // Use normalized sequence
                $quotationItem->pattern = $item['pattern'] ?? null;
                $quotationItem->fabric_type = $item['fabric_type'] ?? null;
                $quotationItem->color = $item['color'] ?? null;
                $quotationItem->size = $item['size'] ?? null;
                $quotationItem->quantity = (int) ($item['quantity'] ?? 0);
                $quotationItem->unit = $item['unit'] ?? 'ชิ้น';
                $quotationItem->unit_price = (float) ($item['unit_price'] ?? 0);
                $quotationItem->discount_percentage = (float) ($item['discount_percentage'] ?? 0);
                $quotationItem->discount_amount = (float) ($item['discount_amount'] ?? 0);
                $quotationItem->notes = $item['notes'] ?? null;
                $quotationItem->status = $item['status'] ?? 'draft';
                $quotationItem->created_by = $createdBy;
                $quotationItem->updated_by = $createdBy;
                
                $quotationItem->save();
            }

            Log::info('QuotationService::createStandalone - Items created successfully', [
                'quotation_id' => $quotation->id,
                'item_count' => count($data['items']),
                'sequences' => array_keys($seqSeen)
            ]);

            // บันทึก History
            DocumentHistory::logCreation('quotation', $quotation->id, $createdBy, 'สร้างใบเสนอราคา (Standalone)');

            DB::commit();

            return $quotation->load(['customer', 'creator', 'items']);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            
            // Check for unique constraint violation on sequence_order
            if (str_contains($e->getMessage(), 'uq_qitems_quotation_sequence') || 
                str_contains($e->getMessage(), '1062 Duplicate entry')) {
                Log::error('QuotationService::createStandalone - Duplicate sequence_order detected', [
                    'error' => $e->getMessage(),
                    'quotation_data' => $data
                ]);
                throw new \Exception('พบข้อมูลลำดับการแสดงผลซ้ำกัน กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่ กรุณาติดต่อผู้ดูแลระบบ');
            }
            
            Log::error('QuotationService::createStandalone database error: ' . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::createStandalone error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Quotation จาก Multiple Pricing Requests
     * @param mixed $pricingRequestIds
     * @param mixed $customerId
     * @param mixed $additionalData
     * @param mixed $createdBy
     * @return Quotation
     */
    public function createFromMultiplePricingRequests($pricingRequestIds, $customerId, $additionalData = [], $createdBy = null): Quotation
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

            // รองรับ multiple primary pricing request IDs (พร้อม backward compatibility)
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
            // New financial fields (multi-create)
            $quotation->special_discount_percentage = $additionalData['special_discount_percentage'] ?? 0;
            $quotation->special_discount_amount = $additionalData['special_discount_amount'] ?? 0;
            $quotation->has_withholding_tax = $additionalData['has_withholding_tax'] ?? false;
            $quotation->withholding_tax_percentage = $additionalData['withholding_tax_percentage'] ?? 0;
            $quotation->withholding_tax_amount = $additionalData['withholding_tax_amount'] ?? 0;
            $quotation->final_total_amount = $additionalData['final_total_amount'] ?? ($totalAmount - ($additionalData['special_discount_amount'] ?? 0) - ($additionalData['withholding_tax_amount'] ?? 0));
            $quotation->total_amount = $totalAmount;
            // VAT and pricing mode fields
            $quotation->has_vat = $additionalData['has_vat'] ?? true;
            $quotation->vat_percentage = $additionalData['vat_percentage'] ?? 7.00;
            $quotation->pricing_mode = $additionalData['pricing_mode'] ?? 'net';
            // Sample images from UI
            if (array_key_exists('sample_images', $additionalData)) {
                $quotation->sample_images = is_array($additionalData['sample_images']) ? $additionalData['sample_images'] : [];
            }

            // ข้อมูลการชำระเงิน (ใช้ฐานก่อน VAT สำหรับมัดจำ)
            $depositMode = $additionalData['deposit_mode'] ?? 'percentage';
            if ($depositMode === 'amount' && isset($additionalData['deposit_amount'])) {
                $quotation->deposit_amount = max(0, floatval($additionalData['deposit_amount']));
                $preVatBase = $this->calculator->computeDepositBasePreVat($quotation, $additionalData);
                $quotation->deposit_percentage = $preVatBase > 0 ? round(($quotation->deposit_amount / $preVatBase) * 100, 4) : 0;
            } else {
                $quotation->deposit_percentage = $additionalData['deposit_percentage'] ?? 0;
                $pct = max(0, min(100, floatval($quotation->deposit_percentage)));
                $preVatBase = $this->calculator->computeDepositBasePreVat($quotation, $additionalData);
                $quotation->deposit_amount = round($preVatBase * ($pct/100), 2);
            }
            $quotation->deposit_mode = $depositMode;
            $quotation->payment_terms = $additionalData['payment_terms'] ?? null;
            $quotation->due_date = $additionalData['due_date'] ?? null;
            $quotation->notes = $additionalData['notes'] ?? null;

            $quotation->status = 'draft';
            // Ensure unique draft number
            if (empty($quotation->number)) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
            $quotation->created_by = $createdBy;
            $quotation->save();

            // ✅ บันทึก Quotation Items (รองรับ items จาก Frontend)
            if (!empty($additionalData['items']) && is_array($additionalData['items'])) {
                Log::info('Creating quotation items', [
                    'quotation_id' => $quotation->id,
                    'item_count' => count($additionalData['items'])
                ]);

                // ตรวจสอบและป้องกัน sequence_order ซ้ำ
                $seqSeen = [];
                
                foreach ($additionalData['items'] as $index => $item) {
                    // คำนวณ sequence ที่ไม่ซ้ำ
                    $seq = isset($item['sequence_order']) && is_numeric($item['sequence_order'])
                        ? intval($item['sequence_order'])
                        : ($index + 1);
                    
                    // ถ้าซ้ำ ให้ใช้ sequence ถัดไป
                    while (isset($seqSeen[$seq])) {
                        $seq++;
                    }
                    $seqSeen[$seq] = true;

                    $quotationItem = new \App\Models\Accounting\QuotationItem();
                    $quotationItem->id = \Illuminate\Support\Str::uuid();
                    $quotationItem->quotation_id = $quotation->id;
                    $quotationItem->pricing_request_id = $item['pricing_request_id'] ?? null;
                    $quotationItem->item_name = $item['item_name'] ?? 'ไม่ระบุชื่องาน';
                    $quotationItem->item_description = $item['item_description'] ?? null;
                    $quotationItem->sequence_order = $seq;
                    $quotationItem->pattern = $item['pattern'] ?? null;
                    $quotationItem->fabric_type = $item['fabric_type'] ?? null;
                    $quotationItem->color = $item['color'] ?? null;
                    $quotationItem->size = $item['size'] ?? null;
                    $quotationItem->quantity = (int) ($item['quantity'] ?? 0);
                    $quotationItem->unit = $item['unit'] ?? 'ชิ้น';
                    $quotationItem->unit_price = (float) ($item['unit_price'] ?? 0);
                    $quotationItem->discount_percentage = (float) ($item['discount_percentage'] ?? 0);
                    $quotationItem->discount_amount = (float) ($item['discount_amount'] ?? 0);
                    $quotationItem->notes = $item['notes'] ?? null;
                    $quotationItem->status = 'draft';
                    $quotationItem->created_by = $createdBy;
                    $quotationItem->updated_by = $createdBy;
                    
                    $quotationItem->save();
                }

                Log::info('Quotation items created successfully', [
                    'quotation_id' => $quotation->id,
                    'item_count' => count($additionalData['items']),
                    'sequences' => array_keys($seqSeen)
                ]);
            } else {
                Log::warning('No items provided for quotation', [
                    'quotation_id' => $quotation->id
                ]);
            }

            // บันทึก History
            DocumentHistory::logCreation('quotation', $quotation->id, $createdBy, 'สร้างใบเสนอราคาจาก Multiple Pricing Requests');

            DB::commit();

            return $quotation->load(['customer', 'creator', 'company', 'items']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::createFromMultiplePricingRequests error: ' . $e->getMessage());
            throw $e;
        }
    }
}
