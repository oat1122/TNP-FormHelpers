<?php

namespace App\Services\Accounting\DeliveryNote;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DeliveryNoteItem;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\InvoiceItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Delivery-note read + update + reference data (courier list, delivery
 * methods, timeline). All read-only methods preserve the legacy paginator
 * shapes that the FE consumes.
 */
class ManagementService
{
    /**
     * Invoice items eligible to become a delivery note (status filtered to
     * sent/partial_paid/fully_paid/approved). Result transformed to a flat
     * shape the UI uses.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<array<string, mixed>>
     */
    public function getInvoiceItemSources(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = InvoiceItem::with(['invoice' => function ($invoiceQuery) {
            $columns = [
                'id', 'number', 'status',
                'customer_company', 'customer_firstname', 'customer_lastname',
                'customer_tel_1', 'customer_address',
                'company_id', 'customer_id',
                'created_at', 'updated_at',
            ];
            if (Schema::hasColumn('invoices', 'work_name')) {
                $columns[] = 'work_name';
            }
            $invoiceQuery->select($columns);
        }])->whereHas('invoice', function ($invoiceQuery) {
            $invoiceQuery->whereIn('status', ['sent', 'partial_paid', 'fully_paid', 'approved']);
        });

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', $search)
                    ->orWhere('pattern', 'like', $search)
                    ->orWhere('color', 'like', $search)
                    ->orWhere('size', 'like', $search)
                    ->orWhereHas('invoice', function ($invoiceQuery) use ($search) {
                        $invoiceQuery->where('number', 'like', $search)
                            ->orWhere('customer_company', 'like', $search);
                        if (Schema::hasColumn('invoices', 'work_name')) {
                            $invoiceQuery->orWhere('work_name', 'like', $search);
                        }
                    });
            });
        }

        if (! empty($filters['invoice_status'])) {
            $query->whereHas('invoice', function ($invoiceQuery) use ($filters) {
                $invoiceQuery->where('status', $filters['invoice_status']);
            });
        }

        if (! empty($filters['company_id'])) {
            $query->whereHas('invoice', function ($invoiceQuery) use ($filters) {
                $invoiceQuery->where('company_id', $filters['company_id']);
            });
        }

        if (! empty($filters['customer_id'])) {
            $query->whereHas('invoice', function ($invoiceQuery) use ($filters) {
                $invoiceQuery->where('customer_id', $filters['customer_id']);
            });
        }

        if (! empty($filters['invoice_id'])) {
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
                'customer_name' => trim(($invoice?->customer_firstname ?? '').' '.($invoice?->customer_lastname ?? '')),
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
    }

    /**
     * Invoices eligible to become a delivery note (with their items).
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<array<string, mixed>>
     */
    public function getInvoiceSources(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Invoice::with(['items', 'customer'])
            ->whereIn('status', ['sent', 'partial_paid', 'fully_paid', 'approved']);

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', $search)
                    ->orWhere('customer_company', 'like', $search)
                    ->orWhere('customer_firstname', 'like', $search)
                    ->orWhere('customer_lastname', 'like', $search);

                if (Schema::hasColumn('invoices', 'work_name')) {
                    $q->orWhere('work_name', 'like', $search);
                }

                $q->orWhereHas('items', function ($itemQuery) use ($search) {
                    $itemQuery->where('item_name', 'like', $search)
                        ->orWhere('pattern', 'like', $search)
                        ->orWhere('color', 'like', $search);
                });
            });
        }

        if (! empty($filters['status'])) {
            $statuses = is_array($filters['status']) ? $filters['status'] : [$filters['status']];
            $query->whereIn('status', $statuses);
        }

        if (! empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        if (! empty($filters['customer_id'])) {
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

            if (Schema::hasColumn('invoices', 'work_name')) {
                $data['work_name'] = $invoice->work_name;
            }

            if ($invoice->customer) {
                $data['customer'] = [
                    'cus_company' => $invoice->customer->cus_company ?? null,
                    'cus_address' => $invoice->customer->cus_address ?? null,
                ];
            }

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
    }

    /**
     * Update a delivery note (only allowed in 'preparing' status). Optional
     * `items` array replaces all rows.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(string $deliveryNoteId, array $data, ?string $updatedBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNoteId, $data, $updatedBy) {
            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if ($deliveryNote->status !== 'preparing') {
                throw new \Exception('Only delivery notes in preparing status can be updated');
            }

            $oldData = $deliveryNote->toArray();

            $fillData = $data;
            if (array_key_exists('customer_snapshot', $fillData) && is_array($fillData['customer_snapshot'])) {
                $fillData['customer_snapshot'] = json_encode($fillData['customer_snapshot']);
            }

            $deliveryNote->fill(array_filter($fillData, fn ($value) => $value !== null));
            $deliveryNote->save();

            $changes = array_diff_assoc($deliveryNote->toArray(), $oldData);
            if (! empty($changes)) {
                DocumentHistory::logAction(
                    'delivery_note',
                    $deliveryNote->id,
                    'updated',
                    $updatedBy,
                    'แก้ไขใบส่งของ: '.implode(', ', array_keys($changes))
                );
            }

            // Replace items if provided.
            if (! empty($data['items']) && is_array($data['items'])) {
                DeliveryNoteItem::where('delivery_note_id', $deliveryNote->id)->delete();
                $seq = 1;
                foreach ($data['items'] as $item) {
                    $dni = new DeliveryNoteItem;
                    $dni->delivery_note_id = $deliveryNote->id;
                    $dni->invoice_id = $item['invoice_id'] ?? ($deliveryNote->invoice_id ?? null);
                    $dni->invoice_item_id = $item['invoice_item_id'] ?? null;
                    $dni->sequence_order = $item['sequence_order'] ?? $seq++;
                    $dni->item_name = $item['item_name'] ?? ($item['work_name'] ?? 'รายการงาน');
                    $dni->item_description = $item['item_description'] ?? null;
                    $dni->pattern = $item['pattern'] ?? null;
                    $dni->fabric_type = $item['fabric_type'] ?? ($item['fabric'] ?? null);
                    $dni->color = $item['color'] ?? null;
                    $dni->size = $item['size'] ?? null;
                    $dni->delivered_quantity = (int) ($item['delivered_quantity'] ?? $item['quantity'] ?? 0);
                    $dni->unit = $item['unit'] ?? 'ชิ้น';
                    if (! empty($item['item_snapshot'])) {
                        $dni->item_snapshot = is_array($item['item_snapshot']) ? json_encode($item['item_snapshot']) : $item['item_snapshot'];
                    }
                    $dni->status = 'ready';
                    $dni->created_by = $updatedBy;
                    $dni->save();
                }

                DocumentHistory::logAction(
                    'delivery_note',
                    $deliveryNote->id,
                    'items_replaced',
                    $updatedBy,
                    'ปรับปรุงรายการงาน ('.count($data['items']).' รายการ)'
                );
            }

            return $deliveryNote->load(['receipt', 'customer', 'creator', 'items', 'manager']);
        });
    }

    /**
     * Paginated list of delivery notes with filters.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<DeliveryNote>
     */
    public function getList(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = DeliveryNote::with(['receipt', 'invoice', 'invoiceItem', 'customer', 'creator', 'items']);

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
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

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['delivery_method'])) {
            $query->where('delivery_method', $filters['delivery_method']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['invoice_id'])) {
            $query->where('invoice_id', $filters['invoice_id']);
        }

        if (! empty($filters['invoice_item_id'])) {
            $query->where('invoice_item_id', $filters['invoice_item_id']);
        }

        if (! empty($filters['courier_company'])) {
            $query->where('courier_company', $filters['courier_company']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('delivery_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('delivery_date', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Reference list of supported courier companies (static seed data).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getCourierCompanies(): array
    {
        return [
            [
                'id' => 'kerry',
                'name' => 'Kerry Express',
                'services' => ['standard', 'express'],
                'tracking_url' => 'https://th.kerryexpress.com/en/track/?track=',
            ],
            [
                'id' => 'thailand_post',
                'name' => 'ไปรษณีย์ไทย',
                'services' => ['ems', 'registered'],
                'tracking_url' => 'https://track.thailandpost.co.th/?trackNumber=',
            ],
            [
                'id' => 'flash',
                'name' => 'Flash Express',
                'services' => ['standard', 'same_day'],
                'tracking_url' => 'https://www.flashexpress.co.th/tracking/?se=',
            ],
            [
                'id' => 'j_t',
                'name' => 'J&T Express',
                'services' => ['standard', 'express'],
                'tracking_url' => 'https://www.jtexpress.co.th/index/query/gzquery.html?bills=',
            ],
        ];
    }

    /**
     * Reference list of delivery methods (static seed data).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getDeliveryMethods(): array
    {
        return [
            [
                'value' => 'self_delivery',
                'label' => 'ส่งเอง',
                'description' => 'พนักงานบริษัทส่งเอง',
                'requires_courier' => false,
                'requires_tracking' => false,
            ],
            [
                'value' => 'courier',
                'label' => 'บริษัทขนส่ง',
                'description' => 'ใช้บริการบริษัทขนส่ง',
                'requires_courier' => true,
                'requires_tracking' => true,
            ],
            [
                'value' => 'customer_pickup',
                'label' => 'ลูกค้ามารับเอง',
                'description' => 'ลูกค้ามารับที่บริษัท',
                'requires_courier' => false,
                'requires_tracking' => false,
            ],
        ];
    }

    /**
     * Build delivery timeline from DocumentHistory entries.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getDeliveryTimeline(string $deliveryNoteId): array
    {
        $deliveryNote = DeliveryNote::with(['documentHistory' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }])->findOrFail($deliveryNoteId);

        $timeline = [];

        foreach ($deliveryNote->documentHistory as $history) {
            $timeline[] = [
                'id' => $history->id,
                'timestamp' => $history->created_at,
                'status' => $history->new_status ?? $history->action,
                'description' => $history->notes,
                'notes' => $history->notes,
                'user' => $history->user->user_nickname ?? 'System',
            ];
        }

        return $timeline;
    }
}
