<?php

namespace App\Services\Accounting\Pdf;

use Codedge\Fpdf\Fpdf\Fpdf;
use App\Models\Accounting\Quotation;

class QuotationPdfService
{
    protected Fpdf $pdf;

    public function __construct()
    {
        $this->pdf = new Fpdf('P', 'mm', 'A4');
        $this->pdf->SetMargins(12, 10, 12);
        $this->pdf->SetAutoPageBreak(true, 12);

        // Register Thai fonts (pre-generated in public/fonts)
        $this->pdf->AddFont('PSLKittithada', '', 'PSLKittithada.php');
        $this->pdf->AddFont('PSLKittithadaBold', '', 'PSLKittithadaBold.php');
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
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        $companyName = $q->company->legal_name ?? $q->company->name ?? 'บริษัทของคุณ';
        $this->pdf->Cell(120, 7, iconv('UTF-8', 'TIS-620', $companyName));
        $this->pdf->Ln(7);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $addressLine = (string)($q->company->address ?? '');
        if ($addressLine !== '') {
            $this->pdf->MultiCell(120, 6, iconv('UTF-8', 'TIS-620', $addressLine));
        }
        $phoneTax = 'โทร: ' . ($q->company->phone ?? '-') . '  ' . 'เลขประจำตัวผู้เสียภาษี: ' . ($q->company->tax_id ?? '-');
        $this->pdf->Cell(120, 6, iconv('UTF-8', 'TIS-620', $phoneTax));

        // Title and meta
        $this->pdf->SetXY(-90, 10);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(78, 8, iconv('UTF-8', 'TIS-620', 'ใบเสนอราคา'), 0, 2, 'R');
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(78, 6, iconv('UTF-8', 'TIS-620', 'เลขที่: ' . ($q->number ?? '-')), 0, 2, 'R');
        $this->pdf->Cell(78, 6, iconv('UTF-8', 'TIS-620', 'วันที่: ' . now()->format('d/m/Y')), 0, 2, 'R');

        // Customer box
        $this->pdf->Ln(4);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(40, 7, iconv('UTF-8', 'TIS-620', 'ลูกค้า: '), 0, 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(120, 7, iconv('UTF-8', 'TIS-620', ($q->customer_company ?? '-')));
        $this->pdf->Ln(6);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->MultiCell(180, 6, iconv('UTF-8', 'TIS-620', 'ที่อยู่: ' . ($q->customer_address ?? '-')));
        $this->pdf->Cell(90, 6, iconv('UTF-8', 'TIS-620', 'เลขภาษี: ' . ($q->customer_tax_id ?? '-')));
        $this->pdf->Cell(90, 6, iconv('UTF-8', 'TIS-620', 'โทร: ' . ($q->customer_tel_1 ?? '-')));

        // Items table header
        $this->pdf->Ln(8);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->SetFillColor(245, 245, 245);
        $this->pdf->Cell(12, 8, '#', 1, 0, 'C', true);
        $this->pdf->Cell(106, 8, iconv('UTF-8', 'TIS-620', 'รายละเอียดงาน'), 1, 0, 'L', true);
        $this->pdf->Cell(24, 8, iconv('UTF-8', 'TIS-620', 'จำนวน'), 1, 0, 'R', true);
        $this->pdf->Cell(24, 8, iconv('UTF-8', 'TIS-620', 'ราคาต่อหน่วย'), 1, 0, 'R', true);
        $this->pdf->Cell(24, 8, iconv('UTF-8', 'TIS-620', 'ยอดรวม'), 1, 1, 'R', true);

        // Items rows
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $index = 1;
        foreach ($q->items as $it) {
            $name = $it->item_name ?? 'ไม่ระบุชื่องาน';
            $qty = (int)($it->quantity ?? 0);
            $unitPrice = (float)($it->unit_price ?? 0);
            $totalLine = (float)($it->discount_amount ?? 0);
            if ($totalLine <= 0) {
                $totalLine = $unitPrice * $qty;
            }

            $this->pdf->Cell(12, 8, (string)$index, 1, 0, 'C');
            $this->pdf->Cell(106, 8, iconv('UTF-8', 'TIS-620', $name), 1);
            $this->pdf->Cell(24, 8, number_format($qty), 1, 0, 'R');
            $this->pdf->Cell(24, 8, number_format($unitPrice, 2), 1, 0, 'R');
            $this->pdf->Cell(24, 8, number_format($totalLine, 2), 1, 1, 'R');
            $index++;
        }

        // Summary
        $this->pdf->Ln(4);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(142, 7, '');
        $this->pdf->Cell(24, 7, iconv('UTF-8', 'TIS-620', 'รวมเป็นเงิน'), 0, 0, 'R');
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(24, 7, number_format((float)$q->subtotal, 2), 0, 1, 'R');

        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(142, 7, '');
        $this->pdf->Cell(24, 7, iconv('UTF-8', 'TIS-620', 'ภาษีมูลค่าเพิ่ม 7%'), 0, 0, 'R');
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(24, 7, number_format((float)$q->tax_amount, 2), 0, 1, 'R');

        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(142, 7, '');
        $this->pdf->Cell(24, 7, iconv('UTF-8', 'TIS-620', 'จำนวนเงินรวมทั้งสิ้น'), 0, 0, 'R');
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(24, 7, number_format((float)$q->total_amount, 2), 0, 1, 'R');

        // Notes
        if (!empty($q->notes)) {
            $this->pdf->Ln(4);
            $this->pdf->SetFont('PSLKittithadaBold', '', 12);
            $this->pdf->Cell(0, 6, iconv('UTF-8', 'TIS-620', 'หมายเหตุ'), 0, 1);
            $this->pdf->SetFont('PSLKittithada', '', 12);
            $this->pdf->MultiCell(0, 6, iconv('UTF-8', 'TIS-620', (string)$q->notes));
        }

        // Signature lines
        $this->pdf->Ln(14);
        $y = $this->pdf->GetY();
        $this->pdf->SetXY(12, $y);
        $this->pdf->Cell(80, 0, '', 'T');
        $this->pdf->SetXY(118, $y);
        $this->pdf->Cell(80, 0, '', 'T');
        $this->pdf->Ln(2);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(80, 6, iconv('UTF-8', 'TIS-620', 'ผู้สั่งซื้อสินค้า'), 0, 0, 'C');
        $this->pdf->Cell(26, 6, '');
        $this->pdf->Cell(80, 6, iconv('UTF-8', 'TIS-620', 'ผู้อนุมัติ'), 0, 1, 'C');

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
