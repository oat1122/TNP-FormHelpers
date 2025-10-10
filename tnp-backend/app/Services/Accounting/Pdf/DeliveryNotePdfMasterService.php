<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\DeliveryNote;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use Illuminate\Support\Facades\View;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบส่งของ (Delivery Note)
 * - สืบทอดจาก BasePdfMasterService เพื่อใช้ฟังก์ชั่นร่วมกัน
 * - มีเฉพาะ logic ที่เป็น DeliveryNote-specific
 */
class DeliveryNotePdfMasterService extends BasePdfMasterService
{
    protected function getFilenamePrefix(): string
    {
        return 'delivery-note';
    }

    protected function getTemplatePath(array $viewData): string
    {
        return 'accounting.pdf.delivery-note.delivery-note-master';
    }
    
    protected function getSignatureTemplatePath(): string
    {
        return 'pdf.partials.delivery-note-signature';
    }

    protected function cssFiles(): array
    {
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/delivery-note/delivery-note-master.css'),
            resource_path('views/pdf/partials/delivery-note-header.css'),
        ];
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $deliveryNote = $data['deliveryNote'];
        $customer = $data['customer'];
        $isFinal = $data['isFinal'];

        // Header
        $headerHtml = View::make('accounting.pdf.delivery-note.partials.delivery-note-header', compact(
            'deliveryNote', 'customer', 'isFinal'
        ))->render();

        // Footer
        $footerHtml = View::make('accounting.pdf.delivery-note.partials.delivery-note-footer', compact(
            'deliveryNote', 'customer', 'isFinal'
        ))->render();

        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml);

        // Watermark for non-final delivery notes
        if (!$isFinal && ($data['options']['showWatermark'] ?? true)) {
            $mpdf->SetWatermarkText('PREVIEW', 0.1);
            $mpdf->showWatermarkText = true;
        }
    }

    protected function buildViewData(object $deliveryNote, array $options = []): array
    {
        /** @var DeliveryNote $dn */
        $dn = $deliveryNote->loadMissing(['company', 'customer', 'items', 'creator', 'invoice']);

        $customer = CustomerInfoExtractor::fromDeliveryNote($dn);
        $items = $this->getDeliveryNoteItems($dn);
        $summary = $this->buildDeliveryNoteSummary($dn);

        $isFinal = in_array($dn->status, ['approved', 'sent', 'completed', 'delivered'], true);

        return [
            'deliveryNote' => $dn,
            'customer'     => $customer,
            'items'        => $items,
            'summary'      => $summary,
            'isFinal'      => $isFinal,
            'options'      => array_merge([
                'format'          => 'A4',
                'orientation'     => 'P',
                'showPageNumbers' => true,
                'showWatermark'   => !$isFinal,
            ], $options),
        ];
    }

    // =======================================================================
    // |  DeliveryNote Specific Helpers
    // =======================================================================

    /**
     * ดึงรายการสินค้าจาก DeliveryNote
     * @return array<mixed>
     */
    protected function getDeliveryNoteItems(DeliveryNote $deliveryNote): array
    {
        if ($deliveryNote->items && $deliveryNote->items->count() > 0) {
            return $deliveryNote->items->toArray();
        }

        // Fallback: ถ้าไม่มี items ลองดึงจาก invoice ที่เชื่อมโยง
        if ($deliveryNote->invoice && $deliveryNote->invoice->items) {
            return $deliveryNote->invoice->items->toArray();
        }

        return [];
    }

    /**
     * สร้างสรุปข้อมูลสำหรับ DeliveryNote
     * @return array<string, mixed>
     */
    protected function buildDeliveryNoteSummary(DeliveryNote $deliveryNote): array
    {
        return [
            'total_items' => $this->countTotalItems($deliveryNote),
            'total_quantity' => $this->calculateTotalQuantity($deliveryNote),
            'delivery_date' => $deliveryNote->delivery_date,
            'delivery_method' => $deliveryNote->delivery_method ?? 'ส่งทางไปรษณีย์',
            'tracking_number' => $deliveryNote->tracking_number,
            'note' => $deliveryNote->note,
            'invoice_number' => $deliveryNote->invoice?->number,
        ];
    }

    /**
     * นับจำนวนรายการสินค้าทั้งหมด
     */
    protected function countTotalItems(DeliveryNote $deliveryNote): int
    {
        return count($this->getDeliveryNoteItems($deliveryNote));
    }

    /**
     * คำนวณจำนวนรวมทั้งหมด
     */
    protected function calculateTotalQuantity(DeliveryNote $deliveryNote): float
    {
        $items = $this->getDeliveryNoteItems($deliveryNote);
        $total = 0;

        foreach ($items as $item) {
            $total += (float)($item['quantity'] ?? 0);
        }

        return $total;
    }

    /**
     * Override getStorageFolder เพื่อใช้ชื่อโฟลเดอร์เฉพาะ
     */
    protected function getStorageFolder(): string
    {
        return 'delivery-notes';
    }
}