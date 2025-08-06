<?php

namespace App\Services\Accounting;

use App\Models\MasterCustomer;
use App\Models\PricingRequest;
use App\Models\PricingRequestNote;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutofillService
{
    /**
     * ดึงข้อมูลสำหรับ Auto-fill จาก Pricing Request
     */
    public function getAutofillDataFromPricingRequest($pricingRequestId)
    {
        try {
            // ดึงข้อมูล Pricing Request พร้อมลูกค้า
            $pricingRequest = PricingRequest::with(['pricingCustomer', 'pricingNote.prnCreatedBy'])
                ->where('pr_id', $pricingRequestId)
                ->where('pr_is_deleted', 0)
                ->first();

            if (!$pricingRequest) {
                throw new \Exception('Pricing Request not found');
            }

            // ดึงข้อมูลลูกค้า
            $customer = $pricingRequest->pricingCustomer;
            
            // ดึง Notes
            $notes = $pricingRequest->pricingNote()
                ->where('prn_is_deleted', 0)
                ->orderBy('prn_created_date', 'ASC')
                ->get();

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
     */
    public function getCustomerAutofillData($customerId)
    {
        try {
            $customer = MasterCustomer::with(['pricingRequests' => function ($query) {
                    $query->where('pr_is_deleted', 0)
                          ->orderBy('pr_created_date', 'DESC')
                          ->limit(5);
                }])
                ->where('cus_id', $customerId)
                ->where('cus_is_use', true)
                ->first();

            if (!$customer) {
                throw new \Exception('Customer not found');
            }

            return [
                'cus_id' => $customer->cus_id,
                'cus_company' => $customer->cus_company,
                'cus_tax_id' => $customer->cus_tax_id,
                'cus_address' => $customer->cus_address,
                'cus_zip_code' => $customer->cus_zip_code,
                'cus_tel_1' => $customer->cus_tel_1,
                'cus_tel_2' => $customer->cus_tel_2,
                'cus_email' => $customer->cus_email,
                'cus_firstname' => $customer->cus_firstname,
                'cus_lastname' => $customer->cus_lastname,
                'cus_depart' => $customer->cus_depart,
                'recent_pricing_requests' => $customer->pricingRequests->map(function ($pr) {
                    return [
                        'pr_id' => $pr->pr_id,
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
     */
    public function getCascadeAutofillForInvoice($quotationId)
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
     */
    public function getCascadeAutofillForReceipt($invoiceId)
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
     */
    public function getCascadeAutofillForDeliveryNote($receiptId)
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
     * ค้นหาลูกค้า (สำหรับ Auto-complete)
     */
    public function searchCustomers($searchTerm, $limit = 10)
    {
        try {
            return MasterCustomer::where('cus_is_use', true)
                ->where(function ($query) use ($searchTerm) {
                    $query->where('cus_company', 'like', '%' . $searchTerm . '%')
                          ->orWhere('cus_tax_id', 'like', '%' . $searchTerm . '%')
                          ->orWhere('cus_firstname', 'like', '%' . $searchTerm . '%')
                          ->orWhere('cus_lastname', 'like', '%' . $searchTerm . '%')
                          ->orWhereRaw("CONCAT(cus_firstname, ' ', cus_lastname) LIKE ?", ['%' . $searchTerm . '%']);
                })
                ->select([
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
     */
    public function getCompletedPricingRequests($filters = [], $perPage = 20)
    {
        try {
            $query = PricingRequest::with(['pricingCustomer', 'pricingStatus'])
                ->where('pr_is_deleted', 0);

            // เพิ่มเงื่อนไขสถานะ "ได้ราคาแล้ว" เฉพาะเมื่อไม่มี customer_id filter
            if (empty($filters['customer_id'])) {
                $query->where('pr_status_id', '20db8be1-092b-11f0-b223-38ca84abdf0a');
            }

            // Apply filters
            if (!empty($filters['search'])) {
                $searchTerm = '%' . $filters['search'] . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('pr_work_name', 'like', $searchTerm)
                      ->orWhere('pr_pattern', 'like', $searchTerm)
                      ->orWhere('pr_fabric_type', 'like', $searchTerm)
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

            // Order by latest
            $query->orderBy('pr_updated_date', 'DESC');

            // Paginate
            $results = $query->paginate($perPage);

            // Transform data ตาม DTO structure
            $transformedData = $results->getCollection()->map(function ($pr) {
                return [
                    'pr_id' => $pr->pr_id,
                    'pr_work_name' => $pr->pr_work_name,
                    'pr_cus_id' => $pr->pr_cus_id,
                    'pr_pattern' => $pr->pr_pattern,
                    'pr_fabric_type' => $pr->pr_fabric_type,
                    'pr_color' => $pr->pr_color,
                    'pr_sizes' => $pr->pr_sizes,
                    'pr_quantity' => $pr->pr_quantity,
                    'pr_due_date' => $pr->pr_due_date ? $pr->pr_due_date->format('Y-m-d') : null,
                    'pr_status' => $pr->pricingStatus->status_name ?? 'Unknown',
                    'pr_completed_at' => $pr->pr_updated_date ? $pr->pr_updated_date->format('Y-m-d\TH:i:s\Z') : null,
                    'customer' => [
                        'cus_id' => $pr->pricingCustomer->cus_id ?? null,
                        'cus_company' => $pr->pricingCustomer->cus_company ?? '',
                        'cus_tax_id' => $pr->pricingCustomer->cus_tax_id ?? '',
                        'cus_address' => $pr->pricingCustomer->cus_address ?? '',
                        'cus_zip_code' => $pr->pricingCustomer->cus_zip_code ?? '',
                        'cus_tel_1' => $pr->pricingCustomer->cus_tel_1 ?? '',
                        'cus_email' => $pr->pricingCustomer->cus_email ?? '',
                        'cus_firstname' => $pr->pricingCustomer->cus_firstname ?? '',
                        'cus_lastname' => $pr->pricingCustomer->cus_lastname ?? ''
                    ]
                ];
            });

            return [
                'data' => $transformedData,
                'pagination' => [
                    'total' => $results->total(),
                    'per_page' => $results->perPage(),
                    'current_page' => $results->currentPage(),
                    'last_page' => $results->lastPage(),
                    'from' => $results->firstItem(),
                    'to' => $results->lastItem()
                ]
            ];

        } catch (\Exception $e) {
            Log::error('AutofillService::getCompletedPricingRequests error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * มาร์ค Pricing Request ว่าใช้แล้วสำหรับสร้าง Quotation
     */
    public function markPricingRequestAsUsed($pricingRequestId, $userId = null)
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
