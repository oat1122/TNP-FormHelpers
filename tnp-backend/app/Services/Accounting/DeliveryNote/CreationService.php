<?php

namespace App\Services\Accounting\DeliveryNote;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DeliveryNoteItem;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Company;
use App\Models\MasterCustomer;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Delivery-note creation flows: one-click `createFromReceipt` + manual
 * `create` (with optional items array from FE).
 */
class CreationService
{
    public function __construct(
        private AutofillService $autofillService,
    ) {}

    /**
     * One-click conversion from an approved Receipt to a Delivery Note.
     *
     * @param  array<string, mixed>  $deliveryData
     */
    public function createFromReceipt(string $receiptId, array $deliveryData, ?string $createdBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($receiptId, $deliveryData, $createdBy) {
            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'approved') {
                throw new \Exception('Receipt must be approved before creating delivery note');
            }

            $existingDeliveryNote = DeliveryNote::where('receipt_id', $receiptId)->first();
            if ($existingDeliveryNote) {
                throw new \Exception('Delivery note already exists for this receipt');
            }

            $autofillData = $this->autofillService->getCascadeAutofillForDeliveryNote($receiptId);

            $deliveryNote = new DeliveryNote;
            $deliveryNote->id = (string) Str::uuid();
            $deliveryNote->company_id = $receipt->company_id
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);
            $deliveryNote->number = DeliveryNote::generateDeliveryNoteNumber($deliveryNote->company_id);
            $deliveryNote->invoice_id = $deliveryData['invoice_id'] ?? null;
            $deliveryNote->invoice_item_id = $deliveryData['invoice_item_id'] ?? null;
            $deliveryNote->receipt_id = $receipt->id;

            // Customer auto-fill
            $deliveryNote->customer_id = $autofillData['customer_id'];
            $deliveryNote->customer_company = $autofillData['customer_company'];
            $deliveryNote->customer_address = $autofillData['customer_address'];
            $deliveryNote->customer_zip_code = $autofillData['customer_zip_code'];
            $deliveryNote->customer_tel_1 = $autofillData['customer_tel_1'];
            $deliveryNote->customer_firstname = $autofillData['customer_firstname'];
            $deliveryNote->customer_lastname = $autofillData['customer_lastname'];
            $deliveryNote->work_name = $autofillData['work_name'];
            $deliveryNote->quantity = $autofillData['quantity'] ?? '1 ชิ้น';

            // Delivery info from input
            $deliveryNote->delivery_method = $deliveryData['delivery_method'] ?? 'courier';
            $deliveryNote->courier_company = $deliveryData['courier_company'] ?? null;
            $deliveryNote->delivery_address = $deliveryData['delivery_address'] ?? $autofillData['customer_address'];
            $deliveryNote->recipient_name = $deliveryData['recipient_name'] ?? $autofillData['customer_firstname'].' '.$autofillData['customer_lastname'];
            $deliveryNote->recipient_phone = $deliveryData['recipient_phone'] ?? $autofillData['customer_tel_1'];
            $deliveryNote->delivery_date = $deliveryData['delivery_date'] ?? now()->addDays(1)->format('Y-m-d');
            $deliveryNote->delivery_notes = $deliveryData['delivery_notes'] ?? null;
            $deliveryNote->notes = $deliveryData['notes'] ?? null;

            $deliveryNote->status = 'preparing';
            $deliveryNote->created_by = $createdBy;

            $deliveryNote->save();

            // If FE chose to use master customer data, clear per-DN overrides.
            if (! empty($deliveryData['customer_data_source']) && $deliveryData['customer_data_source'] === 'master') {
                $overrideFields = [
                    'customer_company',
                    'customer_address',
                    'customer_zip_code',
                    'customer_tel_1',
                    'customer_firstname',
                    'customer_lastname',
                    'customer_tax_id',
                ];
                $needSave = false;
                foreach ($overrideFields as $field) {
                    if ($deliveryNote->{$field} !== null) {
                        $deliveryNote->{$field} = null;
                        $needSave = true;
                    }
                }
                if ($needSave) {
                    $deliveryNote->save();
                    DocumentHistory::logAction(
                        'delivery_note',
                        $deliveryNote->id,
                        'customer_source_master',
                        $createdBy,
                        'เปลี่ยนแหล่งข้อมูลลูกค้าเป็น master และล้างข้อมูลเฉพาะใบส่งของ'
                    );
                }
            }

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                null,
                'preparing',
                $createdBy,
                'สร้างใบส่งของจากใบเสร็จ '.$receipt->number
            );

            return $deliveryNote->load(['receipt', 'customer', 'creator', 'items']);
        });
    }

    /**
     * Create a delivery note manually (no receipt source). Optionally
     * accepts an `items` array; otherwise creates one summary row from
     * work_name + quantity.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?string $createdBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $deliveryNote = new DeliveryNote;
            $deliveryNote->id = (string) Str::uuid();
            $deliveryNote->company_id = $data['company_id']
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);
            $deliveryNote->number = DeliveryNote::generateDeliveryNoteNumber($deliveryNote->company_id);
            $deliveryNote->invoice_id = $data['invoice_id'] ?? null;
            $deliveryNote->invoice_item_id = $data['invoice_item_id'] ?? null;

            // Cache invoice number for display (avoid extra join later).
            if (! empty($data['invoice_number'])) {
                $deliveryNote->invoice_number = $data['invoice_number'];
            } elseif (! empty($deliveryNote->invoice_id)) {
                $deliveryNote->invoice_number = optional(Invoice::find($deliveryNote->invoice_id))->number;
            }

            // Customer fields.
            $deliveryNote->customer_id = $data['customer_id'] ?? null;
            $deliveryNote->customer_data_source = $data['customer_data_source'] ?? 'master';
            $deliveryNote->customer_company = $data['customer_company'];
            $deliveryNote->customer_address = $data['customer_address'];
            $deliveryNote->customer_zip_code = $data['customer_zip_code'] ?? null;
            $deliveryNote->customer_tel_1 = $data['customer_tel_1'] ?? null;
            $deliveryNote->customer_tax_id = $data['customer_tax_id'] ?? null;
            $deliveryNote->customer_firstname = $data['customer_firstname'] ?? null;
            $deliveryNote->customer_lastname = $data['customer_lastname'] ?? null;
            if (! empty($data['customer_snapshot'])) {
                $deliveryNote->customer_snapshot = is_array($data['customer_snapshot'])
                    ? json_encode($data['customer_snapshot'])
                    : $data['customer_snapshot'];
            }

            // Work info.
            $deliveryNote->work_name = $data['work_name'];
            $deliveryNote->quantity = $data['quantity'] ?? '1 ชิ้น';

            // Delivery info.
            $deliveryNote->delivery_method = $data['delivery_method'] ?? 'courier';
            $deliveryNote->courier_company = $data['courier_company'] ?? null;
            $deliveryNote->tracking_number = $data['tracking_number'] ?? null;
            $deliveryNote->delivery_address = $data['delivery_address'] ?? ($data['customer_address'] ?? null);
            $deliveryNote->recipient_name = $data['recipient_name'] ?? trim(($data['customer_firstname'] ?? '').' '.($data['customer_lastname'] ?? '')) ?: null;
            $deliveryNote->recipient_phone = $data['recipient_phone'] ?? null;
            $deliveryNote->delivery_date = $data['delivery_date'] ?? now()->addDays(1)->format('Y-m-d');
            $deliveryNote->delivery_notes = $data['delivery_notes'] ?? null;
            $deliveryNote->notes = $data['notes'] ?? null;
            $deliveryNote->sender_company_id = $data['sender_company_id'] ?? null;

            // manage_by: explicit override > master customer default.
            if (! empty($data['manage_by'])) {
                $deliveryNote->manage_by = $data['manage_by'];
            } elseif (! empty($deliveryNote->customer_id)) {
                $mc = MasterCustomer::find($deliveryNote->customer_id);
                if ($mc && ! empty($mc->cus_manage_by)) {
                    $deliveryNote->manage_by = $mc->cus_manage_by;
                }
            }

            $deliveryNote->status = 'preparing';
            $deliveryNote->created_by = $createdBy;

            $deliveryNote->save();

            // Items: prefer FE-supplied list, otherwise synthesize one summary row.
            if (! empty($data['items']) && is_array($data['items'])) {
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
                    $dni->created_by = $createdBy;
                    $dni->save();
                }
            } elseif (! empty($deliveryNote->work_name)) {
                $dni = new DeliveryNoteItem;
                $dni->delivery_note_id = $deliveryNote->id;
                $dni->invoice_id = $deliveryNote->invoice_id;
                $dni->invoice_item_id = $deliveryNote->invoice_item_id;
                $dni->sequence_order = 1;
                $dni->item_name = $deliveryNote->work_name;
                $dni->item_description = null;
                $dni->delivered_quantity = (int) (preg_replace('/[^0-9]/', '', (string) $deliveryNote->quantity) ?: 0);
                $dni->unit = 'ชิ้น';
                $dni->status = 'ready';
                $dni->created_by = $createdBy;
                $dni->save();
            }

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                null,
                'preparing',
                $createdBy,
                'สร้างใบส่งของแบบ Manual'
            );

            return $deliveryNote->load(['customer', 'creator', 'items', 'manager']);
        });
    }
}
