<?php

namespace App\Services\Accounting\Pdf;

use Codedge\Fpdf\Fpdf\Fpdf;
use App\Models\Accounting\Quotation;

class QuotationPdfService
{
    protected Fpdf $pdf;
    /**
     * Convert UTF-8 text to TIS-620 safely for FPDF Thai fonts.
     * Drops unsupported characters to avoid iconv warnings/exceptions.
     */
    private function t($text): string
    {
        $s = iconv('UTF-8', 'TIS-620//IGNORE', (string)$text);
        return $s === false ? '' : $s;
    }

    public function __construct()
    {
        // Ensure FPDF knows where to find custom font definition files
        if (!defined('FPDF_FONTPATH')) {
            // Point to public/fonts where PSLKittithada*.php are stored
            $fontDir = public_path('fonts') . DIRECTORY_SEPARATOR;
            define('FPDF_FONTPATH', $fontDir);
        }

        $this->pdf = new Fpdf('P', 'mm', 'A4');
        $this->pdf->SetMargins(12, 10, 12);
        $this->pdf->SetAutoPageBreak(true, 12);

        // Register Thai fonts (pre-generated in public/fonts)
        try {
            $this->pdf->AddFont('PSLKittithada', '', 'PSLKittithada.php');
            $this->pdf->AddFont('PSLKittithadaBold', '', 'PSLKittithadaBold.php');
        } catch (\Throwable $e) {
            // Fallback to core fonts if custom fonts are not available
            // This prevents hard crashes; text may not render Thai correctly
            // but at least PDF generation continues.
            // You can fix fonts by ensuring PSLKittithada*.php are in public/fonts.
            // No rethrow here to keep downstream flow working.
        }
    }

    public function render(Quotation $q): string
    {
        $this->pdf->AddPage();

        // Header: Logo + Company info
        $publicPath = public_path();
        $logoCandidates = [
            $publicPath . '/images/logo.png',
            $publicPath . '/logo.png',
        ];
        $logoPath = null;
        foreach ($logoCandidates as $cand) {
            if (is_file($cand)) { $logoPath = $cand; break; }
        }

        if ($logoPath) {
            // x=12, y=10, width=32mm
            $this->pdf->Image($logoPath, 12, 10, 32);
        }

    $this->pdf->SetXY(12 + 36, 10);
    // Choose available font (custom Thai font or fallback)
    $boldFont = 'PSLKittithadaBold';
    $regularFont = 'PSLKittithada';
    $fallbackBold = ['Arial', 'B'];
    $fallbackRegular = ['Arial', ''];
    try { $this->pdf->SetFont($boldFont, '', 16); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 16); }
        $companyName = $q->company->legal_name ?? $q->company->name ?? 'บริษัทของคุณ';
        $this->pdf->Cell(120, 7, $this->t($companyName));
        $this->pdf->Ln(7);
    try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $addressLine = (string)($q->company->address ?? '');
        if ($addressLine !== '') {
            $this->pdf->MultiCell(120, 6, $this->t($addressLine));
        }
        $phoneTax = 'โทร: ' . ($q->company->phone ?? '-') . '  ' . 'เลขประจำตัวผู้เสียภาษี: ' . ($q->company->tax_id ?? '-');
        $this->pdf->Cell(120, 6, $this->t($phoneTax));

        // Title and meta
        $this->pdf->SetXY(-90, 10);
    try { $this->pdf->SetFont($boldFont, '', 18); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 18); }
        $this->pdf->Cell(78, 8, $this->t('ใบเสนอราคา'), 0, 2, 'R');
    try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $this->pdf->Cell(78, 6, $this->t('เลขที่: ' . ($q->number ?? '-')), 0, 2, 'R');
        $this->pdf->Cell(78, 6, $this->t('วันที่: ' . now()->format('d/m/Y')), 0, 2, 'R');

        // Customer box
        $this->pdf->Ln(4);
    try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $this->pdf->Cell(40, 7, $this->t('ลูกค้า: '), 0, 0);
    try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
        $this->pdf->Cell(120, 7, $this->t(($q->customer_company ?? '-')));
        $this->pdf->Ln(6);
    try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $this->pdf->MultiCell(180, 6, $this->t('ที่อยู่: ' . ($q->customer_address ?? '-')));
        $this->pdf->Cell(90, 6, $this->t('เลขภาษี: ' . ($q->customer_tax_id ?? '-')));
        $this->pdf->Cell(90, 6, $this->t('โทร: ' . ($q->customer_tel_1 ?? '-')));

        // Items table header (adjusted widths to fit 186mm content area)
        $this->pdf->Ln(8);
        try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
        $this->pdf->SetFillColor(245, 245, 245);
        $wIdx = 12; $wDetail = 102; $wQty = 24; $wUnit = 24; $wTotal = 24; // sum = 186
        $this->pdf->Cell($wIdx, 8, '#', 1, 0, 'C', true);
    $this->pdf->Cell($wDetail, 8, $this->t('รายละเอียดงาน'), 1, 0, 'L', true);
    $this->pdf->Cell($wQty, 8, $this->t('จำนวน'), 1, 0, 'R', true);
    $this->pdf->Cell($wUnit, 8, $this->t('ราคาต่อหน่วย'), 1, 0, 'R', true);
    $this->pdf->Cell($wTotal, 8, $this->t('ยอดรวม'), 1, 1, 'R', true);

        // Group items by name + attributes to emulate frontend preview
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
                    'unit' => $unit,
                    'rows' => [],
                    'notes' => [],
                ];
            }
            $groups[$key]['rows'][] = [
                'size' => (string)($it->size ?? ''),
                'quantity' => (float)($it->quantity ?? 0),
                'unit_price' => (float)($it->unit_price ?? 0),
                'notes' => (string)($it->notes ?? ''),
            ];
        }

        // Render groups similar to QuotationPreview.jsx
        try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $index = 1;
        foreach (array_values($groups) as $g) {
            $unit = $g['unit'] ?: 'ชิ้น';
            // Title row (bold name)
            try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
            $this->pdf->Cell($wIdx, 8, (string)$index, 1, 0, 'C');
            $this->pdf->Cell($wDetail, 8, $this->t(($g['name'] ?: 'ไม่ระบุชื่องาน')), 1, 0, 'L');
            $this->pdf->Cell($wQty, 8, '', 1, 0);
            $this->pdf->Cell($wUnit, 8, '', 1, 0);
            $this->pdf->Cell($wTotal, 8, '', 1, 1);

            // Descriptor row (pattern • fabric • color)
            $descParts = array_values(array_filter([$g['pattern'] ?: null, $g['fabric'] ?: null, $g['color'] ?: null]));
            if (!empty($descParts)) {
                try { $this->pdf->SetFont($regularFont, '', 11); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 11); }
                $this->pdf->Cell($wIdx, 7, '', 1, 0);
                $desc = implode(' • ', $descParts);
                $this->pdf->Cell($wDetail, 7, $this->t($desc), 1, 0, 'L');
                $this->pdf->Cell($wQty, 7, '', 1, 0);
                $this->pdf->Cell($wUnit, 7, '', 1, 0);
                $this->pdf->Cell($wTotal, 7, '', 1, 1);
            }

            // Rows per size or fallback single line
            try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
            $rows = array_values($g['rows']);
            $hasSized = count(array_filter($rows, fn($r) => !empty($r['size']))) > 0;
            $groupTotal = 0.0;
            if ($hasSized) {
                foreach ($rows as $r) {
                    $qty = (float)($r['quantity'] ?? 0);
                    $price = (float)($r['unit_price'] ?? 0);
                    $line = $qty * $price;
                    $groupTotal += $line;
                    $this->pdf->Cell($wIdx, 7, '', 1, 0);
                    $this->pdf->Cell($wDetail, 7, $this->t('ไซซ์: ' . (($r['size'] ?? '-') ?: '-')), 1, 0, 'L');
                    $this->pdf->Cell($wQty, 7, number_format($qty) . ' ' . $this->t($unit), 1, 0, 'R');
                    $this->pdf->Cell($wUnit, 7, number_format($price, 2), 1, 0, 'R');
                    $this->pdf->Cell($wTotal, 7, number_format($line, 2), 1, 1, 'R');
                }
            } else {
                // Collapsed single line using the first row
                $r = $rows[0] ?? ['quantity' => 0, 'unit_price' => 0, 'notes' => ''];
                $qty = (float)($r['quantity'] ?? 0);
                $price = (float)($r['unit_price'] ?? 0);
                $line = $qty * $price;
                $groupTotal += $line;
                $notes = trim((string)($r['notes'] ?? ''));
                $this->pdf->Cell($wIdx, 7, '', 1, 0);
                $this->pdf->Cell($wDetail, 7, $this->t(($notes ? ('หมายเหตุ: ' . $notes) : '')), 1, 0, 'L');
                $this->pdf->Cell($wQty, 7, number_format($qty) . ' ' . $this->t($unit), 1, 0, 'R');
                $this->pdf->Cell($wUnit, 7, number_format($price, 2), 1, 0, 'R');
                $this->pdf->Cell($wTotal, 7, number_format($line, 2), 1, 1, 'R');
            }

            // Per-item total row (bold)
            try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
            $this->pdf->Cell($wIdx, 8, '', 0, 0);
            $this->pdf->Cell($wDetail + $wQty + $wUnit, 8, '', 0, 0);
            $this->pdf->Cell($wTotal, 8, number_format($groupTotal, 2), 0, 1, 'R');

            // Separator line
            $this->pdf->Cell($wIdx + $wDetail + $wQty + $wUnit + $wTotal, 0, '', 'T', 1);
            $index++;
        }

        // Summary section
        $this->pdf->Ln(4);
        try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        // Align to right box (width ~ 360 in frontend; here we keep right-aligned labels/values)
        $labelW = $wDetail + $wQty; // 126
        $valueW = $wUnit + $wTotal; // 48
        $this->pdf->Cell($labelW, 7, $this->t('รวมเป็นเงิน'), 0, 0, 'R');
        try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
        $this->pdf->Cell($valueW, 7, number_format((float)($q->subtotal ?? 0), 2), 0, 1, 'R');

        try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $this->pdf->Cell($labelW, 7, $this->t('ภาษีมูลค่าเพิ่ม 7%'), 0, 0, 'R');
        try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
        $this->pdf->Cell($valueW, 7, number_format((float)($q->tax_amount ?? 0), 2), 0, 1, 'R');

        // Total
        try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
        $this->pdf->Cell($labelW, 7, $this->t('จำนวนเงินรวมทั้งสิ้น'), 0, 0, 'R');
        $totalAmount = (float)($q->total_amount ?? (($q->subtotal ?? 0) + ($q->tax_amount ?? 0)));
        $this->pdf->Cell($valueW, 7, number_format($totalAmount, 2), 0, 1, 'R');

        // Deposit and remaining
        try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $depositPct = (float)($q->deposit_percentage ?? 0);
        $depositAmount = $depositPct > 0 ? round(($totalAmount * $depositPct) / 100, 2) : 0.0;
        $remaining = max($totalAmount - $depositAmount, 0);
        $this->pdf->Cell($labelW, 7, $this->t('มัดจำ'), 0, 0, 'R');
        try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
        $this->pdf->Cell($valueW, 7, number_format($depositAmount, 2), 0, 1, 'R');
        try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $this->pdf->Cell($labelW, 7, $this->t('คงเหลือ'), 0, 0, 'R');
        try { $this->pdf->SetFont($boldFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackBold[0], $fallbackBold[1], 12); }
        $this->pdf->Cell($valueW, 7, number_format($remaining, 2), 0, 1, 'R');

        // Notes & Terms (match frontend preview intent)
        $this->pdf->Ln(2);
        if (!empty($q->notes)) {
            try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
            $this->pdf->Cell(0, 6, $this->t('หมายเหตุ'), 0, 1);
            $this->pdf->MultiCell(0, 6, $this->t((string)$q->notes));
        }
        $termsText = "ไม่สามารถหักภาษี ณ ที่จ่ายได้ เนื่องจากเป็นการซื้อวัตถุดิบ\nมัดจำ 50% ก่อนเริ่มงาน และชำระ 50% ก่อนส่งมอบสินค้า";
        try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $this->pdf->MultiCell(0, 6, $this->t($termsText));

        // Signature lines
        $this->pdf->Ln(14);
        $y = $this->pdf->GetY();
        $this->pdf->SetXY(12, $y);
        $this->pdf->Cell(80, 0, '', 'T');
        $this->pdf->SetXY(118, $y);
        $this->pdf->Cell(80, 0, '', 'T');
        $this->pdf->Ln(2);
    try { $this->pdf->SetFont($regularFont, '', 12); } catch (\Throwable $e) { $this->pdf->SetFont($fallbackRegular[0], $fallbackRegular[1], 12); }
        $this->pdf->Cell(80, 6, $this->t('ผู้สั่งซื้อสินค้า'), 0, 0, 'C');
        $this->pdf->Cell(26, 6, '');
        $this->pdf->Cell(80, 6, $this->t('ผู้อนุมัติ'), 0, 1, 'C');

        // Output to temp file and return path
        $filename = 'quotation-' . ($q->number ?? $q->id) . '.pdf';
        $pdfDir = storage_path('app/public/pdfs/quotations');
        if (!is_dir($pdfDir)) {
            @mkdir($pdfDir, 0755, true);
        }
        $fullpath = $pdfDir . DIRECTORY_SEPARATOR . $filename;
        $this->pdf->Output('F', $fullpath, true);

        return $fullpath;
    }
}
