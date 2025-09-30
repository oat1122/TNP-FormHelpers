<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Invoice;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบกำกับภาษี (Tax Invoice)
 * - ใช้ Body/Styles เดียวกับ Invoice แต่ Header ต่างกัน
 * - Footer และ Signature ใช้ partial ของ Invoice เดิม
 */
class TaxInvoicePdfMasterService extends InvoicePdfMasterService
{
    public function generatePdf(Invoice $invoice, array $options = []): array
    {
        try {
            $viewData = $this->buildViewData($invoice, $options);
            $mpdf = $this->createMpdf($viewData);
            $filePath = $this->savePdfFile($mpdf, $viewData['invoice'], $viewData['options'] ?? []);

            return [
                'path'     => $filePath,
                'url'      => $this->generatePublicUrl($filePath),
                'filename' => basename($filePath),
                'size'     => is_file($filePath) ? filesize($filePath) : 0,
                'type'     => $viewData['isFinal'] ? 'final' : 'preview',
            ];
        } catch (\Throwable $e) {
            Log::error('TaxInvoicePdfMasterService::generatePdf error: ' . $e->getMessage(), [
                'invoice_id'     => $invoice->id ?? null,
                'invoice_number' => $invoice->number ?? 'N/A',
                'trace'          => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function streamPdf(Invoice $invoice, array $options = [])
    {
        $viewData = $this->buildViewData($invoice, $options);
        $mpdf = $this->createMpdf($viewData);

        $filename = sprintf('tax-invoice-%s.pdf', $viewData['invoice']->number ?? $viewData['invoice']->id);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
    }

    protected function createMpdf(array $viewData): Mpdf
    {
        $options = $viewData['options'] ?? [];

        $defaultConfig     = (new ConfigVariables())->getDefaults();
        $fontDirs          = $defaultConfig['fontDir'];
        $defaultFontConfig = (new FontVariables())->getDefaults();
        $fontData          = $defaultFontConfig['fontdata'];

        $customFontDir  = config('pdf.custom_font_dir', public_path('fonts/thsarabun/'));
        $customFontData = config('pdf.custom_font_data', [
            'thsarabun' => [
                'R'  => 'Sarabun-Regular.ttf',
                'B'  => 'Sarabun-Bold.ttf',
                'I'  => 'Sarabun-Italic.ttf',
                'BI' => 'Sarabun-BoldItalic.ttf',
            ],
        ]);
        $hasThaiFonts = $this->checkThaiFonts();

        $config = [
            'mode'                => 'utf-8',
            'format'              => $options['format']      ?? 'A4',
            'orientation'         => $options['orientation'] ?? 'P',
            'margin_left'         => 10,
            'margin_right'        => 10,
            'margin_top'          => 16,
            'margin_bottom'       => 14,
            'setAutoTopMargin'    => 'stretch',
            'setAutoBottomMargin' => 'stretch',

            'default_font'        => $hasThaiFonts ? 'thsarabun' : 'dejavusans',
            'default_font_size'   => 12,
            'fontDir'             => $hasThaiFonts ? array_merge($fontDirs, [$customFontDir]) : $fontDirs,
            'fontdata'            => $hasThaiFonts ? ($fontData + $customFontData) : $fontData,

            'tempDir'             => storage_path('app/mpdf-temp'),
            'curlAllowUnsafeSslRequests' => true,
            'useOTL'              => 0xFF,
            'useKerning'          => true,
            'autoLangToFont'      => true,
            'autoScriptToLang'    => true,
        ];

        if (!is_dir($config['tempDir'])) {
            @mkdir($config['tempDir'], 0755, true);
        }

        $mpdf = new Mpdf($config);
        $mpdf->curlTimeout = 5;
        $mpdf->curlExecutionTimeout = 5;
        $mpdf->curlFollowLocation = true;
        $mpdf->curlAllowUnsafeSslRequests = true;
        $mpdf->img_dpi = 96;
        $mpdf->interpolateImages = true;
        if (property_exists($mpdf, 'jpeg_quality')) {
            $mpdf->jpeg_quality = 90;
        }

        $this->writeCss($mpdf, $this->cssFiles());

        $this->addHeaderFooter($mpdf, $viewData);

        $depositMode = $options['deposit_mode'] ?? 'before';
        $templateName = ($depositMode === 'after')
            ? 'accounting.pdf.invoice.invoice-deposit-after'
            : 'accounting.pdf.invoice.invoice-master';

        $html = View::make($templateName, $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        $this->renderSignatureAdaptive($mpdf, $viewData);

        return $mpdf;
    }

    protected function cssFiles(): array
    {
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/invoice/invoice-master.css'),
            resource_path('views/pdf/partials/invoice-header.css'),
        ];
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];
        $summary  = $data['summary'] ?? [];

        $headerHtml = View::make('accounting.pdf.tax-invoice.partials.tax-header', compact(
            'invoice', 'customer', 'isFinal', 'summary'
        ))->render();

        $footerHtml = View::make('accounting.pdf.invoice.partials.invoice-footer', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml);

        if (!$isFinal && ($data['options']['showWatermark'] ?? true)) {
            $mpdf->SetWatermarkText('PREVIEW', 0.1);
            $mpdf->showWatermarkText = true;
        }
    }

    protected function savePdfFile(Mpdf $mpdf, Invoice $invoice, array $options = []): string
    {
        $timestamp = now()->format('Y-m-d-His');
        $headerType = $options['document_header_type'] ?? $invoice->document_header_type ?? 'ต้นฉบับ';
        $headerSlug = $this->slugHeaderType($headerType);
        $filename = sprintf('tax-invoice-%s-%s-%s.pdf',
            $invoice->number ?? $invoice->id,
            $headerSlug,
            $timestamp
        );

        $directory = storage_path('app/public/pdfs/tax-invoices');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filePath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($filePath, 'F');

        return $filePath;
    }
}
