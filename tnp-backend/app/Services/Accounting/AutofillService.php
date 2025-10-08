<?php

namespace App\Services\Accounting;

use App\Models\MasterCustomer;
use App\Models\MasterStatus;
use App\Models\PricingRequest;
use App\Models\PricingRequestNote;
use App\Models\User;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AutofillService
{
    /**
     * ดึงข้อมูลสำหรับ Auto-fill จาก Pricing Request
     * @return array<string, mixed>
     */
    public function getAutofillDataFromPricingRequest(string $pricingRequestId): array
    {
        try {
            // ดึงข้อมูล Pricing Request พร้อมลูกค้า
            $pricingRequest = PricingRequest::with(['pricingCustomer'])
                ->where('pr_id', $pricingRequestId)
                ->where('pr_is_deleted', 0)
                ->first();

            if (!$pricingRequest) {
                throw new \Exception('Pricing Request not found');
            }

            // ดึงข้อมูลลูกค้า
            $customer = $pricingRequest->pricingCustomer;
            
            // ดึง Notes โดยตรวจสอบสิทธิ์การเข้าถึง manager notes
            $user = auth()->user();
            $allowedRoles = ['production', 'manager', 'admin'];
            $canViewManagerNotes = $user && in_array($user->role, $allowedRoles);
            
            $noteQuery = PricingRequestNote::where('prn_pr_id', $pricingRequestId)
                ->where('prn_is_deleted', 0);
                
            // จำกัดการเข้าถึง manager notes (type 3) ตามสิทธิ์
            if (!$canViewManagerNotes) {
                $noteQuery->whereIn('prn_note_type', [1, 2]); // เฉพาะ sale และ price
            }
            
            $notes = $noteQuery->orderBy('prn_created_date', 'ASC')->get();

            // จัดรูปแบบ Notes
            $formattedNotes = $notes->map(function ($note) {
                $noteTypeLabels = [
                    1 => 'Sale',
                    2 => 'Price', 
                    3 => 'Manager'
                ];
                
                return [
                    'prn_id' => $note->prn_id,
                    'prn_text' => $note->prn_text,
                    'prn_note_type' => $note->prn_note_type,
                    'note_type_label' => $noteTypeLabels[$note->prn_note_type] ?? 'Other',
                    'prn_created_by' => $note->prn_created_by,
                    'prn_created_date' => $note->prn_created_date,
                    'created_name' => $note->prnCreatedBy->user_nickname ?? ''
                ];
            });

            // สร้าง initial notes text
            $initialNotes = $formattedNotes->map(function ($note) {
                return "[{$note['note_type_label']}] {$note['prn_text']}";
            })->join("\n");

            // สร้าง DTO structure ตาม technical specification
            return [
                // ข้อมูลจาก Pricing Request  
                'pr_id' => $pricingRequest->pr_id,
                'pr_no' => $pricingRequest->pr_no, // 🔢 เพิ่ม pr_no สำหรับการแสดงผล
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
                'pr_image' => $pricingRequest->pr_image ? url('storage/images/pricing_req/' . $pricingRequest->pr_image) : null,

                // ข้อมูลลูกค้า
                'pr_cus_id' => $customer->cus_id ?? null,
                'cus_company' => $customer->cus_company ?? '',
                'cus_tax_id' => $customer->cus_tax_id ?? '',
                'cus_address' => $customer->cus_address ?? '',
                'cus_zip_code' => $customer->cus_zip_code ?? '',
                'cus_tel_1' => $customer->cus_tel_1 ?? '',
                'cus_email' => $customer->cus_email ?? '',
                'cus_firstname' => $customer->cus_firstname ?? '',
                'cus_lastname' => $customer->cus_lastname ?? '',

                // Notes
                'initial_notes' => $initialNotes,
                'notes' => $formattedNotes->toArray()
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getAutofillDataFromPricingRequest error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงข้อมูลลูกค้าสำหรับ Auto-fill
     * @param array<string, mixed>|null $userInfo
     * @return array<string, mixed>
     */
    public function getCustomerAutofillData(string $customerId, ?array $userInfo = null): array
    {
        try {
            $query = MasterCustomer::where('cus_id', $customerId)
                ->where('cus_is_use', true);

            // 🔐 Access Control: ตรวจสอบสิทธิ์การเข้าถึงลูกค้า
            if ($userInfo && isset($userInfo['user_id']) && $userInfo['user_id'] != 1) {
                // ถ้าไม่ใช่ admin (user_id !== 1) ให้ตรวจสอบว่าเป็นลูกค้าที่ตัวเองดูแลหรือไม่
                $query->where('cus_manage_by', $userInfo['user_id']);
            }

            $customer = $query->first();

            if (!$customer) {
                throw new \Exception('Customer not found or access denied');
            }

            // Get recent pricing requests for this customer
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
                'recent_pricing_requests' => $recentPricingRequests->map(function ($pr) {
                    return [
                        'pr_id' => $pr->pr_id,
                        'pr_no' => $pr->pr_no, //  เพิ่ม pr_no สำหรับการแสดงผล
                        'pr_work_name' => $pr->pr_work_name,
                        'pr_created_date' => $pr->pr_created_date
                    ];
                })->toArray()
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCustomerAutofillData error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cascade Auto-fill สำหรับ Invoice จาก Quotation
     * 
     * @param string $quotationId
     * @return array<string, mixed>
     */
    public function getCascadeAutofillForInvoice(string $quotationId): array
    {
        try {
            $quotation = Quotation::findOrFail($quotationId);

            return [
                // ข้อมูลลูกค้า
                'customer_id' => $quotation->customer_id,
                'customer_company' => $quotation->customer_company,
                'customer_tax_id' => $quotation->customer_tax_id,
                'customer_address' => $quotation->customer_address,
                'customer_zip_code' => $quotation->customer_zip_code,
                'customer_tel_1' => $quotation->customer_tel_1,
                'customer_email' => $quotation->customer_email,
                'customer_firstname' => $quotation->customer_firstname,
                'customer_lastname' => $quotation->customer_lastname,

                // ข้อมูลงาน
                'work_name' => $quotation->work_name,
                'fabric_type' => $quotation->fabric_type,
                'pattern' => $quotation->pattern,
                'color' => $quotation->color,
                'sizes' => $quotation->sizes,
                'quantity' => $quotation->quantity,

                // ข้อมูลการเงิน
                'quotation_id' => $quotation->id,
                'subtotal' => $quotation->subtotal,
                'tax_amount' => $quotation->tax_amount,
                'total_amount' => $quotation->total_amount,
                'due_date' => $quotation->due_date,
                'payment_terms' => $quotation->payment_terms
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCascadeAutofillForInvoice error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cascade Auto-fill สำหรับ Receipt จาก Invoice
     * 
     * @param string $invoiceId
     * @return array<string, mixed>
     */
    public function getCascadeAutofillForReceipt(string $invoiceId): array
    {
        try {
            $invoice = Invoice::findOrFail($invoiceId);

            return [
                // ข้อมูลลูกค้า
                'customer_id' => $invoice->customer_id,
                'customer_company' => $invoice->customer_company,
                'customer_tax_id' => $invoice->customer_tax_id,
                'customer_address' => $invoice->customer_address,
                'customer_zip_code' => $invoice->customer_zip_code,
                'customer_tel_1' => $invoice->customer_tel_1,
                'customer_email' => $invoice->customer_email,
                'customer_firstname' => $invoice->customer_firstname,
                'customer_lastname' => $invoice->customer_lastname,

                // ข้อมูลงาน
                'work_name' => $invoice->work_name,
                'quantity' => $invoice->quantity,

                // ข้อมูลการเงิน
                'invoice_id' => $invoice->id,
                'subtotal' => $invoice->subtotal,
                'tax_amount' => $invoice->tax_amount,
                'total_amount' => $invoice->total_amount,
                'remaining_amount' => $invoice->remaining_amount,
                'payment_method' => $invoice->payment_method
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCascadeAutofillForReceipt error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cascade Auto-fill สำหรับ Delivery Note จาก Receipt
     * 
     * @param string $receiptId
     * @return array<string, mixed>
     */
    public function getCascadeAutofillForDeliveryNote(string $receiptId): array
    {
        try {
            $receipt = Receipt::findOrFail($receiptId);

            return [
                // ข้อมูลลูกค้า
                'customer_id' => $receipt->customer_id,
                'customer_company' => $receipt->customer_company,
                'customer_address' => $receipt->customer_address,
                'customer_zip_code' => $receipt->customer_zip_code,
                'customer_tel_1' => $receipt->customer_tel_1,
                'customer_firstname' => $receipt->customer_firstname,
                'customer_lastname' => $receipt->customer_lastname,

                // ข้อมูลงาน
                'work_name' => $receipt->work_name,
                'quantity' => $receipt->quantity,

                // ข้อมูลการจัดส่ง
                'receipt_id' => $receipt->id,
                'delivery_address' => $receipt->customer_address // Default delivery address
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCascadeAutofillForDeliveryNote error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ค้นหาลูกค้า (สำหรับ Auto-complete) พร้อมการกรองตาม cus_manage_by
     * 
     * @param string $searchTerm
     * @param int $limit
     * @param array<string, mixed>|null $userInfo
     * @return Collection<int, MasterCustomer>
     */
    public function searchCustomers(string $searchTerm, int $limit = 10, ?array $userInfo = null): Collection
    {
        try {
            $query = MasterCustomer::where('cus_is_use', true);

            //  Access Control: แบ่งสิทธิ์การมองเห็นตาม cus_manage_by
            if ($userInfo && isset($userInfo['user_id']) && $userInfo['user_id'] != 1) {
                // ถ้าไม่ใช่ admin (user_id !== 1) ให้แสดงเฉพาะลูกค้าที่ตัวเองดูแล
                $query->where('cus_manage_by', $userInfo['user_id']);
            }

            $query->where(function ($q) use ($searchTerm) {
                $q->where('cus_company', 'like', '%' . $searchTerm . '%')
                  ->orWhere('cus_tax_id', 'like', '%' . $searchTerm . '%')
                  ->orWhere('cus_firstname', 'like', '%' . $searchTerm . '%')
                  ->orWhere('cus_lastname', 'like', '%' . $searchTerm . '%')
                  ->orWhereRaw("CONCAT(cus_firstname, ' ', cus_lastname) LIKE ?", ['%' . $searchTerm . '%']);
            });

            return $query->select([
                    'cus_id',
                    'cus_company',
                    'cus_tax_id',
                    'cus_firstname',
                    'cus_lastname',
                    'cus_tel_1',
                    'cus_email'
                ])
                ->limit($limit)
                ->get()
                ->map(function ($customer) {
                    return [
                        'cus_id' => $customer->cus_id,
                        'cus_company' => $customer->cus_company,
                        'cus_tax_id' => $customer->cus_tax_id,
                        'cus_firstname' => $customer->cus_firstname,
                        'cus_lastname' => $customer->cus_lastname,
                        'cus_fullname' => trim($customer->cus_firstname . ' ' . $customer->cus_lastname),
                        'cus_tel_1' => $customer->cus_tel_1,
                        'cus_email' => $customer->cus_email
                    ];
                });

        } catch (\Exception $e) {
            Log::error('AutofillService::searchCustomers error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการ Pricing Request ที่เสร็จแล้ว (สำหรับ Step 0: Pricing Integration)
     * 
     * @param array<string, mixed> $filters
     * @param int $perPage
     * @param int $page
     * @param array<string, mixed>|null $userInfo
     * @return LengthAwarePaginator<PricingRequest>
     */
    public function getCompletedPricingRequests(array $filters = [], int $perPage = 20, int $page = 1, ?array $userInfo = null): LengthAwarePaginator
    {
        try {
            $allowedManagerRoles = ['production', 'manager', 'admin'];
            $canViewManagerNotes = $userInfo && isset($userInfo['role']) && in_array($userInfo['role'], $allowedManagerRoles);

            $query = PricingRequest::with([
                    'pricingCustomer' => function ($customerQuery) {
                        $customerQuery->select([
                            'cus_id',
                            'cus_company',
                            'cus_name',
                            'cus_depart',
                            'cus_tax_id',
                            'cus_address',
                            'cus_zip_code',
                            'cus_tel_1',
                            'cus_tel_2',
                            'cus_email',
                            'cus_firstname',
                            'cus_lastname'
                        ]);
                    },
                    'pricingStatus' => function ($statusQuery) {
                        $statusQuery->select('status_id', 'status_name');
                    },
                    'pricingNote' => function ($noteQuery) use ($canViewManagerNotes) {
                        $noteQuery->where('prn_is_deleted', 0)
                            ->orderBy('prn_created_date', 'ASC');

                        if (!$canViewManagerNotes) {
                            $noteQuery->whereIn('prn_note_type', [1, 2]);
                        }
                    },
                    'pricingNote.prnCreatedBy' => function ($userQuery) {
                        $userQuery->select('user_uuid', 'username', 'user_nickname');
                    }
                ])
                ->withCount('quotationItems')
                ->where('pr_is_deleted', 0);

            if (empty($filters['customer_id'])) {
                $query->where('pr_status_id', '20db8be1-092b-11f0-b223-38ca84abdf0a');
            }

            if ($userInfo && isset($userInfo['user_id']) && $userInfo['user_id'] != 1) {
                $query->whereHas('pricingCustomer', function ($customerQuery) use ($userInfo) {
                    $customerQuery->where('cus_manage_by', $userInfo['user_id']);
                });
            }

            if (!empty($filters['search'])) {
                $searchTerm = '%' . $filters['search'] . '%';
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

            if (!empty($filters['customer_id'])) {
                $query->where('pr_cus_id', $filters['customer_id']);
            }

            if (!empty($filters['work_name'])) {
                $query->where('pr_work_name', 'like', '%' . $filters['work_name'] . '%');
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('pr_created_date', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('pr_created_date', '<=', $filters['date_to']);
            }

            $query->orderBy('pr_updated_date', 'DESC');

            $results = $query->paginate($perPage, ['*'], 'page', $page);

            $noteTypeLabels = [
                1 => 'Sale',
                2 => 'Price',
                3 => 'Manager'
            ];

            $noteTypeColors = [
                1 => '#2196F3',
                2 => '#4CAF50',
                3 => '#FF9800'
            ];

            $transformedData = $results->getCollection()->map(function (PricingRequest $pr) use ($noteTypeLabels, $noteTypeColors) {
                $customer = $pr->pricingCustomer;

                /** @var \Illuminate\Database\Eloquent\Collection<int, PricingRequestNote> $pricingNotes */
                $pricingNotes = $pr->pricingNote ?? collect();
                $formattedNotes = $pricingNotes
                    ->where('prn_is_deleted', 0)
                    ->values()
                    ->map(function (PricingRequestNote $note) use ($noteTypeLabels, $noteTypeColors) {
                        return [
                            'prn_id' => $note->prn_id,
                            'prn_text' => $note->prn_text,
                            'prn_note_type' => $note->prn_note_type,
                            'note_type_label' => $noteTypeLabels[$note->prn_note_type] ?? 'Other',
                            'note_type_color' => $noteTypeColors[$note->prn_note_type] ?? '#757575',
                            'prn_created_by' => $note->prn_created_by,
                            'prn_created_date' => $note->prn_created_date,
                            'created_name' => optional($note->prnCreatedBy)->user_nickname
                                ?? optional($note->prnCreatedBy)->username
                                ?? ''
                        ];
                    });

                $initialNotes = $formattedNotes->map(function ($note) {
                    return "[{$note['note_type_label']}] {$note['prn_text']}";
                })->join("\n");

                $prImageUrl = $pr->pr_image ? url('storage/images/pricing_req/' . $pr->pr_image) : null;

                $customerPayload = [
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
                    'cus_lastname' => $customer->cus_lastname ?? ''
                ];

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
                    'notes' => $formattedNotes->toArray()
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
                        'status_name' => $pr->pricingStatus->status_name ?? 'Unknown'
                    ],
                    'pricing_note' => $formattedNotes->toArray(),
                    // เก็บ customer และ autofill ไว้สำหรับ backward compatibility
                    'customer' => $customerPayload,
                    'autofill' => $autofillPayload
                ];
            });

            return $results;

        } catch (\Exception $e) {
            Log::error('AutofillService::getCompletedPricingRequests error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงข้อมูล Notes ของ Pricing Request
     * 
     * @param string $pricingRequestId
     * @return array<string, mixed>
     */
    public function getPricingRequestNotes(string $pricingRequestId): array
    {
        try {
            // ตรวจสอบ Pricing Request ที่มีอยู่
            $pricingRequest = PricingRequest::where('pr_id', $pricingRequestId)
                ->where('pr_is_deleted', 0)
                ->first();

            if (!$pricingRequest) {
                throw new \Exception('Pricing Request not found');
            }

            // ดึง Notes ตามเงื่อนไขที่กำหนด
            // ตรวจสอบสิทธิ์การเข้าถึง manager notes (type 3)
            $allowedRoles = ['production', 'manager', 'admin'];
            $user = auth()->user();
            $canViewManagerNotes = $user && in_array($user->role, $allowedRoles);
            
            $noteTypes = $canViewManagerNotes ? [1, 2, 3] : [1, 2]; // sale, price, และ manager (ถ้ามีสิทธิ์)
            
            $notes = PricingRequestNote::with('prnCreatedBy')
                ->where('prn_pr_id', $pricingRequestId)
                ->whereIn('prn_note_type', $noteTypes)
                ->where('prn_is_deleted', 0)
                ->orderBy('prn_created_date', 'ASC')
                ->get();

            // จัดรูปแบบข้อมูล
            $formattedNotes = $notes->map(function ($note) {
                $noteTypeLabels = [
                    1 => 'Sale',
                    2 => 'Price',
                    3 => 'Manager'
                ];

                $noteTypeColors = [
                    1 => '#2196F3', // Blue for Sale
                    2 => '#4CAF50', // Green for Price
                    3 => '#FF9800'  // Orange for Manager
                ];

                return [
                    'prn_id' => $note->prn_id,
                    'prn_pr_id' => $note->prn_pr_id,
                    'prn_text' => $note->prn_text,
                    'prn_note_type' => $note->prn_note_type,
                    'prn_note_type_label' => $noteTypeLabels[$note->prn_note_type] ?? 'Unknown',
                    'prn_note_type_color' => $noteTypeColors[$note->prn_note_type] ?? '#757575',
                    'prn_created_date' => $note->prn_created_date,
                    'prn_created_by' => $note->prn_created_by,
                    'created_by_name' => $note->prnCreatedBy->user_nickname ?? $note->prnCreatedBy->user_firstname ?? 'Unknown User',
                    'formatted_date' => $note->prn_created_date ? $note->prn_created_date->format('d/m/Y H:i') : ''
                ];
            });

            // จัดกลุ่มตาม note type
            $groupedNotes = [
                'sale_notes' => $formattedNotes->where('prn_note_type', 1)->values(),
                'price_notes' => $formattedNotes->where('prn_note_type', 2)->values(),
                'manager_notes' => $canViewManagerNotes ? $formattedNotes->where('prn_note_type', 3)->values() : [],
                'all_notes' => $formattedNotes->values(),
                'summary' => [
                    'total_notes' => $formattedNotes->count(),
                    'sale_count' => $formattedNotes->where('prn_note_type', 1)->count(),
                    'price_count' => $formattedNotes->where('prn_note_type', 2)->count(),
                    'manager_count' => $canViewManagerNotes ? $formattedNotes->where('prn_note_type', 3)->count() : 0
                ]
            ];

            return $groupedNotes;

        } catch (\Exception $e) {
            Log::error('AutofillService::getPricingRequestNotes error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * มาร์ค Pricing Request ว่าใช้แล้วสำหรับสร้าง Quotation
     * 
     * @param string $pricingRequestId
     * @param string|null $userId
     * @return array<string, mixed>
     */
    public function markPricingRequestAsUsed(string $pricingRequestId, ?string $userId = null): array
    {
        try {
            $pricingRequest = PricingRequest::where('pr_id', $pricingRequestId)
                ->where('pr_is_deleted', 0)
                ->first();

            if (!$pricingRequest) {
                throw new \Exception('Pricing Request not found');
            }

            // อัพเดทสถานะว่าถูกใช้แล้ว (สามารถเพิ่มฟิลด์ pr_used_for_quotation หรือใช้ status แทน)
            // สำหรับตอนนี้เพิ่ม comment ใน pricing request note
            PricingRequestNote::create([
                'prn_id' => \Illuminate\Support\Str::uuid(),
                'prn_pr_id' => $pricingRequestId,
                'prn_text' => 'ใช้สำหรับสร้างใบเสนอราคาแล้ว',
                'prn_note_type' => 3, // manager note
                'prn_is_deleted' => 0,
                'prn_created_date' => now(),
                'prn_created_by' => $userId,
                'prn_updated_date' => now(),
                'prn_updated_by' => $userId
            ]);

            return [
                'pr_id' => $pricingRequestId,
                'marked_at' => now()->format('Y-m-d\TH:i:s\Z'),
                'marked_by' => $userId
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::markPricingRequestAsUsed error: ' . $e->getMessage());
            throw $e;
        }
    }
}

