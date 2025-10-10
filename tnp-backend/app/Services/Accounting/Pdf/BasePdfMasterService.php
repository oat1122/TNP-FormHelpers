<?php

namespace App\Services\Accounting\Pdf;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;
use Symfony\Component\HttpFoundation\Response;

/**
 * คลาสแม่สำหรับ PDF Services ทั้งหมด
 * - จัดการการตั้งค่า mPDF ที่ใช้ร่วมกัน
 * - จัดการกระบวนการสร้าง, บันทึก, และ stream PDF
 * - มีระบบวางลายเซ็นท้ายหน้าแบบ Adaptive
 */
abstract class BasePdfMasterService
{
    /**
     * สร้าง PDF เป็นไฟล์ใน storage พร้อม URL
     *
     * @param object $model      (เช่น Quotation, Invoice)
     * @param array<string, mixed> $options
     * @return array{path:string,url:string,filename:string,size:int,type:string}
     */
    public function generatePdf(object $model, array $options = []): array
    {
        try {
            $viewData = $this->buildViewData($model, $options);
            $mpdf = $this->createMpdf($viewData);
            $filePath = $this->savePdfFile($mpdf, $viewData);

            return [
                'path'     => $filePath,
                'url'      => $this->generatePublicUrl($filePath),
                'filename' => basename($filePath),
                'size'     => is_file($filePath) ? filesize($filePath) : 0,
                'type'     => $viewData['isFinal'] ? 'final' : 'preview',
            ];
        } catch (\Throwable $e) {
            Log::error(static::class.'::generatePdf error: '.$e->getMessage(), [
                'model_id' => $model->id ?? null,
                'model_number' => $model->number ?? 'N/A',
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Stream PDF แสดงบนเบราว์เซอร์ทันที
     */
    public function streamPdf(object $model, array $options = []): Response
    {
        $viewData = $this->buildViewData($model, $options);
        $mpdf = $this->createMpdf($viewData);
        $filename = sprintf('%s-%s.pdf', $this->getFilenamePrefix(), $model->number ?? $model->id);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="'.$filename.'"');
    }

    // =======================================================================
    // |  Abstract Methods (คลาสลูกต้อง implement)
    // =======================================================================

    /**
     * เตรียมข้อมูลสำหรับ View
     * @return array<string, mixed>
     */
    abstract protected function buildViewData(object $model, array $options = []): array;

    /**
     * กำหนด Header และ Footer
     */
    abstract protected function addHeaderFooter(Mpdf $mpdf, array $data): void;

    /**
     * ระบุรายการไฟล์ CSS
     * @return array<string>
     */
    abstract protected function cssFiles(): array;

    /**
     * ชื่อไฟล์ Prefix (เช่น 'invoice', 'quotation')
     */
    abstract protected function getFilenamePrefix(): string;

    /**
     * Path ของ View Template หลัก
     */
    abstract protected function getTemplatePath(array $viewData): string;

    // =======================================================================
    // |  Core Mpdf Creation
    // =======================================================================

    protected function createMpdf(array $viewData): Mpdf
    {
        $mpdf = new Mpdf($this->getMpdfConfig($viewData['options'] ?? []));
        $this->configureMpdfInstance($mpdf);

        // 1) CSS
        $this->writeCss($mpdf, $this->cssFiles());

        // 2) Header/Footer + Watermark
        $this->addHeaderFooter($mpdf, $viewData);

        // 3) Body
        $html = View::make($this->getTemplatePath($viewData), $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        // 4) Render signature at the bottom of the last page (adaptive)
        if ($this->shouldRenderSignature()) {
            $this->renderSignatureAdaptive($mpdf, $viewData);
        }

        return $mpdf;
    }

    protected function getMpdfConfig(array $options): array
    {
        $defaultConfig = (new ConfigVariables())->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];
        $defaultFontConfig = (new FontVariables())->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

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
            'mode' => 'utf-8',
            'format' => $options['format'] ?? 'A4',
            'orientation' => $options['orientation'] ?? 'P',
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 16,
            'margin_bottom' => 14,
            'setAutoTopMargin' => 'stretch',
            'setAutoBottomMargin' => 'stretch',
            'default_font' => $hasThaiFonts ? 'thsarabun' : 'dejavusans',
            'default_font_size' => 12,
            'fontDir' => $hasThaiFonts ? array_merge($fontDirs, [$customFontDir]) : $fontDirs,
            'fontdata' => $hasThaiFonts ? ($fontData + $customFontData) : $fontData,
            'tempDir' => storage_path('app/mpdf-temp'),
            'curlAllowUnsafeSslRequests' => true,
            'useOTL' => 0xFF,
            'useKerning' => true,
            'autoLangToFont' => true,
            'autoScriptToLang' => true,
        ];

        if (!is_dir($config['tempDir'])) {
            @mkdir($config['tempDir'], 0755, true);
        }
        return $config;
    }

    protected function configureMpdfInstance(Mpdf $mpdf): void
    {
        $mpdf->curlTimeout = 5;
        $mpdf->curlExecutionTimeout = 5;
        $mpdf->curlFollowLocation = true;
        $mpdf->curlAllowUnsafeSslRequests = true;
        $mpdf->img_dpi = 96;
        $mpdf->interpolateImages = true;
        if (property_exists($mpdf, 'jpeg_quality')) {
            $mpdf->jpeg_quality = 90;
        }
    }

    // =======================================================================
    // |  Signature Placement Logic
    // =======================================================================

    /**
     * กำหนดว่าจะแสดงลายเซ็นหรือไม่ (บางเอกสารอาจไม่ต้องการ)
     */
    protected function shouldRenderSignature(): bool
    {
        return true;
    }

    protected function renderSignatureAdaptive(Mpdf $mpdf, array $data): void
    {
        try {
            $signatureDimensions = $this->calculateSignatureDimensions($mpdf);
            $requiredHeight = $signatureDimensions['height'];
            $bottomPadding  = $signatureDimensions['padding'];

            $pageInfo  = $this->getAccuratePageInfo($mpdf);
            $remaining = $pageInfo['remaining'];

            $sigHtml = View::make($this->getSignatureTemplatePath(), $data)->render();
            $signaturePlaced = false;

            if ($remaining >= ($requiredHeight + $bottomPadding)) {
                $signaturePlaced = $this->placeSignatureOnCurrentPage($mpdf, $sigHtml, $remaining, $requiredHeight, $bottomPadding);
            }

            if (!$signaturePlaced) {
                $signaturePlaced = $this->placeSignatureOnNewPage($mpdf, $sigHtml, $requiredHeight, $bottomPadding);
            }

            if (!$signaturePlaced) {
                $this->emergencySignaturePlacement($mpdf, $sigHtml, $data);
            }

        } catch (\Throwable $e) {
            Log::error(static::class.' Signature adaptive render failed: '.$e->getMessage(), [
                'model_id' => $data[strtolower($this->getFilenamePrefix())]->id ?? 'unknown',
                'trace' => $e->getTraceAsString(),
            ]);
            $this->emergencySignaturePlacement($mpdf, View::make($this->getSignatureTemplatePath(), $data)->render(), $data);
        }
    }

    protected function getSignatureTemplatePath(): string
    {
        // Default signature, can be overridden by child class
        return 'pdf.partials.default-signature'; 
    }

    protected function calculateSignatureDimensions(Mpdf $mpdf): array
    {
        // Estimate signature section height based on PDF dimensions
        $pageHeight = $mpdf->h; // Page height in mm
        $estimatedHeight = min(40, $pageHeight * 0.15); // 15% of page height, max 40mm
        $padding = min(10, $pageHeight * 0.05); // 5% of page height, max 10mm

        return [
            'height' => $estimatedHeight,
            'padding' => $padding,
        ];
    }

    protected function getAccuratePageInfo(Mpdf $mpdf): array
    {
        $pageHeight = $mpdf->h;
        $currentY = $mpdf->y;
        $bottomMargin = $mpdf->bMargin;
        
        $usableBottom = $pageHeight - $bottomMargin;
        $remaining = $usableBottom - $currentY;
        
        return [
            'page_height' => $pageHeight,
            'current_y' => $currentY,
            'bottom_margin' => $bottomMargin,
            'usable_bottom' => $usableBottom,
            'remaining' => max(0, $remaining),
        ];
    }

    protected function placeSignatureOnCurrentPage(Mpdf $mpdf, string $sigHtml, float $remaining, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            // Add some spacing before signature
            $mpdf->WriteHTML('<div style="margin-top: 10mm;"></div>', HTMLParserMode::HTML_BODY);
            $mpdf->WriteHTML($sigHtml, HTMLParserMode::HTML_BODY);
            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place signature on current page: ' . $e->getMessage());
            return false;
        }
    }

    protected function placeSignatureOnNewPage(Mpdf $mpdf, string $sigHtml, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            $mpdf->AddPage();
            $mpdf->WriteHTML($sigHtml, HTMLParserMode::HTML_BODY);
            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place signature on new page: ' . $e->getMessage());
            return false;
        }
    }

    protected function emergencySignaturePlacement(Mpdf $mpdf, string $sigHtml, array $data): void
    {
        try {
            // Last resort: just try to add it as-is
            $mpdf->WriteHTML('<div style="page-break-before: always;"></div>' . $sigHtml, HTMLParserMode::HTML_BODY);
        } catch (\Throwable $e) {
            Log::error('Emergency signature placement also failed: ' . $e->getMessage());
        }
    }

    // =======================================================================
    // |  File & System Helpers
    // =======================================================================

    protected function savePdfFile(Mpdf $mpdf, array $viewData): string
    {
        $model = $viewData[strtolower($this->getFilenamePrefix())];
        $directory = storage_path('app/public/pdfs/' . $this->getStorageFolder());

        if (!is_dir($directory)) {
            @mkdir($directory, 0755, true);
        }

        $filename = sprintf('%s-%s-%s.pdf', $this->getFilenamePrefix(), $model->number ?? $model->id, date('Y-m-d-His'));
        $fullPath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($fullPath, 'F');
        return $fullPath;
    }

    protected function getStorageFolder(): string
    {
        // e.g., 'invoices', 'quotations'
        return $this->getFilenamePrefix() . 's';
    }

    protected function generatePublicUrl(string $filePath): string
    {
        $relative = str_replace(storage_path('app/public/'), '', $filePath);
        $relative = str_replace('\\', '/', $relative);
        return url('storage/' . $relative);
    }

    protected function writeCss(Mpdf $mpdf, array $files): void
    {
        foreach ($files as $file) {
            if ($file && is_file($file)) {
                $mpdf->WriteHTML(file_get_contents($file), HTMLParserMode::HEADER_CSS);
            }
        }
    }

    public function checkSystemStatus(): array
    {
        $status = [
            'mpdf_available'       => class_exists(Mpdf::class),
            'thai_fonts_available' => $this->checkThaiFonts(),
            'storage_writable'     => is_writable(storage_path('app/public/pdfs/' . $this->getStorageFolder())),
            'temp_dir_writable'    => is_writable(storage_path('app/mpdf-temp')) || @mkdir(storage_path('app/mpdf-temp'), 0755, true),
        ];
        
        return $status;
    }

    protected function checkThaiFonts(): bool
    {
        $fontPath = config('pdf.custom_font_dir', public_path('fonts/thsarabun/'));
        $required = ['Sarabun-Regular.ttf', 'Sarabun-Bold.ttf'];
        foreach ($required as $f) { 
            if (!is_file($fontPath.$f)) { 
                return false; 
            } 
        }
        return true;
    }
}