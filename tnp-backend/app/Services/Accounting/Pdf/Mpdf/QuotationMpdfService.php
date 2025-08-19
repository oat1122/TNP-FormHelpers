<?php

namespace App\Services\Accounting\Pdf\Mpdf;

use App\Models\Accounting\Quotation;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf as PDF;

class QuotationMpdfService
{
    /**
     * Generate a Quotation PDF via mPDF and return absolute file path.
     */
    public function render(Quotation $quotation): string
    {
        // Ensure relations for view
        $q = $quotation->loadMissing(['company', 'customer', 'items']);

        // Extract customer info in a consistent way
        $customer = CustomerInfoExtractor::fromQuotation($q);

        // Group items similar to FPDF output (by item attributes)
        $groups = [];
        foreach ($q->items as $it) {
            $name = (string)($it->item_name ?? 'ไม่ระบุชื่องาน');
            $pattern = (string)($it->pattern ?? '');
            $fabric = (string)($it->fabric_type ?? '');
            $color = (string)($it->color ?? '');
            $unit = (string)($it->unit ?? 'ชิ้น');
            $prid = (string)($it->pricing_request_id ?? '');
            $key = mb_strtolower($name . '|' . $pattern . '|' . $fabric . '|' . $color . '|' . $unit . '|' . $prid);
            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'name' => $name,
                    'pattern' => $pattern,
                    'fabric' => $fabric,
                    'color' => $color,
                    'unit' => $unit ?: 'ชิ้น',
                    'rows' => [],
                ];
            }
            $groups[$key]['rows'][] = [
                'size' => (string)($it->size ?? ''),
                'quantity' => (float)($it->quantity ?? 0),
                'unit_price' => (float)($it->unit_price ?? 0),
                'notes' => (string)($it->notes ?? ''),
            ];
        }
        $groups = array_values($groups);

        $subtotal = (float)($q->subtotal ?? 0);
        $tax = (float)($q->tax_amount ?? 0);
        $total = (float)($q->total_amount ?? ($subtotal + $tax));
        $depositPct = (float)($q->deposit_percentage ?? 0);
        $depositAmt = $depositPct > 0 ? round(($total * $depositPct) / 100, 2) : 0.0;
        $remaining = max($total - $depositAmt, 0);

        $summary = [
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'deposit_pct' => $depositPct,
            'deposit_amount' => $depositAmt,
            'remaining' => $remaining,
        ];

        $isFinal = in_array($q->status, ['approved', 'sent', 'completed']);

        $viewData = compact('q', 'customer', 'groups', 'summary', 'isFinal');

        // Render with mPDF (uses config/pdf.php; Sarabun font pre-configured)
        $pdf = PDF::loadView('pdf.quotation', $viewData);

        // Save into public storage so it is web-accessible via storage symlink
        $dir = storage_path('app/public/pdfs/quotations');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $filename = 'quotation-' . ($q->number ?? $q->id) . '.pdf';
        $fullpath = $dir . DIRECTORY_SEPARATOR . $filename;

        $pdf->save($fullpath);

        return $fullpath;
    }

    /**
     * Backward-compatible method name (some callers may expect make()).
     */
    public function make(Quotation $q): string
    {
        return $this->render($q);
    }
}
