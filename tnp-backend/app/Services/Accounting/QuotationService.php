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
    protected AutofillService $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    /**
     * คำนวณฐานสำหรับมัดจำแบบก่อน VAT (Pre-VAT)
     * ใช้ subtotal หักด้วยส่วนลดพิเศษ ถ้ามีข้อมูลไม่ครบจะ fallback เป็น (total_amount - vat_amount - special_discount_amount)
     * @param array<string,mixed>|null $ref
     */
    protected function computeDepositBasePreVat(Quotation $q, ?array $ref = null): float
    {
        $subtotal = (float) ($ref['subtotal'] ?? $q->subtotal ?? 0);
        $special  = (float) ($ref['special_discount_amount'] ?? $q->special_discount_amount ?? 0);
        $base     = max(0.0, round($subtotal - $special, 2));

        if ($base <= 0.0) {
            $total = (float) ($ref['total_amount'] ?? $q->total_amount ?? 0);
            $vat   = (float) ($ref['vat_amount'] ?? $q->vat_amount ?? 0);
            $base  = max(0.0, round(($total - $vat - $special), 2));
        }

        return $base;
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
                $preVatBase = $this->computeDepositBasePreVat($quotation, $additionalData);
                $quotation->deposit_percentage = $preVatBase > 0 ? round(($quotation->deposit_amount / $preVatBase) * 100, 4) : 0;
            } else {
                $quotation->deposit_percentage = $additionalData['deposit_percentage'] ?? 0;
                $pct = max(0, min(100, floatval($quotation->deposit_percentage)));
                $preVatBase = $this->computeDepositBasePreVat($quotation, $additionalData);
                $quotation->deposit_amount = round($preVatBase * ($pct/100), 2);
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
            $preVatBase = $this->computeDepositBasePreVat($quotation);
            if ($recomputeDepositMode === 'amount' && array_key_exists('deposit_amount', $additionalData)) {
                $amount = max(0, floatval($additionalData['deposit_amount']));
                if ($preVatBase > 0) {
                    $quotation->deposit_percentage = (int) round(($amount / $preVatBase) * 100);
                }
                $quotation->deposit_amount = min($amount, $preVatBase);
            } elseif (array_key_exists('deposit_percentage', $additionalData)) {
                $pct = max(0, min(100, floatval($additionalData['deposit_percentage'])));
                $quotation->deposit_percentage = $pct;
                $quotation->deposit_amount = round($preVatBase * ($pct/100), 2);
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

            // สร้างเลขที่ใบเสนอราคา
            $quotationNumber = Quotation::generateQuotationNumber($data['company_id']);

            // สร้าง Quotation
            $quotation = Quotation::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'company_id' => $data['company_id'],
                'number' => $quotationNumber,
                'customer_id' => $data['customer_id'],
                'customer_snapshot' => $customerSnapshot,
                'work_name' => $data['work_name'],
                'status' => 'draft',
                'subtotal' => round($subtotal, 2),
                'special_discount_percentage' => round($specialDiscountPercentage, 2),
                'special_discount_amount' => round($specialDiscountAmount, 2),
                'has_vat' => $hasVat,
                'vat_percentage' => round($vatPercentage, 2),
                'pricing_mode' => $pricingMode,
                'vat_amount' => round($vatAmount, 2),
                'tax_amount' => round($vatAmount, 2), // alias for backward compatibility
                'has_withholding_tax' => $hasWithholdingTax,
                'withholding_tax_percentage' => round($withholdingTaxPercentage, 2),
                'withholding_tax_amount' => round($withholdingTaxAmount, 2),
                'total_amount' => round($totalAmount, 2),
                'final_total_amount' => round($finalTotalAmount, 2),
                'deposit_mode' => $depositMode,
                'deposit_percentage' => round($depositPercentage, 2),
                'deposit_amount' => round($depositAmount, 2),
                'payment_terms' => $data['payment_terms'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'document_header_type' => $data['document_header_type'] ?? 'ต้นฉบับ',
                'sample_images' => $data['sample_images'] ?? null,
                'primary_pricing_request_id' => $data['primary_pricing_request_id'] ?? null,
                'primary_pricing_request_ids' => $data['primary_pricing_request_ids'] ?? null,
                'created_by' => $createdBy,
            ]);

            // สร้าง Quotation Items
            foreach ($data['items'] as $index => $itemData) {
                $unitPrice = (float) ($itemData['unit_price'] ?? 0);
                $quantity = (int) ($itemData['quantity'] ?? 0);
                $discountPercentageItem = (float) ($itemData['discount_percentage'] ?? 0);
                $discountAmountItem = (float) ($itemData['discount_amount'] ?? 0);
                
                // ถ้าไม่มี discount_amount แต่มี discount_percentage ให้คำนวณ
                if ($discountAmountItem <= 0 && $discountPercentageItem > 0) {
                    $discountAmountItem = ($unitPrice * $quantity) * $discountPercentageItem / 100;
                }

                QuotationItem::create([
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'quotation_id' => $quotation->id,
                    'pricing_request_id' => null, // Standalone ไม่มี PR
                    'item_name' => $itemData['item_name'],
                    'item_description' => $itemData['item_description'] ?? null,
                    'sequence_order' => $index + 1, // Force server-side sequential numbering
                    'pattern' => $itemData['pattern'] ?? null,
                    'fabric_type' => $itemData['fabric_type'] ?? null,
                    'color' => $itemData['color'] ?? null,
                    'size' => $itemData['size'] ?? null,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'unit' => $itemData['unit'] ?? 'ชิ้น',
                    'discount_percentage' => $discountPercentageItem,
                    'discount_amount' => $discountAmountItem,
                    'notes' => $itemData['notes'] ?? null,
                    'status' => 'draft',
                    'created_by' => $createdBy,
                ]);
            }

            // บันทึก Document History
            DocumentHistory::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'document_type' => 'quotation',
                'document_id' => $quotation->id,
                'action' => 'created',
                'description' => 'Quotation created (standalone mode)',
                'action_by' => $createdBy,
            ]);

            DB::commit();

            // โหลดความสัมพันธ์ทั้งหมดก่อน return
            $quotation->load(['customer', 'company', 'items', 'creator']);

            return $quotation;

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
                $preVatBase = $this->computeDepositBasePreVat($quotation, array_merge($additionalData, ['total_amount' => $totalAmount]));
                $quotation->deposit_percentage = $preVatBase > 0 ? round(($quotation->deposit_amount / $preVatBase) * 100, 4) : 0;
            } else {
                $quotation->deposit_percentage = $additionalData['deposit_percentage'] ?? 50;
                $pct = max(0, min(100, floatval($quotation->deposit_percentage)));
                $preVatBase = $this->computeDepositBasePreVat($quotation, array_merge($additionalData, ['total_amount' => $totalAmount]));
                $quotation->deposit_amount = round($preVatBase * ($pct/100), 2);
            }
            $quotation->deposit_mode = $depositMode;
            $quotation->payment_terms = $additionalData['payment_terms'] ?? 'credit_30';
            $quotation->due_date = $additionalData['due_date'] ?? null;

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

            // สร้าง Junction Records ใน quotation_pricing_requests table (ถ้ามี)
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
                        'sequence_order' => $index + 1, // Force server-side sequential numbering
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
     * @param mixed $id
     * @param mixed $data
     * @param mixed $updatedBy
     * @param bool $confirmSync
     * @return array|Quotation
     */
    public function update($id, $data, $updatedBy = null, $confirmSync = false)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            $oldStatus = $quotation->status;
            $oldCompanyId = $quotation->company_id;

            // Preserve primary_pricing_request fields if not explicitly provided
            $preservedPrimaryPrId = $quotation->primary_pricing_request_id;
            $preservedPrimaryPrIds = $quotation->primary_pricing_request_ids;

            $quotation->fill($data);

            // Restore preserved fields if they weren't in the update data
            if (!array_key_exists('primary_pricing_request_id', $data)) {
                $quotation->primary_pricing_request_id = $preservedPrimaryPrId;
            }
            if (!array_key_exists('primary_pricing_request_ids', $data)) {
                $quotation->primary_pricing_request_ids = $preservedPrimaryPrIds;
            }

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

            // Reload quotation with relationships
            $quotation = $quotation->load(['customer', 'creator', 'items']);

            // Check if quotation has linked invoices and sync if confirmed
            $invoices = $quotation->invoices()->get();
            $invoiceCount = $invoices->count();

            if ($invoiceCount === 0) {
                // No invoices, return as normal
                return [
                    'quotation' => $quotation,
                    'sync_mode' => 'none',
                    'sync_count' => 0
                ];
            }

            if ($confirmSync === true && $invoiceCount > 0) {
                // User confirmed sync - check threshold
                if ($invoiceCount > 3) {
                    // Queue for background processing
                    $syncJobId = $this->queueInvoiceSync($quotation, $updatedBy);
                    
                    return [
                        'quotation' => $quotation,
                        'sync_mode' => 'queued',
                        'sync_count' => $invoiceCount,
                        'sync_job_id' => $syncJobId
                    ];
                } else {
                    // Sync immediately
                    $syncResult = $this->syncToInvoicesImmediately($quotation, $updatedBy);
                    
                    return [
                        'quotation' => $quotation,
                        'sync_mode' => 'immediate',
                        'sync_count' => $syncResult['updated_count']
                    ];
                }
            }

            // No sync requested, return as normal
            return [
                'quotation' => $quotation,
                'sync_mode' => 'none',
                'sync_count' => $invoiceCount
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งใบเสนอราคาเพื่อขออนุมัติ
     * @param mixed $id
     * @param mixed $submittedBy
     * @return Quotation
     */
    public function submitForReview($id, $submittedBy = null): Quotation
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
     * @param mixed $id
     * @param mixed $approvedBy
     * @param mixed $notes
     * @return Quotation
     */
    public function approve($id, $approvedBy = null, $notes = null): Quotation
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
     * @param mixed $id
     * @param mixed $rejectedBy
     * @param mixed $reason
     * @return Quotation
     */
    public function reject($id, $rejectedBy = null, $reason = null): Quotation
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
     * @param mixed $id
     * @param mixed $convertedBy
     * @param mixed $additionalData
     * @return Invoice
     */
    public function convertToInvoice($id, $convertedBy = null, $additionalData = []): Invoice
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
     * @param mixed $id
     * @param mixed $deletedBy
     * @param mixed $reason
     * @return bool
     */
    public function delete($id, $deletedBy = null, $reason = null): bool
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
     * ดึงข้อมูล Quotation และ Items สำหรับการทำสำเนา (Duplicate)
     * โดยล้างค่า ID, number, status, และรูปภาพ เพื่อให้พร้อมสำหรับการสร้างใหม่
     *
     * @param string $id ID ของ Quotation ต้นฉบับ
     * @return array<string,mixed> ข้อมูลที่พร้อมสำหรับส่งให้ Frontend
     */
    public function getDataForDuplication(string $id): array
    {
        try {
            // 1. โหลดข้อมูลต้นฉบับ (ต้องแน่ใจว่าโหลด 'items' และ 'customer' มาด้วย)
            $original = Quotation::with(['items', 'customer'])->findOrFail($id);

            // 2. แปลงเป็น array
            $newData = $original->toArray();

            // 3. ล้างข้อมูล ID และสถานะของ Quotation หลัก
            unset($newData['id']);
            // ✅ ไม่ลบ number เพื่อให้แสดงเลขเดิมในหน้าจอ (จะถูกสร้างใหม่ตอน save)
            // unset($newData['number']);
            unset($newData['created_at']);
            unset($newData['updated_at']);
            unset($newData['approved_at']);
            unset($newData['approved_by']);
            unset($newData['submitted_at']);
            unset($newData['submitted_by']);
            
            // ✅ เก็บ primary_pricing_request_id และ primary_pricing_request_ids ไว้
            // (ไม่ลบ - ให้คัดลอกมาด้วย)
            
            // 4. ล้างข้อมูลรูปภาพและไฟล์แนบ
            $newData['signature_images'] = []; // ไม่คัดลอกรูป signature
            // คงรูป sample_images ไว้ (ถ้าต้องการคัดลอก)
            // $newData['sample_images'] = $newData['sample_images'] ?? [];

            // 5. ตั้งค่าสถานะเริ่มต้น
            $newData['status'] = 'draft'; 
            
            // 6. เพิ่มหมายเหตุว่าเป็นการสำเนา
            $originalNumber = $original->number ?? 'ต้นฉบับ';
            $newData['notes'] = ($newData['notes'] ?? '') . "\n\n(สำเนาจาก " . $originalNumber . ")";
            
            // 7. ล้างข้อมูล ID ของ Items (สำคัญมาก)
            if (isset($newData['items']) && is_array($newData['items'])) {
                $newData['items'] = array_map(function($item) {
                    unset($item['id']);
                    unset($item['quotation_id']);
                    unset($item['created_at']);
                    unset($item['updated_at']);
                    return $item;
                }, $newData['items']);
            }

            return $newData;

        } catch (\Exception $e) {
            Log::error('QuotationService::getDataForDuplication error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการใบเสนอราคาพร้อม filter
     * @param mixed $filters
     * @param mixed $perPage
     * @return mixed
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

            // Filter by presence of uploaded signature evidence
            // signature_uploaded: '1'|'true' => has signatures; '0'|'false' => no signatures
            if (array_key_exists('signature_uploaded', $filters) && $filters['signature_uploaded'] !== null && $filters['signature_uploaded'] !== '') {
                $val = strtolower((string)$filters['signature_uploaded']);
                $wantHas = in_array($val, ['1','true','yes']);
                if ($wantHas) {
                    // JSON_VALID + JSON_LENGTH > 0 covers non-empty arrays
                    $query->where(function($q){
                        $q->whereNotNull('signature_images')
                          ->whereRaw('JSON_VALID(signature_images)')
                          ->whereRaw('JSON_LENGTH(signature_images) > 0');
                    });
                } else {
                    $query->where(function($q){
                        $q->whereNull('signature_images')
                          ->orWhereRaw('NOT JSON_VALID(signature_images)')
                          ->orWhereRaw('JSON_LENGTH(signature_images) = 0');
                    });
                }
            }

            return $query->orderBy('created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('QuotationService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งกลับแก้ไข (Account ส่งกลับให้ Sales)
     * @param mixed $quotationId
     * @param mixed $reason
     * @param mixed $actionBy
     * @return Quotation
     */
    public function sendBackForEdit($quotationId, $reason, $actionBy = null): Quotation
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
                $actionBy, 
                'ส่งกลับแก้ไข: ' . ($reason ?? '')
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
     * @param mixed $quotationId
     * @param mixed $reason
     * @param mixed $actionBy
     * @return Quotation
     */
    public function revokeApproval($quotationId, $reason, $actionBy = null): Quotation
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
                $actionBy, 
                'ยกเลิกการอนุมัติ: ' . ($reason ?? '')
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
     * สร้าง PDF ใบเสนอราคา (ใหม่ - ใช้ Master Service with Caching)
     * @param mixed $quotationId
     * @param mixed $options
     * @param bool $useCache Whether to use cache (default: true)
     * @return array<string,mixed>
     */
    public function generatePdf($quotationId, $options = [], bool $useCache = true): array
    {
        try {
            $quotation = Quotation::with(['customer', 'pricingRequest', 'company', 'items', 'creator'])
                                  ->findOrFail($quotationId);

            // Use Master PDF Service with caching support
            $masterService = app(\App\Services\Accounting\Pdf\QuotationPdfMasterService::class);
            $result = $masterService->generatePdf($quotation, $options, $useCache);
            
            // Log action only if PDF was actually generated (not from cache)
            if (!($result['from_cache'] ?? false)) {
                DocumentHistory::logAction(
                    'quotation',
                    $quotationId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF: {$result['filename']} ({$result['type']})"
                );
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('QuotationService::generatePdf error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream PDF สำหรับดู/ดาวน์โหลดทันที
     * @param mixed $quotationId
     * @param mixed $options
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function streamPdf($quotationId, $options = []): \Symfony\Component\HttpFoundation\Response
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
     * @return array<string,mixed>
     */
    public function checkPdfSystemStatus(): array
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
    /**
     * @param mixed $status
     * @return array<int,string>
     */
    private function getPdfRecommendations($status): array
    {
        $recommendations = [];
        
        if (empty($status['mpdf_available'])) {
            $recommendations[] = 'ติดตั้ง mPDF: composer require carlos-meneses/laravel-mpdf';
        }
        
        if (empty($status['thai_fonts_available'])) {
            $recommendations[] = 'ดาวน์โหลดและติดตั้งฟอนต์ Sarabun ในโฟลเดอร์ public/fonts/thsarabun/';
            $recommendations[] = 'ตรวจสอบไฟล์: Sarabun-Regular.ttf และ Sarabun-Bold.ttf';
        }
        
        if (empty($status['storage_writable'])) {
            $recommendations[] = 'ตรวจสอบสิทธิ์การเขียนในโฟลเดอร์ storage/app/public';
        }
        
        if (empty($status['views_exist'])) {
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
     * @param mixed $quotationId
     * @param mixed $emailData
     * @param mixed $sentBy
     * @return array<string,mixed>
     */
    public function sendEmail($quotationId, $emailData, $sentBy = null): array
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
     * @param mixed $quotationId
     * @param mixed $files
     * @param mixed $description
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadEvidence($quotationId, $files, $description = null, $uploadedBy = null): array
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
     * @param mixed $quotationId
     * @param mixed $files
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadSignatures($quotationId, $files, $uploadedBy = null): array
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
     * @param mixed $quotationId
     * @param mixed $identifier
     * @param mixed $deletedBy
     * @return array<string,mixed>
     */
    public function deleteSignatureImage($quotationId, $identifier, $deletedBy = null): array
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
     * @param mixed $quotationId
     * @param mixed $files
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadSampleImages($quotationId, $files, $uploadedBy = null): array
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
     * @param mixed $files
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadSampleImagesNoBind($files, $uploadedBy = null): array
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
     * @param mixed $quotationId
     * @param mixed $data
     * @param mixed $completedBy
     * @return Quotation
     */
    public function markCompleted($quotationId, $data, $completedBy = null): Quotation
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
                $completedBy,
                'ลูกค้าตอบรับ' . ($notes ? ': ' . $notes : '')
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
     * @param mixed $quotationId
     * @param mixed $data
     * @param mixed $sentBy
     * @return Quotation
     */
    public function markSent($quotationId, $data, $sentBy = null): Quotation
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
                $sentBy,
                'ส่งเอกสาร: ' . $notes
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

    /**
     * Sync quotation changes to related invoices immediately (for <=3 invoices)
     * 
     * @param Quotation $quotation
     * @param string|null $userId
     * @return array
     */
    private function syncToInvoicesImmediately(Quotation $quotation, ?string $userId): array
    {
        try {
            DB::beginTransaction();

            $invoices = $quotation->invoices()->with('items')->get();
            $invoiceIds = $invoices->pluck('id')->toArray();

            // Create sync job record for tracking
            $syncJob = \App\Models\Accounting\QuotationInvoiceSyncJob::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'quotation_id' => $quotation->id,
                'affected_invoice_ids' => $invoiceIds,
                'original_quotation_snapshot' => json_encode($quotation->load('items')->toArray()),
                'original_invoices_snapshot' => json_encode($invoices->toArray()),
                'status' => 'processing',
                'progress_total' => $invoices->count(),
                'progress_current' => 0,
                'started_by' => $userId,
                'started_at' => now()
            ]);

            $totalUpdated = 0;
            $totalItemsUpdated = 0;
            $totalItemsDeleted = 0;

            // Update each invoice
            foreach ($invoices as $invoice) {
                // Sync header fields from quotation
                $invoice->customer_company = $quotation->customer_company ?? $invoice->customer_company;
                $invoice->customer_tax_id = $quotation->customer_tax_id ?? $invoice->customer_tax_id;
                $invoice->customer_address = $quotation->customer_address ?? $invoice->customer_address;
                $invoice->customer_zip_code = $quotation->customer_zip_code ?? $invoice->customer_zip_code;
                $invoice->customer_tel_1 = $quotation->customer_tel_1 ?? $invoice->customer_tel_1;
                $invoice->customer_email = $quotation->customer_email ?? $invoice->customer_email;
                $invoice->customer_firstname = $quotation->customer_firstname ?? $invoice->customer_firstname;
                $invoice->customer_lastname = $quotation->customer_lastname ?? $invoice->customer_lastname;
                $invoice->customer_snapshot = $quotation->customer_snapshot ?? $invoice->customer_snapshot;
                $invoice->payment_terms = $quotation->payment_terms ?? $invoice->payment_terms;
                $invoice->notes = $quotation->notes ?? $invoice->notes;
                $invoice->has_vat = $quotation->has_vat;
                $invoice->vat_percentage = $quotation->vat_percentage;
                $invoice->pricing_mode = $quotation->pricing_mode;
                $invoice->has_withholding_tax = $quotation->has_withholding_tax;
                $invoice->withholding_tax_percentage = $quotation->withholding_tax_percentage;
                $invoice->deposit_percentage = $quotation->deposit_percentage;
                $invoice->deposit_mode = $quotation->deposit_mode ?? $invoice->deposit_mode;
                $invoice->document_header_type = $quotation->document_header_type ?? $invoice->document_header_type;

                // Delete all existing invoice items and recreate from quotation
                $deletedCount = \App\Models\Accounting\InvoiceItem::where('invoice_id', $invoice->id)->delete();
                $totalItemsDeleted += $deletedCount;

                // Create new invoice items from quotation items
                $itemsCreated = 0;
                foreach ($quotation->items as $qItem) {
                    \App\Models\Accounting\InvoiceItem::create([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'invoice_id' => $invoice->id,
                        'quotation_item_id' => $qItem->id,
                        'pricing_request_id' => $qItem->pricing_request_id,
                        'item_name' => $qItem->item_name,
                        'item_description' => $qItem->item_description,
                        'sequence_order' => $qItem->sequence_order,
                        'pattern' => $qItem->pattern,
                        'fabric_type' => $qItem->fabric_type,
                        'color' => $qItem->color,
                        'size' => $qItem->size,
                        'unit_price' => $qItem->unit_price,
                        'quantity' => $qItem->quantity,
                        'unit' => $qItem->unit,
                        'discount_percentage' => $qItem->discount_percentage,
                        'discount_amount' => $qItem->discount_amount,
                        'item_images' => $qItem->item_images,
                        'notes' => $qItem->notes,
                        'status' => 'draft',
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $itemsCreated++;
                }

                $totalItemsUpdated += $itemsCreated;

                // Recalculate invoice derived fields using InvoiceService
                $invoiceService = app(InvoiceService::class);
                $recalculated = $invoiceService->calculateBeforeVatFields($invoice->toArray());
                
                $invoice->net_subtotal = $recalculated['net_subtotal'];
                $invoice->subtotal_before_vat = $recalculated['subtotal_before_vat'];
                $invoice->deposit_amount_before_vat = $recalculated['deposit_amount_before_vat'];
                $invoice->updated_at = now();
                $invoice->save();

                // Log history for this invoice
                DocumentHistory::logAction(
                    'invoice',
                    $invoice->id,
                    'synced_from_quotation',
                    $userId,
                    json_encode([
                        'quotation_id' => $quotation->id,
                        'quotation_number' => $quotation->number,
                        'sync_mode' => 'immediate',
                        'updated_items_count' => $itemsCreated,
                        'deleted_items_count' => $deletedCount,
                        'timestamp' => now()->toISOString()
                    ])
                );

                $totalUpdated++;
            }

            // Update sync job status to completed
            $syncJob->update([
                'status' => 'completed',
                'progress_current' => $totalUpdated,
                'completed_at' => now()
            ]);

            DB::commit();

            Log::info('Quotation sync completed immediately', [
                'quotation_id' => $quotation->id,
                'sync_job_id' => $syncJob->id,
                'invoices_updated' => $totalUpdated,
                'items_created' => $totalItemsUpdated,
                'items_deleted' => $totalItemsDeleted
            ]);

            return [
                'updated_count' => $totalUpdated,
                'items_updated' => $totalItemsUpdated,
                'items_deleted' => $totalItemsDeleted,
                'sync_job_id' => $syncJob->id
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::syncToInvoicesImmediately error: ' . $e->getMessage(), [
                'quotation_id' => $quotation->id,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Queue invoice sync job for background processing (for >3 invoices)
     * 
     * @param Quotation $quotation
     * @param string|null $userId
     * @return string Sync job ID
     */
    private function queueInvoiceSync(Quotation $quotation, ?string $userId): string
    {
        try {
            // Capture pre-sync snapshot
            $quotationSnapshot = $quotation->load('items')->toArray();
            $invoicesSnapshot = $quotation->invoices()->with('items')->get()->toArray();
            $invoiceIds = array_column($invoicesSnapshot, 'id');

            // Create sync job record
            $syncJob = \App\Models\Accounting\QuotationInvoiceSyncJob::create([
                'quotation_id' => $quotation->id,
                'affected_invoice_ids' => $invoiceIds,
                'original_quotation_snapshot' => $quotationSnapshot,
                'original_invoices_snapshot' => $invoicesSnapshot,
                'status' => 'pending',
                'progress_current' => 0,
                'progress_total' => count($invoiceIds),
                'started_by' => $userId
            ]);

            // Dispatch queue job
            \App\Jobs\Accounting\SyncQuotationToInvoicesJob::dispatch(
                $quotation->id,
                $syncJob->id,
                $userId
            )->onQueue('accounting-sync');

            // Log action
            DocumentHistory::logAction(
                'quotation',
                $quotation->id,
                'sync_queued',
                $userId,
                json_encode([
                    'sync_job_id' => $syncJob->id,
                    'invoice_count' => count($invoiceIds)
                ])
            );

            Log::info('Quotation sync job queued', [
                'quotation_id' => $quotation->id,
                'sync_job_id' => $syncJob->id,
                'invoice_count' => count($invoiceIds)
            ]);

            return $syncJob->id;

        } catch (\Exception $e) {
            Log::error('QuotationService::queueInvoiceSync error: ' . $e->getMessage(), [
                'quotation_id' => $quotation->id,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
