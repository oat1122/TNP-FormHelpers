<?php

namespace App\Services\Accounting;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\Receipt;
use App\Models\MasterCustomer;
use App\Models\PricingRequest;
use App\Models\PricingRequestNote;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Autofill data fetcher for the accounting document chain:
 *   Pricing Request → Quotation → Invoice → Receipt → Delivery Note
 *
 * Read-only (no DB writes except `markPricingRequestAsUsed` which appends
 * a manager note). The 9 public methods cover three concerns:
 *
 *   1. Pricing-request autofill (get + cascade)
 *   2. Customer fetch + search
 *   3. Notes (read + mark-as-used)
 */
class AutofillService
{
    /**
     * Roles permitted to read manager-tier notes (note_type = 3).
     */
    private const MANAGER_NOTE_ROLES = ['production', 'manager', 'admin'];

    /**
     * Pricing-request note status code that flags a "completed" record
     * eligible for inclusion in `getCompletedPricingRequests()`.
     */
    private const COMPLETED_PRICING_STATUS_ID = '20db8be1-092b-11f0-b223-38ca84abdf0a';

    /**
     * Note-type metadata: label + UI colour, keyed by `prn_note_type`.
     */
    private const NOTE_TYPE_LABELS = [
        1 => 'Sale',
        2 => 'Price',
        3 => 'Manager',
    ];

    private const NOTE_TYPE_COLORS = [
        1 => '#2196F3', // Sale (blue)
        2 => '#4CAF50', // Price (green)
        3 => '#FF9800', // Manager (orange)
    ];

    // ---------------------------------------------------------------------
    // Pricing-request autofill
    // ---------------------------------------------------------------------

    /**
     * @return array<string, mixed>
     */
    public function getAutofillDataFromPricingRequest(string $pricingRequestId): array
    {
        try {
            $pricingRequest = PricingRequest::with(['pricingCustomer'])
                ->where('pr_id', $pricingRequestId)
                ->where('pr_is_deleted', 0)
                ->first();

            if (! $pricingRequest) {
                throw new \Exception('Pricing Request not found');
            }

            $customer = $pricingRequest->pricingCustomer;

            $notes = $this->fetchPricingRequestNotes($pricingRequestId, $this->canViewManagerNotesFromAuth());
            $formattedNotes = $this->formatPricingRequestNotes($notes);
            $initialNotes = $this->buildInitialNotesText($formattedNotes);

            return $this->buildAutofillPayload($pricingRequest, $customer, $formattedNotes, $initialNotes);

        } catch (\Exception $e) {
            Log::error('AutofillService::getAutofillDataFromPricingRequest error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * @param  array<string, mixed>|null  $userInfo
     * @return array<string, mixed>
     */
    public function getCustomerAutofillData(string $customerId, ?array $userInfo = null): array
    {
        try {
            $query = MasterCustomer::where('cus_id', $customerId)
                ->where('cus_is_use', true);

            // Access control: non-admin can only read customers they manage.
            if ($userInfo && isset($userInfo['user_id']) && $userInfo['user_id'] != 1) {
                $query->where('cus_manage_by', $userInfo['user_id']);
            }

            $customer = $query->first();

            if (! $customer) {
                throw new \Exception('Customer not found or access denied');
            }

            $recentPricingRequests = PricingRequest::where('pr_cus_id', $customerId)
                ->where('pr_is_deleted', 0)
                ->orderBy('pr_created_date', 'DESC')
                ->limit(5)
                ->get();

            return [
                'cus_id' => $customer->cus_id,
                'cus_company' => $customer->cus_company,
                'cus_name' => $customer->cus_name,
                'cus_depart' => $customer->cus_depart,
                'cus_tax_id' => $customer->cus_tax_id,
                'cus_address' => $customer->cus_address,
                'cus_zip_code' => $customer->cus_zip_code,
                'cus_tel_1' => $customer->cus_tel_1,
                'cus_tel_2' => $customer->cus_tel_2,
                'cus_email' => $customer->cus_email,
                'cus_firstname' => $customer->cus_firstname,
                'cus_lastname' => $customer->cus_lastname,
                'recent_pricing_requests' => $recentPricingRequests->map(fn ($pr) => [
                    'pr_id' => $pr->pr_id,
                    'pr_no' => $pr->pr_no,
                    'pr_work_name' => $pr->pr_work_name,
                    'pr_created_date' => $pr->pr_created_date,
                ])->toArray(),
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCustomerAutofillData error: '.$e->getMessage());
            throw $e;
        }
    }

    // ---------------------------------------------------------------------
    // Cascade autofill (Quotation → Invoice → Receipt → DeliveryNote)
    // ---------------------------------------------------------------------

    /**
     * @return array<string, mixed>
     */
    public function getCascadeAutofillForInvoice(string $quotationId): array
    {
        try {
            $quotation = Quotation::findOrFail($quotationId);

            return [
                'customer_id' => $quotation->customer_id,
                'customer_company' => $quotation->customer_company,
                'customer_tax_id' => $quotation->customer_tax_id,
                'customer_address' => $quotation->customer_address,
                'customer_zip_code' => $quotation->customer_zip_code,
                'customer_tel_1' => $quotation->customer_tel_1,
                'customer_email' => $quotation->customer_email,
                'customer_firstname' => $quotation->customer_firstname,
                'customer_lastname' => $quotation->customer_lastname,
                'work_name' => $quotation->work_name,
                'fabric_type' => $quotation->fabric_type,
                'pattern' => $quotation->pattern,
                'color' => $quotation->color,
                'sizes' => $quotation->sizes,
                'quantity' => $quotation->quantity,
                'quotation_id' => $quotation->id,
                'subtotal' => $quotation->subtotal,
                'tax_amount' => $quotation->tax_amount,
                'total_amount' => $quotation->total_amount,
                'due_date' => $quotation->due_date,
                'payment_terms' => $quotation->payment_terms,
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCascadeAutofillForInvoice error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function getCascadeAutofillForReceipt(string $invoiceId): array
    {
        try {
            $invoice = Invoice::findOrFail($invoiceId);

            return [
                'customer_id' => $invoice->customer_id,
                'customer_company' => $invoice->customer_company,
                'customer_tax_id' => $invoice->customer_tax_id,
                'customer_address' => $invoice->customer_address,
                'customer_zip_code' => $invoice->customer_zip_code,
                'customer_tel_1' => $invoice->customer_tel_1,
                'customer_email' => $invoice->customer_email,
                'customer_firstname' => $invoice->customer_firstname,
                'customer_lastname' => $invoice->customer_lastname,
                'work_name' => $invoice->work_name,
                'quantity' => $invoice->quantity,
                'invoice_id' => $invoice->id,
                'subtotal' => $invoice->subtotal,
                'tax_amount' => $invoice->tax_amount,
                'total_amount' => $invoice->total_amount,
                'remaining_amount' => $invoice->remaining_amount,
                'payment_method' => $invoice->payment_method,
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCascadeAutofillForReceipt error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function getCascadeAutofillForDeliveryNote(string $receiptId): array
    {
        try {
            $receipt = Receipt::findOrFail($receiptId);

            return [
                'customer_id' => $receipt->customer_id,
                'customer_company' => $receipt->customer_company,
                'customer_address' => $receipt->customer_address,
                'customer_zip_code' => $receipt->customer_zip_code,
                'customer_tel_1' => $receipt->customer_tel_1,
                'customer_firstname' => $receipt->customer_firstname,
                'customer_lastname' => $receipt->customer_lastname,
                'work_name' => $receipt->work_name,
                'quantity' => $receipt->quantity,
                'receipt_id' => $receipt->id,
                'delivery_address' => $receipt->customer_address,
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCascadeAutofillForDeliveryNote error: '.$e->getMessage());
            throw $e;
        }
    }

    // ---------------------------------------------------------------------
    // Customer search
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>|null  $userInfo
     * @return Collection<int, array<string, mixed>>
     */
    public function searchCustomers(string $searchTerm, int $limit = 10, ?array $userInfo = null): Collection
    {
        try {
            $query = MasterCustomer::where('cus_is_use', true);

            // Access control: non-admin can only see their own customers.
            if ($userInfo && isset($userInfo['user_id']) && $userInfo['user_id'] != 1) {
                $query->where('cus_manage_by', $userInfo['user_id']);
            }

            $query->where(function ($q) use ($searchTerm) {
                $q->where('cus_company', 'like', '%'.$searchTerm.'%')
                    ->orWhere('cus_tax_id', 'like', '%'.$searchTerm.'%')
                    ->orWhere('cus_firstname', 'like', '%'.$searchTerm.'%')
                    ->orWhere('cus_lastname', 'like', '%'.$searchTerm.'%')
                    ->orWhereRaw("CONCAT(cus_firstname, ' ', cus_lastname) LIKE ?", ['%'.$searchTerm.'%']);
            });

            return $query->select([
                'cus_id', 'cus_company', 'cus_tax_id',
                'cus_firstname', 'cus_lastname', 'cus_tel_1', 'cus_email',
            ])
                ->limit($limit)
                ->get()
                ->map(fn ($customer) => [
                    'cus_id' => $customer->cus_id,
                    'cus_company' => $customer->cus_company,
                    'cus_tax_id' => $customer->cus_tax_id,
                    'cus_firstname' => $customer->cus_firstname,
                    'cus_lastname' => $customer->cus_lastname,
                    'cus_fullname' => trim($customer->cus_firstname.' '.$customer->cus_lastname),
                    'cus_tel_1' => $customer->cus_tel_1,
                    'cus_email' => $customer->cus_email,
                ]);

        } catch (\Exception $e) {
            Log::error('AutofillService::searchCustomers error: '.$e->getMessage());
            throw $e;
        }
    }

    // ---------------------------------------------------------------------
    // Completed pricing requests (Step 0 of Pricing Integration)
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>|null  $userInfo
     * @return LengthAwarePaginator<PricingRequest>
     */
    public function getCompletedPricingRequests(array $filters = [], int $perPage = 20, int $page = 1, ?array $userInfo = null): LengthAwarePaginator
    {
        try {
            $canViewManagerNotes = $this->canViewManagerNotesFromUserInfo($userInfo);

            $query = $this->buildCompletedPricingRequestQuery($canViewManagerNotes, $filters, $userInfo);
            $this->applyPricingRequestFilters($query, $filters);
            $query->orderBy('pr_updated_date', 'DESC');

            $results = $query->paginate($perPage, ['*'], 'page', $page);

            // Side-effect: hydrate transformed shape into the paginator's
            // collection so consumers reading $paginator->items() see the
            // FE-friendly payload alongside the raw model attributes.
            $results->getCollection()->map(fn (PricingRequest $pr) => $this->transformPricingRequestRow($pr));

            return $results;

        } catch (\Exception $e) {
            Log::error('AutofillService::getCompletedPricingRequests error: '.$e->getMessage());
            throw $e;
        }
    }

    // ---------------------------------------------------------------------
    // Notes API
    // ---------------------------------------------------------------------

    /**
     * @return array<string, mixed>
     */
    public function getPricingRequestNotes(string $pricingRequestId): array
    {
        try {
            $pricingRequest = PricingRequest::where('pr_id', $pricingRequestId)
                ->where('pr_is_deleted', 0)
                ->first();

            if (! $pricingRequest) {
                throw new \Exception('Pricing Request not found');
            }

            $canViewManagerNotes = $this->canViewManagerNotesFromAuth();
            $noteTypes = $canViewManagerNotes ? [1, 2, 3] : [1, 2];

            $notes = PricingRequestNote::with('prnCreatedBy')
                ->where('prn_pr_id', $pricingRequestId)
                ->whereIn('prn_note_type', $noteTypes)
                ->where('prn_is_deleted', 0)
                ->orderBy('prn_created_date', 'ASC')
                ->get();

            $formattedNotes = $notes->map(fn ($note) => [
                'prn_id' => $note->prn_id,
                'prn_pr_id' => $note->prn_pr_id,
                'prn_text' => $note->prn_text,
                'prn_note_type' => $note->prn_note_type,
                'prn_note_type_label' => self::NOTE_TYPE_LABELS[$note->prn_note_type] ?? 'Unknown',
                'prn_note_type_color' => self::NOTE_TYPE_COLORS[$note->prn_note_type] ?? '#757575',
                'prn_created_date' => $note->prn_created_date,
                'prn_created_by' => $note->prn_created_by,
                'created_by_name' => $note->prnCreatedBy->user_nickname ?? $note->prnCreatedBy->user_firstname ?? 'Unknown User',
                'formatted_date' => $note->prn_created_date ? $note->prn_created_date->format('d/m/Y H:i') : '',
            ]);

            return [
                'sale_notes' => $formattedNotes->where('prn_note_type', 1)->values(),
                'price_notes' => $formattedNotes->where('prn_note_type', 2)->values(),
                'manager_notes' => $canViewManagerNotes ? $formattedNotes->where('prn_note_type', 3)->values() : [],
                'all_notes' => $formattedNotes->values(),
                'summary' => [
                    'total_notes' => $formattedNotes->count(),
                    'sale_count' => $formattedNotes->where('prn_note_type', 1)->count(),
                    'price_count' => $formattedNotes->where('prn_note_type', 2)->count(),
                    'manager_count' => $canViewManagerNotes ? $formattedNotes->where('prn_note_type', 3)->count() : 0,
                ],
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getPricingRequestNotes error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Append a manager-tier note marking the pricing request as used by a
     * quotation. (The only write in this service.)
     *
     * @return array<string, mixed>
     */
    public function markPricingRequestAsUsed(string $pricingRequestId, ?string $userId = null): array
    {
        try {
            $pricingRequest = PricingRequest::where('pr_id', $pricingRequestId)
                ->where('pr_is_deleted', 0)
                ->first();

            if (! $pricingRequest) {
                throw new \Exception('Pricing Request not found');
            }

            PricingRequestNote::create([
                'prn_id' => (string) Str::uuid(),
                'prn_pr_id' => $pricingRequestId,
                'prn_text' => 'ใช้สำหรับสร้างใบเสนอราคาแล้ว',
                'prn_note_type' => 3,
                'prn_is_deleted' => 0,
                'prn_created_date' => now(),
                'prn_created_by' => $userId,
                'prn_updated_date' => now(),
                'prn_updated_by' => $userId,
            ]);

            return [
                'pr_id' => $pricingRequestId,
                'marked_at' => now()->format('Y-m-d\TH:i:s\Z'),
                'marked_by' => $userId,
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::markPricingRequestAsUsed error: '.$e->getMessage());
            throw $e;
        }
    }

    // ---------------------------------------------------------------------
    // Private helpers — authorization
    // ---------------------------------------------------------------------

    /**
     * Whether the request actor (from auth()) may read manager-tier notes.
     */
    private function canViewManagerNotesFromAuth(): bool
    {
        $user = auth()->user();

        return $user !== null && in_array($user->role, self::MANAGER_NOTE_ROLES, true);
    }

    /**
     * Same check as `canViewManagerNotesFromAuth()` but reads from a passed
     * userInfo array (used by API endpoints that supply the actor explicitly).
     *
     * @param  array<string, mixed>|null  $userInfo
     */
    private function canViewManagerNotesFromUserInfo(?array $userInfo): bool
    {
        return $userInfo !== null
            && isset($userInfo['role'])
            && in_array($userInfo['role'], self::MANAGER_NOTE_ROLES, true);
    }

    // ---------------------------------------------------------------------
    // Private helpers — note fetching + formatting
    // ---------------------------------------------------------------------

    /**
     * Read raw note rows for a pricing request, optionally including
     * manager-tier notes when the actor is permitted.
     *
     * @return Collection<int, PricingRequestNote>
     */
    private function fetchPricingRequestNotes(string $pricingRequestId, bool $canViewManagerNotes): Collection
    {
        $query = PricingRequestNote::where('prn_pr_id', $pricingRequestId)
            ->where('prn_is_deleted', 0);

        if (! $canViewManagerNotes) {
            $query->whereIn('prn_note_type', [1, 2]);
        }

        return $query->orderBy('prn_created_date', 'ASC')->get();
    }

    /**
     * Project raw note rows into the FE-friendly shape (label + creator name).
     *
     * @param  Collection<int, PricingRequestNote>  $notes
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function formatPricingRequestNotes(Collection $notes): \Illuminate\Support\Collection
    {
        return $notes->map(fn ($note) => [
            'prn_id' => $note->prn_id,
            'prn_text' => $note->prn_text,
            'prn_note_type' => $note->prn_note_type,
            'note_type_label' => self::NOTE_TYPE_LABELS[$note->prn_note_type] ?? 'Other',
            'note_type_color' => self::NOTE_TYPE_COLORS[$note->prn_note_type] ?? '#757575',
            'prn_created_by' => $note->prn_created_by,
            'prn_created_date' => $note->prn_created_date,
            'created_name' => optional($note->prnCreatedBy)->user_nickname
                ?? optional($note->prnCreatedBy)->username
                ?? '',
        ]);
    }

    /**
     * Build the "[Label] text" multi-line string consumed by the FE editor.
     *
     * @param  \Illuminate\Support\Collection<int, array<string, mixed>>  $formattedNotes
     */
    private function buildInitialNotesText(\Illuminate\Support\Collection $formattedNotes): string
    {
        return $formattedNotes->map(fn ($note) => "[{$note['note_type_label']}] {$note['prn_text']}")->join("\n");
    }

    // ---------------------------------------------------------------------
    // Private helpers — pricing-request payload building
    // ---------------------------------------------------------------------

    /**
     * @param  \Illuminate\Support\Collection<int, array<string, mixed>>  $formattedNotes
     * @return array<string, mixed>
     */
    private function buildAutofillPayload(PricingRequest $pricingRequest, ?MasterCustomer $customer, \Illuminate\Support\Collection $formattedNotes, string $initialNotes): array
    {
        return [
            'pr_id' => $pricingRequest->pr_id,
            'pr_no' => $pricingRequest->pr_no,
            'pr_work_name' => $pricingRequest->pr_work_name,
            'pr_pattern' => $pricingRequest->pr_pattern,
            'pr_fabric_type' => $pricingRequest->pr_fabric_type,
            'pr_color' => $pricingRequest->pr_color,
            'pr_sizes' => $pricingRequest->pr_sizes,
            'pr_quantity' => $pricingRequest->pr_quantity,
            'pr_due_date' => $pricingRequest->pr_due_date,
            'pr_silk' => $pricingRequest->pr_silk,
            'pr_dft' => $pricingRequest->pr_dft,
            'pr_embroider' => $pricingRequest->pr_embroider,
            'pr_sub' => $pricingRequest->pr_sub,
            'pr_other_screen' => $pricingRequest->pr_other_screen,
            'pr_image' => $this->prImageUrl($pricingRequest->pr_image),
            'pr_cus_id' => $customer->cus_id ?? null,
            'cus_company' => $customer->cus_company ?? '',
            'cus_tax_id' => $customer->cus_tax_id ?? '',
            'cus_address' => $customer->cus_address ?? '',
            'cus_zip_code' => $customer->cus_zip_code ?? '',
            'cus_tel_1' => $customer->cus_tel_1 ?? '',
            'cus_email' => $customer->cus_email ?? '',
            'cus_firstname' => $customer->cus_firstname ?? '',
            'cus_lastname' => $customer->cus_lastname ?? '',
            'initial_notes' => $initialNotes,
            'notes' => $formattedNotes->toArray(),
        ];
    }

    private function prImageUrl(?string $prImage): ?string
    {
        return $prImage ? url('storage/images/pricing_req/'.$prImage) : null;
    }

    // ---------------------------------------------------------------------
    // Private helpers — completed pricing requests query + transform
    // ---------------------------------------------------------------------

    /**
     * Eager-loaded base query for completed pricing requests, with role-aware
     * note filtering and the customer-management access guard.
     *
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>|null  $userInfo
     */
    private function buildCompletedPricingRequestQuery(bool $canViewManagerNotes, array $filters, ?array $userInfo): Builder
    {
        $query = PricingRequest::with([
            'pricingCustomer' => function ($customerQuery) {
                $customerQuery->select([
                    'cus_id', 'cus_company', 'cus_name', 'cus_depart', 'cus_tax_id',
                    'cus_address', 'cus_zip_code', 'cus_tel_1', 'cus_tel_2',
                    'cus_email', 'cus_firstname', 'cus_lastname',
                ]);
            },
            'pricingStatus' => function ($statusQuery) {
                $statusQuery->select('status_id', 'status_name');
            },
            'pricingNote' => function ($noteQuery) use ($canViewManagerNotes) {
                $noteQuery->where('prn_is_deleted', 0)
                    ->orderBy('prn_created_date', 'ASC');

                if (! $canViewManagerNotes) {
                    $noteQuery->whereIn('prn_note_type', [1, 2]);
                }
            },
            'pricingNote.prnCreatedBy' => function ($userQuery) {
                $userQuery->select('user_uuid', 'username', 'user_nickname');
            },
        ])
            ->withCount('quotationItems')
            ->where('pr_is_deleted', 0);

        // Default to "completed" status filter unless the caller pinned a
        // specific customer (which implies they want all that customer's PRs).
        if (empty($filters['customer_id'])) {
            $query->where('pr_status_id', self::COMPLETED_PRICING_STATUS_ID);
        }

        // Access control: non-admin sees only their own customers.
        if ($userInfo && isset($userInfo['user_id']) && $userInfo['user_id'] != 1) {
            $query->whereHas('pricingCustomer', function ($customerQuery) use ($userInfo) {
                $customerQuery->where('cus_manage_by', $userInfo['user_id']);
            });
        }

        return $query;
    }

    /**
     * @param  Builder<PricingRequest>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyPricingRequestFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $searchTerm = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('pr_no', 'like', $searchTerm)
                    ->orWhere('pr_work_name', 'like', $searchTerm)
                    ->orWhere('pr_pattern', 'like', $searchTerm)
                    ->orWhere('pr_fabric_type', 'like', $searchTerm)
                    ->orWhere('pr_color', 'like', $searchTerm)
                    ->orWhere('pr_sizes', 'like', $searchTerm)
                    ->orWhereHas('pricingCustomer', function ($customerQuery) use ($searchTerm) {
                        $customerQuery->where('cus_company', 'like', $searchTerm)
                            ->orWhere('cus_firstname', 'like', $searchTerm)
                            ->orWhere('cus_lastname', 'like', $searchTerm);
                    });
            });
        }

        if (! empty($filters['customer_id'])) {
            $query->where('pr_cus_id', $filters['customer_id']);
        }

        if (! empty($filters['work_name'])) {
            $query->where('pr_work_name', 'like', '%'.$filters['work_name'].'%');
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('pr_created_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('pr_created_date', '<=', $filters['date_to']);
        }
    }

    /**
     * Build the FE-friendly row payload for a single pricing request from
     * the eager-loaded model.
     *
     * @return array<string, mixed>
     */
    private function transformPricingRequestRow(PricingRequest $pr): array
    {
        $customer = $pr->pricingCustomer;

        /** @var Collection<int, PricingRequestNote> $pricingNotes */
        $pricingNotes = $pr->pricingNote ?? collect();
        $formattedNotes = $this->formatPricingRequestNotes(
            $pricingNotes->where('prn_is_deleted', 0)->values()
        );
        $initialNotes = $this->buildInitialNotesText($formattedNotes);
        $prImageUrl = $this->prImageUrl($pr->pr_image);

        $customerPayload = $this->buildCustomerPayload($customer);

        $autofillPayload = [
            'pr_id' => $pr->pr_id,
            'pr_no' => $pr->pr_no,
            'pr_work_name' => $pr->pr_work_name,
            'pr_pattern' => $pr->pr_pattern,
            'pr_fabric_type' => $pr->pr_fabric_type,
            'pr_color' => $pr->pr_color,
            'pr_sizes' => $pr->pr_sizes,
            'pr_quantity' => $pr->pr_quantity,
            'pr_due_date' => $pr->pr_due_date,
            'pr_silk' => $pr->pr_silk,
            'pr_dft' => $pr->pr_dft,
            'pr_embroider' => $pr->pr_embroider,
            'pr_sub' => $pr->pr_sub,
            'pr_other_screen' => $pr->pr_other_screen,
            'pr_image' => $prImageUrl,
            'pr_cus_id' => $customer->cus_id ?? null,
            'cus_company' => $customer->cus_company ?? '',
            'cus_tax_id' => $customer->cus_tax_id ?? '',
            'cus_address' => $customer->cus_address ?? '',
            'cus_zip_code' => $customer->cus_zip_code ?? '',
            'cus_tel_1' => $customer->cus_tel_1 ?? '',
            'cus_email' => $customer->cus_email ?? '',
            'cus_firstname' => $customer->cus_firstname ?? '',
            'cus_lastname' => $customer->cus_lastname ?? '',
            'initial_notes' => $initialNotes,
            'notes' => $formattedNotes->toArray(),
        ];

        return [
            'pr_id' => $pr->pr_id,
            'pr_cus_id' => $pr->pr_cus_id,
            'pr_mpc_id' => $pr->pr_mpc_id,
            'pr_status_id' => $pr->pr_status_id,
            'pr_no' => $pr->pr_no,
            'pr_work_name' => $pr->pr_work_name,
            'pr_pattern' => $pr->pr_pattern,
            'pr_fabric_type' => $pr->pr_fabric_type,
            'pr_color' => $pr->pr_color,
            'pr_sizes' => $pr->pr_sizes,
            'pr_quantity' => $pr->pr_quantity,
            'pr_due_date' => $pr->pr_due_date,
            'pr_silk' => $pr->pr_silk,
            'pr_dft' => $pr->pr_dft,
            'pr_embroider' => $pr->pr_embroider,
            'pr_sub' => $pr->pr_sub,
            'pr_other_screen' => $pr->pr_other_screen,
            'pr_image' => $pr->pr_image,
            'pr_is_deleted' => $pr->pr_is_deleted,
            'pr_created_date' => $pr->pr_created_date,
            'pr_created_by' => $pr->pr_created_by,
            'pr_updated_date' => $pr->pr_updated_date,
            'pr_updated_by' => $pr->pr_updated_by,
            'quotation_items_count' => $pr->quotation_items_count ?? 0,
            'pricing_customer' => $customerPayload,
            'pricing_status' => [
                'status_id' => $pr->pricingStatus->status_id ?? null,
                'status_name' => $pr->pricingStatus->status_name ?? 'Unknown',
            ],
            'pricing_note' => $formattedNotes->toArray(),
            // Backward-compat aliases.
            'customer' => $customerPayload,
            'autofill' => $autofillPayload,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildCustomerPayload(?MasterCustomer $customer): array
    {
        return [
            'cus_id' => $customer->cus_id ?? null,
            'cus_company' => $customer->cus_company ?? '',
            'cus_name' => $customer->cus_name ?? '',
            'cus_depart' => $customer->cus_depart ?? '',
            'cus_tax_id' => $customer->cus_tax_id ?? '',
            'cus_address' => $customer->cus_address ?? '',
            'cus_zip_code' => $customer->cus_zip_code ?? '',
            'cus_tel_1' => $customer->cus_tel_1 ?? '',
            'cus_tel_2' => $customer->cus_tel_2 ?? '',
            'cus_email' => $customer->cus_email ?? '',
            'cus_firstname' => $customer->cus_firstname ?? '',
            'cus_lastname' => $customer->cus_lastname ?? '',
        ];
    }
}
