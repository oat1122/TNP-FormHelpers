<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use App\Models\PricingRequest;
use App\Models\PricingRequestNote;
use App\Models\MasterCustomer;
use Illuminate\Support\Facades\DB;

class PricingIntegrationService
{
    /**
     * Get completed pricing requests that can be converted to quotations
     */
    public function getCompletedPricingRequests(array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = PricingRequest::with(['pricingCustomer', 'pricingNote', 'pricingStatus'])
            ->where('pr_is_deleted', false)
            ->whereIn('pr_status_id', [
                '20db8be1-092b-11f0-b223-38ca84abdf0a', // ได้ราคาแล้ว
                '20db8c1d-092b-11f0-b223-38ca84abdf0a'  // Complete
            ])
            ->whereDoesntHave('quotations') // ยังไม่ได้สร้างใบเสนอราคา
            ->orderBy('pr_updated_date', 'desc');

        // Apply filters
        if (!empty($filters['customer_id'])) {
            $query->where('pr_cus_id', $filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('pr_no', 'like', $search)
                  ->orWhere('pr_work_name', 'like', $search)
                  ->orWhereHas('pricingCustomer', function ($customerQuery) use ($search) {
                      $customerQuery->where('cus_name', 'like', $search)
                                   ->orWhere('cus_company', 'like', $search);
                  });
            });
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('pr_created_date', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('pr_created_date', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Get pricing request with all related data for quotation creation
     */
    public function getPricingRequestForQuotation(string $pricingRequestId): ?PricingRequest
    {
        try {
            \Log::info('PricingIntegrationService: getPricingRequestForQuotation called', ['id' => $pricingRequestId]);
            
            $result = PricingRequest::with([
                'pricingCustomer',
                'pricingNote' => function ($query) {
                    $query->where('prn_is_deleted', false)
                          ->orderBy('prn_created_date', 'desc');
                },
                'pricingStatus'
            ])
            ->where('pr_id', $pricingRequestId)
            ->where('pr_is_deleted', false)
            ->first();
            
            \Log::info('PricingIntegrationService: Query result', [
                'id' => $pricingRequestId,
                'found' => $result ? true : false,
                'result_data' => $result ? [
                    'pr_id' => $result->pr_id,
                    'pr_no' => $result->pr_no,
                    'pr_status_id' => $result->pr_status_id,
                    'customer_loaded' => $result->pricingCustomer ? true : false,
                    'status_loaded' => $result->pricingStatus ? true : false,
                    'notes_count' => $result->pricingNote ? $result->pricingNote->count() : 0
                ] : null
            ]);
            
            return $result;
            
        } catch (\Exception $e) {
            \Log::error('PricingIntegrationService: Error in getPricingRequestForQuotation', [
                'id' => $pricingRequestId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get latest price from pricing request notes
     */
    public function getLatestPriceFromNotes(PricingRequest $pricingRequest): ?float
    {
        $priceNotes = $pricingRequest->pricingNote()
            ->where('prn_note_type', 2) // price type
            ->where('prn_is_deleted', false)
            ->orderBy('prn_created_date', 'desc')
            ->get();

        foreach ($priceNotes as $note) {
            // Extract price from note text
            if (preg_match('/(\d+(?:,\d+)*(?:\.\d{2})?)\s*บาท/', $note->prn_text, $matches)) {
                $price = str_replace(',', '', $matches[1]);
                return (float) $price;
            }
            
            // Try to extract just numbers
            if (preg_match('/(\d+(?:,\d+)*(?:\.\d+)?)/', $note->prn_text, $matches)) {
                $price = str_replace(',', '', $matches[1]);
                return (float) $price;
            }
        }

        return null;
    }

    /**
     * Create quotation items based on pricing request with estimated pricing
     */
    public function createQuotationItemsWithPricing(PricingRequest $pricingRequest): array
    {
        $items = [];
        $totalPrice = $this->getLatestPriceFromNotes($pricingRequest) ?? 0;
        $quantity = $pricingRequest->pr_quantity ?? 1;
        
        // Calculate unit price for main item
        $unitPrice = $quantity > 0 ? ($totalPrice / $quantity) : 0;

        // Main item
        $items[] = [
            'item_name' => $pricingRequest->pr_work_name ?? 'สินค้าตามใบขอราคา',
            'item_description' => $this->buildItemDescriptionFromPricing($pricingRequest),
            'quantity' => $quantity,
            'unit' => 'ชิ้น',
            'unit_price' => $unitPrice
        ];

        // Additional items for special work (with 0 price since included in main)
        if (!empty($pricingRequest->pr_embroider)) {
            $items[] = [
                'item_name' => 'งานปัก',
                'item_description' => $pricingRequest->pr_embroider,
                'quantity' => $quantity,
                'unit' => 'จุด',
                'unit_price' => 0
            ];
        }

        if (!empty($pricingRequest->pr_silk)) {
            $items[] = [
                'item_name' => 'งานสกรีน',
                'item_description' => $pricingRequest->pr_silk,
                'quantity' => $quantity,
                'unit' => 'หน้า',
                'unit_price' => 0
            ];
        }

        if (!empty($pricingRequest->pr_dft)) {
            $items[] = [
                'item_name' => 'งาน DTF',
                'item_description' => $pricingRequest->pr_dft,
                'quantity' => $quantity,
                'unit' => 'แผ่น',
                'unit_price' => 0
            ];
        }

        return $items;
    }

    /**
     * Build comprehensive item description from pricing request
     */
    private function buildItemDescriptionFromPricing(PricingRequest $pricingRequest): string
    {
        $description = [];

        if ($pricingRequest->pr_pattern) {
            $description[] = "แพทเทิร์น: " . $pricingRequest->pr_pattern;
        }

        if ($pricingRequest->pr_fabric_type) {
            $description[] = "ผ้า: " . $pricingRequest->pr_fabric_type;
        }

        if ($pricingRequest->pr_color) {
            $description[] = "สี: " . $pricingRequest->pr_color;
        }

        if ($pricingRequest->pr_sizes) {
            $description[] = "ไซส์: " . $pricingRequest->pr_sizes;
        }

        if ($pricingRequest->pr_sub) {
            $description[] = "หมายเหตุ: " . $pricingRequest->pr_sub;
        }

        if ($pricingRequest->pr_due_date) {
            $description[] = "กำหนดส่ง: " . $pricingRequest->pr_due_date->format('d/m/Y');
        }

        return implode(', ', $description);
    }

    /**
     * Get customer data for quotation
     */
    public function getCustomerData(string $customerId): ?MasterCustomer
    {
        return MasterCustomer::with(['customerDetail', 'customerGroup'])
            ->where('cus_id', $customerId)
            ->where('cus_is_use', true)
            ->first();
    }

    /**
     * Get comprehensive customer data for quotation
     */
    public function getCustomerDataForQuotation(string $customerId): ?array
    {
        $customer = MasterCustomer::with(['customerDetail', 'customerGroup'])
            ->where('cus_id', $customerId)
            ->where('cus_is_use', true)
            ->first();

        if (!$customer) {
            return null;
        }

        return [
            'id' => $customer->cus_id,
            'customer_no' => $customer->cus_no,
            'name' => $customer->cus_name,
            'firstname' => $customer->cus_firstname,
            'lastname' => $customer->cus_lastname,
            'full_name' => trim(($customer->cus_firstname ?? '') . ' ' . ($customer->cus_lastname ?? '')),
            'department' => $customer->cus_depart,
            'company' => $customer->cus_company,
            'email' => $customer->cus_email,
            'phone_1' => $customer->cus_tel_1,
            'phone_2' => $customer->cus_tel_2,
            'tax_id' => $customer->cus_tax_id,
            'address' => $customer->cus_address,
            'province_id' => $customer->cus_pro_id,
            'district_id' => $customer->cus_dis_id,
            'sub_district_id' => $customer->cus_sub_id,
            'zip_code' => $customer->cus_zip_code,
            'channel' => $customer->cus_channel,
            'business_type_id' => $customer->cus_bt_id,
            'manage_by' => $customer->cus_manage_by,
            'created_date' => $customer->cus_created_date,
            'is_active' => $customer->cus_is_use,
            // Relationships
            'customer_group' => $customer->customerGroup ? [
                'id' => $customer->customerGroup->mcg_id ?? null,
                'name' => $customer->customerGroup->mcg_name ?? null
            ] : null,
            'customer_detail' => $customer->customerDetail ? [
                'note' => $customer->customerDetail->cd_note ?? null,
                'last_contact' => $customer->customerDetail->cd_last_datetime ?? null
            ] : null
        ];
    }

    /**
     * Check if pricing request can be converted to quotation
     */
    public function canCreateQuotationFromPricing(PricingRequest $pricingRequest): bool
    {
        // Check if status allows quotation creation
        $allowedStatuses = [
            '20db8be1-092b-11f0-b223-38ca84abdf0a', // ได้ราคาแล้ว
            '20db8c1d-092b-11f0-b223-38ca84abdf0a'  // Complete
        ];

        if (!in_array($pricingRequest->pr_status_id, $allowedStatuses)) {
            return false;
        }

        // Check if not deleted
        if ($pricingRequest->pr_is_deleted) {
            return false;
        }

        // Check if customer exists and is active
        $customer = $this->getCustomerData($pricingRequest->pr_cus_id);
        if (!$customer) {
            return false;
        }

        // Check if quotation doesn't already exist
        $existingQuotation = Quotation::where('pricing_request_id', $pricingRequest->pr_id)->first();
        if ($existingQuotation) {
            return false;
        }

        return true;
    }

    /**
     * Get pricing request summary with customer data
     */
    public function getPricingRequestSummary(PricingRequest $pricingRequest): array
    {
        try {
            \Log::info('PricingIntegrationService: getPricingRequestSummary called', [
                'pr_id' => $pricingRequest->pr_id
            ]);
            
            $latestPrice = $this->getLatestPriceFromNotes($pricingRequest);
            \Log::info('PricingIntegrationService: Latest price extracted', [
                'pr_id' => $pricingRequest->pr_id,
                'latest_price' => $latestPrice
            ]);
            
            $customerData = $this->getCustomerDataForQuotation($pricingRequest->pr_cus_id);
            \Log::info('PricingIntegrationService: Customer data retrieved', [
                'pr_id' => $pricingRequest->pr_id,
                'customer_id' => $pricingRequest->pr_cus_id,
                'customer_found' => $customerData ? true : false
            ]);
            
            $quotationItems = $this->createQuotationItemsWithPricing($pricingRequest);
            \Log::info('PricingIntegrationService: Quotation items created', [
                'pr_id' => $pricingRequest->pr_id,
                'items_count' => count($quotationItems)
            ]);
            
            $result = [
                'pricing_request' => [
                    'id' => $pricingRequest->pr_id,
                    'no' => $pricingRequest->pr_no,
                    'work_name' => $pricingRequest->pr_work_name,
                    'pattern' => $pricingRequest->pr_pattern,
                    'fabric_type' => $pricingRequest->pr_fabric_type,
                    'color' => $pricingRequest->pr_color,
                    'sizes' => $pricingRequest->pr_sizes,
                    'quantity' => $pricingRequest->pr_quantity,
                    'due_date' => $pricingRequest->pr_due_date,
                    'silk_work' => $pricingRequest->pr_silk,
                    'dft_work' => $pricingRequest->pr_dft,
                    'embroider_work' => $pricingRequest->pr_embroider,
                    'sub_work' => $pricingRequest->pr_sub,
                    'other_screen' => $pricingRequest->pr_other_screen,
                    'image_url' => $pricingRequest->pr_image ? url('storage/images/pricing_req/' . $pricingRequest->pr_image) : null,
                    'created_date' => $pricingRequest->pr_created_date,
                    'latest_price' => $latestPrice,
                    'status_id' => $pricingRequest->pr_status_id,
                    'status_name' => $pricingRequest->pricingStatus->status_name ?? null
                ],
                'customer' => $customerData ?: [
                    'id' => $pricingRequest->pricingCustomer->cus_id ?? null,
                    'name' => $pricingRequest->pricingCustomer->cus_name ?? null,
                    'company' => $pricingRequest->pricingCustomer->cus_company ?? null,
                    'email' => $pricingRequest->pricingCustomer->cus_email ?? null,
                    'phone_1' => $pricingRequest->pricingCustomer->cus_tel_1 ?? null
                ],
                'items' => $quotationItems,
                'notes' => $pricingRequest->pricingNote->map(function ($note) {
                    return [
                        'id' => $note->prn_id,
                        'type' => $note->prn_note_type,
                        'type_name' => $this->getNoteTypeName($note->prn_note_type),
                        'text' => $note->prn_text,
                        'created_date' => $note->prn_created_date,
                        'created_by' => $note->prnCreatedBy->user_nickname ?? 'Unknown'
                    ];
                })
            ];
            
            \Log::info('PricingIntegrationService: Summary created successfully', [
                'pr_id' => $pricingRequest->pr_id
            ]);
            
            return $result;
            
        } catch (\Exception $e) {
            \Log::error('PricingIntegrationService: Error in getPricingRequestSummary', [
                'pr_id' => $pricingRequest->pr_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get note type name
     */
    private function getNoteTypeName(int $type): string
    {
        switch ($type) {
            case 1:
                return 'Sales Note';
            case 2:
                return 'Price Note';
            case 3:
                return 'Manager Note';
            default:
                return 'Unknown';
        }
    }
}
