<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\QuotationItem;
use App\Models\Accounting\DocumentStatusHistory;
use App\Models\PricingRequest;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use DateTime;

class QuotationService
{
    protected $documentNumberService;
    protected $documentWorkflowService;

    public function __construct(
        DocumentNumberService $documentNumberService,
        DocumentWorkflowService $documentWorkflowService
    ) {
        $this->documentNumberService = $documentNumberService;
        $this->documentWorkflowService = $documentWorkflowService;
    }

    /**
     * Generate quotation number
     */
    public function generateQuotationNo(): string
    {
        return $this->documentNumberService->generateNumber('quotation');
    }

    /**
     * Create quotation directly (not from pricing request)
     */
    public function createQuotation(array $data): Quotation
    {
        return DB::transaction(function () use ($data) {
            // Create quotation
            $quotation = Quotation::create([
                'id' => Str::uuid(),
                'quotation_no' => $this->generateQuotationNo(),
                'pricing_request_id' => null,
                'customer_id' => $data['customer_id'],
                'status' => Quotation::STATUS_DRAFT,
                'subtotal' => 0, // Will be calculated from items
                'tax_rate' => $data['tax_rate'] ?? config('accounting.default_vat_rate', 7.0),
                'deposit_amount' => $data['deposit_amount'] ?? 0,
                'payment_terms' => $data['payment_terms'] ?? null,
                'valid_until' => $data['valid_until'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['created_by'],
                'version_no' => 1
            ]);

            // Create quotation items
            if (!empty($data['items'])) {
                foreach ($data['items'] as $index => $item) {
                    QuotationItem::create([
                        'id' => Str::uuid(),
                        'quotation_id' => $quotation->id,
                        'item_name' => $item['item_name'],
                        'item_description' => $item['item_description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'] ?? 'ชิ้น',
                        'unit_price' => $item['unit_price'],
                        'item_order' => $index + 1
                    ]);
                }
            }

            // Calculate totals
            $quotation->calculateTotals();
            $quotation->save();

            // Record status history
            $this->recordStatusHistory(
                $quotation->id,
                null,
                Quotation::STATUS_DRAFT,
                DocumentStatusHistory::ACTION_TYPE_CREATE,
                'สร้างใบเสนอราคาใหม่',
                $data['created_by']
            );

            return $quotation->load(['items', 'customer']);
        });
    }

    /**
     * Create quotation from pricing request
     */
    public function createFromPricingRequest(PricingRequest $pricingRequest, array $data): Quotation
    {
        return DB::transaction(function () use ($pricingRequest, $data) {
            // Create quotation
            $quotation = Quotation::create([
                'id' => Str::uuid(),
                'quotation_no' => $this->generateQuotationNo(),
                'pricing_request_id' => $pricingRequest->pr_id,
                'customer_id' => $pricingRequest->pr_cus_id,
                'status' => Quotation::STATUS_DRAFT,
                'subtotal' => $data['subtotal'] ?? 0,
                'tax_rate' => $data['tax_rate'] ?? 7.0,
                'deposit_amount' => $data['deposit_amount'] ?? 0,
                'payment_terms' => $data['payment_terms'] ?? null,
                'valid_until' => $data['valid_until'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['created_by'],
                'version_no' => 1
            ]);

            // Create quotation items
            if (!empty($data['items'])) {
                foreach ($data['items'] as $index => $item) {
                    QuotationItem::create([
                        'id' => Str::uuid(),
                        'quotation_id' => $quotation->id,
                        'item_name' => $item['item_name'],
                        'item_description' => $item['item_description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'] ?? 'ชิ้น',
                        'unit_price' => $item['unit_price'],
                        'item_order' => $index + 1
                    ]);
                }
            } else {
                // Auto-generate items from pricing request if no items provided
                $this->createQuotationItemsFromPricingRequest($quotation, $pricingRequest);
            }

            // Calculate totals
            $quotation->calculateTotals();
            $quotation->save();

            // Record status history
            $this->recordStatusHistory(
                $quotation->id,
                null,
                Quotation::STATUS_DRAFT,
                DocumentStatusHistory::ACTION_TYPE_CREATE,
                'สร้างใบเสนอราคาใหม่จากระบบ Pricing: ' . $pricingRequest->pr_no,
                $data['created_by']
            );

            return $quotation->load(['items', 'customer', 'pricingRequest']);
        });
    }

    /**
     * Create quotation items from pricing request data
     */
    private function createQuotationItemsFromPricingRequest(Quotation $quotation, PricingRequest $pricingRequest)
    {
        $itemOrder = 1;
        
        // Main item from pricing request
        QuotationItem::create([
            'id' => Str::uuid(),
            'quotation_id' => $quotation->id,
            'item_name' => $pricingRequest->pr_work_name ?? 'สินค้าตามใบขอราคา',
            'item_description' => $this->buildItemDescription($pricingRequest),
            'quantity' => $pricingRequest->pr_quantity ?? 1,
            'unit' => 'ชิ้น',
            'unit_price' => 0, // Will be updated later
            'item_order' => $itemOrder++
        ]);

        // Additional items based on pricing request details
        if (!empty($pricingRequest->pr_embroider)) {
            QuotationItem::create([
                'id' => Str::uuid(),
                'quotation_id' => $quotation->id,
                'item_name' => 'งานปัก',
                'item_description' => $pricingRequest->pr_embroider,
                'quantity' => $pricingRequest->pr_quantity ?? 1,
                'unit' => 'จุด',
                'unit_price' => 0,
                'item_order' => $itemOrder++
            ]);
        }

        if (!empty($pricingRequest->pr_silk)) {
            QuotationItem::create([
                'id' => Str::uuid(),
                'quotation_id' => $quotation->id,
                'item_name' => 'งานสกรีน',
                'item_description' => $pricingRequest->pr_silk,
                'quantity' => $pricingRequest->pr_quantity ?? 1,
                'unit' => 'หน้า',
                'unit_price' => 0,
                'item_order' => $itemOrder++
            ]);
        }

        if (!empty($pricingRequest->pr_dft)) {
            QuotationItem::create([
                'id' => Str::uuid(),
                'quotation_id' => $quotation->id,
                'item_name' => 'งาน DTF',
                'item_description' => $pricingRequest->pr_dft,
                'quantity' => $pricingRequest->pr_quantity ?? 1,
                'unit' => 'แผ่น',
                'unit_price' => 0,
                'item_order' => $itemOrder++
            ]);
        }
    }

    /**
     * Build item description from pricing request
     */
    private function buildItemDescription(PricingRequest $pricingRequest): string
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

        return implode(', ', $description);
    }

    /**
     * Update quotation
     */
    public function updateQuotation(Quotation $quotation, array $data): Quotation
    {
        return DB::transaction(function () use ($quotation, $data) {
            $oldStatus = $quotation->status;

            // Update quotation
            $quotation->update([
                'subtotal' => $data['subtotal'] ?? $quotation->subtotal,
                'tax_rate' => $data['tax_rate'] ?? $quotation->tax_rate,
                'deposit_amount' => $data['deposit_amount'] ?? $quotation->deposit_amount,
                'payment_terms' => $data['payment_terms'] ?? $quotation->payment_terms,
                'valid_until' => $data['valid_until'] ?? $quotation->valid_until,
                'remarks' => $data['remarks'] ?? $quotation->remarks,
                'updated_by' => $data['updated_by'],
                'version_no' => $quotation->version_no + 1
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $quotation->items()->delete();

                // Create new items
                foreach ($data['items'] as $index => $item) {
                    QuotationItem::create([
                        'id' => Str::uuid(),
                        'quotation_id' => $quotation->id,
                        'item_name' => $item['item_name'],
                        'item_description' => $item['item_description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'] ?? 'ชิ้น',
                        'unit_price' => $item['unit_price'],
                        'item_order' => $index + 1
                    ]);
                }
            }

            // Calculate totals
            $quotation->calculateTotals();
            $quotation->save();

            // Record status history
            $this->recordStatusHistory(
                $quotation->id,
                $oldStatus,
                $quotation->status,
                DocumentStatusHistory::ACTION_TYPE_UPDATE,
                'แก้ไขใบเสนอราคา',
                $data['updated_by']
            );

            return $quotation->load(['items', 'customer', 'pricingRequest']);
        });
    }

    /**
     * Change quotation status
     */
    public function changeStatus(Quotation $quotation, string $newStatus, string $userId, string $remarks = null): Quotation
    {
        return $this->documentWorkflowService->changeStatus(
            $quotation,
            $newStatus,
            $userId,
            $remarks,
            'update'
        );
    }

    /**
     * Record status history
     * 
     * This method is a proxy to the DocumentWorkflowService method for backward compatibility
     */
    private function recordStatusHistory(string $documentId, ?string $statusFrom, string $statusTo, string $actionType, string $remarks, string $userId): void
    {
        $this->documentWorkflowService->recordStatusHistory(
            $documentId,
            'quotation',
            $statusFrom,
            $statusTo,
            $actionType,
            $remarks,
            $userId
        );
    }

    /**
     * Get quotation with all relationships including detailed customer data
     */
    public function getQuotationWithRelations(string $quotationId): ?Quotation
    {
        return Quotation::with([
            'items' => function ($query) {
                $query->orderBy('item_order');
            },
            'customer' => function ($query) {
                $query->with(['customerDetail', 'customerGroup']);
            },
            'pricingRequest' => function ($query) {
                $query->with(['pricingNote', 'pricingStatus']);
            },
            'creator',
            'updater',
            'approver',
            'rejecter',
            'statusHistory' => function ($query) {
                $query->with('user')->orderBy('changed_at', 'desc');
            },
            'attachments.uploader',
            'invoices'
        ])->find($quotationId);
    }

    /**
     * Check if quotation can create invoice
     */
    public function canCreateInvoice(Quotation $quotation): bool
    {
        return $quotation->status === Quotation::STATUS_APPROVED;
    }

    /**
     * Get quotations for listing with filters and sorting
     */
    public function getQuotationsList(array $filters = [])
    {
        $query = Quotation::with(['customer', 'creator'])
            ->withCount('items');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->byCustomer($filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('quotation_no', 'like', $search)
                  ->orWhere('remarks', 'like', $search)
                  ->orWhereHas('customer', function ($customerQuery) use ($search) {
                      $customerQuery->where('cus_firstname', 'like', $search)
                                   ->orWhere('cus_lastname', 'like', $search)
                                   ->orWhere('cus_company', 'like', $search);
                  });
            });
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        switch ($sortBy) {
            case 'quotation_no':
                $query->orderBy('quotation_no', $sortOrder);
                break;
            case 'total_amount':
                $query->orderBy('total_amount', $sortOrder);
                break;
            case 'status':
                $query->orderBy('status', $sortOrder);
                break;
            case 'valid_until':
                $query->orderBy('valid_until', $sortOrder);
                break;
            case 'customer_name':
                $query->join('master_customers', 'quotations.customer_id', '=', 'master_customers.cus_id')
                      ->orderBy('master_customers.cus_firstname', $sortOrder)
                      ->orderBy('master_customers.cus_lastname', $sortOrder)
                      ->select('quotations.*');
                break;
            default:
                $query->orderBy('created_at', $sortOrder);
                break;
        }

        // Add secondary sort for consistency
        if ($sortBy !== 'created_at') {
            $query->orderBy('created_at', 'desc');
        }

        // Pagination
        $perPage = $filters['per_page'] ?? 15;
        return $query->paginate($perPage);
    }
}
