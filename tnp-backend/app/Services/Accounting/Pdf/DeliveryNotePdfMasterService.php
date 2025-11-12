<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\DeliveryNote;
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

    protected function getStorageFolder(): string
    {
        return 'delivery-notes';
    }

    protected function getTemplatePath(array $viewData): string
    {
        return 'accounting.pdf.delivery-note.delivery-note-master';
    }

    protected function getSignatureTemplatePath(): string
    {
        return 'accounting.pdf.delivery-note.partials.delivery-note-signature';
    }

    protected function cssFiles(): array
    {
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/delivery-note/delivery-note-master.css'),
            // ใช้ header CSS ของ invoice ที่แชร์สไตล์หัวเอกสารพื้นฐานไว้แล้ว
            resource_path('views/pdf/partials/invoice-header.css'),
        ];
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $deliveryNote = $data['deliveryNote'];
        $customer     = $data['customer'];
        $isFinal      = $data['isFinal'];
        $headerType   = $data['headerType'] ?? 'ต้นฉบับ';

        // Header (ใช้ partial ที่มีอยู่แล้ว)
        $headerHtml = View::make('accounting.pdf.delivery-note.partials.delivery-note-header', compact('deliveryNote', 'customer', 'isFinal', 'headerType'))->render();

        $mpdf->SetHTMLHeader($headerHtml);

        // ✨ คืนค่า SetHTMLFooter - แสดงเลขหน้าในทุกหน้า
        if (!empty($data['options']['showPageNumbers'])) {
            $mpdf->SetHTMLFooter('<div style="text-align: right; font-size: 9pt; color: #888;">หน้า {PAGENO} / {nbpg}</div>');
        }

        // ไม่แสดง watermark preview
    }

    protected function buildViewData(object $deliveryNote, array $options = []): array
    {
        /** @var DeliveryNote $dn */
        $dn = $deliveryNote->loadMissing(['company', 'customer', 'items', 'creator', 'manager', 'deliveryPerson']);

        // ใช้ตัว extract กลางเพื่อให้ได้ข้อมูลลูกค้าแบบ normalize
        $customer = \App\Services\Accounting\Pdf\CustomerInfoExtractor::fromDeliveryNote($dn);
        $groups   = $this->groupDeliveryNoteItems($dn);

        $isFinal = in_array($dn->status, ['shipping', 'in_transit', 'delivered', 'completed'], true);

        // รองรับ document_header_type ผ่าน options (ไม่บันทึก DB)
        $headerType = $options['document_header_type'] ?? 'ต้นฉบับ';

        return [
            'deliveryNote'   => $dn,
            'customer'       => $customer,
            'groups'         => $groups,
            'isFinal'        => $isFinal,
            'headerType'     => $headerType,
            'options'        => array_merge([
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
     * จัดกลุ่มรายการสินค้าใน DeliveryNote
     */
    protected function groupDeliveryNoteItems(DeliveryNote $dn): array
    {
        $groups = [];

        foreach ($dn->items as $item) {
            $key = strtolower(implode('|', [
                $item->item_name ?? '',
                $item->pattern ?? '',
                $item->fabric_type ?? '',
                $item->color ?? '',
                $item->unit ?? 'ชิ้น',
            ]));

            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'name'   => $item->item_name ?? 'ไม่ระบุชื่องาน',
                    'pattern'=> $item->pattern ?? '',
                    'fabric' => $item->fabric_type ?? '',
                    'color'  => $item->color ?? '',
                    'unit'   => $item->unit ?? 'ชิ้น',
                    'rows'   => [],
                ];
            }

            $groups[$key]['rows'][] = [
                'size'     => $item->size ?? '-',
                'quantity' => (float) ($item->delivered_quantity ?? 0),
            ];
        }

        return array_values($groups);
    }

    /**
     * แปลงประเภทหัวกระดาษเป็น slug สำหรับชื่อไฟล์
     */
    protected function slugHeaderType(string $headerType): string
    {
        // Normalize: trim + remove multiple spaces
        $normalized = preg_replace('/\s+/', '', trim($headerType));
        
        $map = [
            'ต้นฉบับ'      => 'original',
            'สำเนา'        => 'copy',
            'สำเนา-ลูกค้า' => 'copy-customer',
        ];
        
        return $map[$normalized] ?? 'original';
    }

    /**
     * Override savePdfFile เพื่อใช้ logic เฉพาะของ DeliveryNote (รองรับ headerType)
     */
    protected function savePdfFile(\Mpdf\Mpdf $mpdf, array $viewData): string
    {
        $deliveryNote = $viewData['deliveryNote'];
        $headerType = $viewData['headerType'] ?? 'ต้นฉบับ';

        $directory = storage_path('app/public/pdfs/delivery-notes');

        if (!is_dir($directory)) {
            @mkdir($directory, 0755, true);
        }

        // สร้างชื่อไฟล์ที่ไม่ซ้ำกันด้วย header type และ microtime
        $headerSlug = $this->slugHeaderType($headerType);
        $timestamp = date('Y-m-d-His') . '-' . substr(str_replace('.', '', microtime(true)), -6);
        $filename = sprintf(
            'delivery-note-%s-%s-%s.pdf',
            $deliveryNote->number ?? $deliveryNote->id,
            $headerSlug,
            $timestamp
        );

        $fullPath = $directory.DIRECTORY_SEPARATOR.$filename;
        $mpdf->Output($fullPath, 'F');

        return $fullPath;
    }
}
