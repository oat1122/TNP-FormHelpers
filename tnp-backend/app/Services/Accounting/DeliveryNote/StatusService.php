<?php

namespace App\Services\Accounting\DeliveryNote;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;

/**
 * Delivery-note status state machine:
 *   preparing → shipping → in_transit → delivered → completed
 *                                       ↓
 *                                     failed (any → failed)
 */
class StatusService
{
    /**
     * Move from preparing → shipping. Optionally records tracking number +
     * courier company on the same transition.
     *
     * @param  array<string, mixed>  $shippingData
     */
    public function startShipping(string $deliveryNoteId, array $shippingData, ?string $shippedBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNoteId, $shippingData, $shippedBy) {
            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if ($deliveryNote->status !== 'preparing') {
                throw new \Exception('Only delivery notes in preparing status can be shipped');
            }

            $deliveryNote->status = 'shipping';

            if (! empty($shippingData['tracking_number'])) {
                $deliveryNote->tracking_number = $shippingData['tracking_number'];
            }

            if (! empty($shippingData['courier_company'])) {
                $deliveryNote->courier_company = $shippingData['courier_company'];
            }

            $deliveryNote->save();

            $notes = 'เริ่มการจัดส่ง';
            if (! empty($shippingData['tracking_number'])) {
                $notes .= ' - Tracking: '.$shippingData['tracking_number'];
            }
            if (! empty($shippingData['courier_company'])) {
                $notes .= ' - ผู้ส่ง: '.$shippingData['courier_company'];
            }

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                'preparing',
                'shipping',
                $shippedBy,
                $notes
            );

            return $deliveryNote->load(['receipt', 'customer', 'creator', 'items']);
        });
    }

    /**
     * shipping/in_transit → in_transit (logs each tracking event).
     *
     * @param  array<string, mixed>  $trackingData
     */
    public function updateTrackingStatus(string $deliveryNoteId, array $trackingData, ?string $updatedBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNoteId, $trackingData, $updatedBy) {
            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if (! in_array($deliveryNote->status, ['shipping', 'in_transit'], true)) {
                throw new \Exception('Tracking status can only be updated for shipped or in-transit items');
            }

            $deliveryNote->status = 'in_transit';
            $deliveryNote->save();

            $notes = $trackingData['status_description'] ?? 'อัปเดตสถานะการติดตาม';
            if (! empty($trackingData['location'])) {
                $notes .= ' - สถานที่: '.$trackingData['location'];
            }

            DocumentHistory::logAction(
                'delivery_note',
                $deliveryNote->id,
                'tracking_update',
                $updatedBy,
                $notes
            );

            return $deliveryNote->load(['receipt', 'customer', 'creator', 'items']);
        });
    }

    /**
     * shipping/in_transit → delivered.
     *
     * @param  array<string, mixed>  $deliveryData
     */
    public function markAsDelivered(string $deliveryNoteId, array $deliveryData, ?string $deliveredBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNoteId, $deliveryData, $deliveredBy) {
            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if (! in_array($deliveryNote->status, ['shipping', 'in_transit'], true)) {
                throw new \Exception('Only shipped or in-transit items can be marked as delivered');
            }

            $deliveryNote->status = 'delivered';
            $deliveryNote->delivered_at = now();
            $deliveryNote->delivered_by = $deliveredBy;

            if (! empty($deliveryData['delivery_notes'])) {
                $deliveryNote->delivery_notes = $deliveryData['delivery_notes'];
            }

            $deliveryNote->save();

            $notes = 'ส่งสำเร็จ';
            if (! empty($deliveryData['recipient_name'])) {
                $notes .= ' - ผู้รับ: '.$deliveryData['recipient_name'];
            }
            if (! empty($deliveryData['delivery_notes'])) {
                $notes .= ' - หมายเหตุ: '.$deliveryData['delivery_notes'];
            }

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                'in_transit',
                'delivered',
                $deliveredBy,
                $notes
            );

            return $deliveryNote->load(['receipt', 'customer', 'creator']);
        });
    }

    /**
     * delivered → completed (terminal happy state).
     *
     * @param  array<string, mixed>  $completionData
     */
    public function markAsCompleted(string $deliveryNoteId, array $completionData, ?string $completedBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNoteId, $completionData, $completedBy) {
            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            if ($deliveryNote->status !== 'delivered') {
                throw new \Exception('Only delivered items can be marked as completed');
            }

            $deliveryNote->status = 'completed';

            if (! empty($completionData['notes'])) {
                $deliveryNote->notes = $completionData['notes'];
            }

            $deliveryNote->save();

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                'delivered',
                'completed',
                $completedBy,
                $completionData['notes'] ?? 'ปิดงานเรียบร้อย'
            );

            return $deliveryNote->load(['receipt', 'customer', 'creator']);
        });
    }

    /**
     * Any status → failed (terminal sad state — preserves the previous
     * status in the history log for diagnosis).
     *
     * @param  array<string, mixed>  $failureData
     */
    public function markAsFailed(string $deliveryNoteId, array $failureData, ?string $reportedBy = null): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNoteId, $failureData, $reportedBy) {
            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);

            $oldStatus = $deliveryNote->status;
            $deliveryNote->status = 'failed';

            if (! empty($failureData['notes'])) {
                $deliveryNote->notes = $failureData['notes'];
            }

            $deliveryNote->save();

            DocumentHistory::logStatusChange(
                'delivery_note',
                $deliveryNote->id,
                $oldStatus,
                'failed',
                $reportedBy,
                $failureData['reason'] ?? 'ไม่สามารถจัดส่งได้'
            );

            return $deliveryNote->load(['receipt', 'customer', 'creator']);
        });
    }
}
