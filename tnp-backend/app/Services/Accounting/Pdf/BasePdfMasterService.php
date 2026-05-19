<?php

namespace App\Services\Accounting\Pdf;

use App\Services\Accounting\PdfCacheService;
use Illuminate\Support\Facades\Cache;
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
 * - รองรับ PDF Caching เพื่อลดการสร้าง PDF ซ้ำๆ
 */
abstract class BasePdfMasterService
{
    /**
     * PDF Cache Service instance
     */
    protected ?PdfCacheService $cacheService = null;

    /**
     * Get or initialize cache service (lazy loading)
     */
    protected function getCacheService(): PdfCacheService
    {
        if (! $this->cacheService) {
            $this->cacheService = app(PdfCacheService::class);
        }

        return $this->cacheService;
    }

    /**
     * สร้าง PDF เป็นไฟล์ใน storage พร้อม URL (with caching support)
     *
     * @param  object  $model  (เช่น Quotation, Invoice)
     * @param  array<string, mixed>  $options
     * @param  bool  $useCache  Whether to use cache (default: true)
     * @return array{path:string,url:string,filename:string,size:int,type:string,from_cache:bool}
     */
    public function generatePdf(object $model, array $options = [], bool $useCache = true): array
    {
        try {
            // Get document type for cache lookup
            $documentType = $this->getDocumentTypeFromModel($model);

            // Fast cache check (no lock) — happy path serves cached PDFs without contention.
            if ($useCache && ! ($options['force_regenerate'] ?? false)) {
                $cachedPdf = $this->getCacheService()->getCached($documentType, $model->id, $options);

                if ($cachedPdf) {
                    return $this->packCachedResult($cachedPdf, $documentType, $model);
                }
            }

            // MISS path: wrap generate+store in a per-document lock to prevent
            // concurrent requests from regenerating the same PDF in parallel
            // and creating duplicate cache rows. Cache::lock relies on the
            // default cache driver — file in dev (sync), redis in prod.
            if ($useCache) {
                return $this->generateWithStampedeLock($model, $options, $documentType);
            }

            return $this->doGenerateAndStore($model, $options, $documentType, false);

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
     * Acquire a short-lived lock keyed by document, then re-check the cache
     * before generating. Whichever worker acquires the lock first does the
     * heavy mPDF render; subsequent waiters return the cache HIT.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function generateWithStampedeLock(object $model, array $options, string $documentType): array
    {
        $lockKey = sprintf('pdf-cache-lock:%s:%s', $documentType, $model->id);
        $lock = Cache::lock($lockKey, 60);

        try {
            // Wait up to 15s for a peer worker to finish; on timeout fall
            // through to generate anyway so the request still completes.
            $acquired = $lock->block(15);
        } catch (\Throwable $e) {
            $acquired = false;
        }

        try {
            if ($acquired) {
                // Double-check: another worker may have populated the cache
                // while we were blocked on the lock.
                $cachedPdf = $this->getCacheService()->getCached($documentType, $model->id, $options);
                if ($cachedPdf) {
                    return $this->packCachedResult($cachedPdf, $documentType, $model);
                }
            }

            return $this->doGenerateAndStore($model, $options, $documentType, true);
        } finally {
            if ($acquired) {
                optional($lock)->release();
            }
        }
    }

    /**
     * Render the PDF and (optionally) persist it into the cache.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function doGenerateAndStore(object $model, array $options, string $documentType, bool $useCache): array
    {
        $viewData = $this->buildViewData($model, $options);
        $mpdf = $this->createMpdf($viewData);
        $filePath = $this->savePdfFile($mpdf, $viewData);

        $result = [
            'path' => $filePath,
            'url' => $this->generatePublicUrl($filePath),
            'filename' => basename($filePath),
            'size' => is_file($filePath) ? filesize($filePath) : 0,
            'type' => $viewData['isFinal'] ? 'final' : 'preview',
            'engine' => 'mPDF',
            'from_cache' => false,
        ];

        if ($useCache) {
            try {
                $cacheService = $this->getCacheService();
                $cacheData = $cacheService->store($model, $filePath, $options, $documentType);
                $result['cache_stored'] = true;
                $result['expires_at'] = $cacheData['expires_at'];
                // Reuse the memoized version computed during store() — avoids
                // a third hash on the generate flow.
                $result['cache_version'] = $cacheService->calculateCacheVersion($model);

                Log::info('PDF stored in cache', [
                    'document_type' => $documentType,
                    'document_id' => $model->id,
                    'cache_path' => $cacheData['path'],
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to store PDF in cache: '.$e->getMessage());
                $result['cache_stored'] = false;
            }
        }

        return $result;
    }

    /**
     * Shape the cache-HIT payload to match the post-generate result contract.
     *
     * @param  array<string, mixed>  $cachedPdf
     * @return array<string, mixed>
     */
    private function packCachedResult(array $cachedPdf, string $documentType, object $model): array
    {
        Log::info('PDF Cache HIT - returning cached PDF', [
            'document_type' => $documentType,
            'document_id' => $model->id,
            'cached_at' => $cachedPdf['cached_at'],
        ]);

        return [
            'path' => $cachedPdf['path'],
            'url' => $cachedPdf['url'],
            'filename' => $cachedPdf['filename'],
            'size' => $cachedPdf['size'],
            'type' => 'cached',
            'engine' => 'mPDF',
            'from_cache' => true,
            'cached_at' => $cachedPdf['cached_at'],
            'expires_at' => $cachedPdf['expires_at'],
            'cache_version' => $cachedPdf['cache_version'],
        ];
    }

    /**
     * Get document type from model instance for cache-key segregation.
     *
     * Receipt + TaxInvoice + Invoice all share the `Invoice` model class, so
     * class-name matching alone collapses them onto the same cache key. Each
     * service overrides `getFilenamePrefix()` with a unique value
     * (`invoice`, `receipt`, `receipt-full`, `tax-invoice`, `tax-invoice-full`)
     * — reuse it here to keep cache keys unique per service variant.
     */
    protected function getDocumentTypeFromModel(object $model): string
    {
        return str_replace('-', '_', $this->getFilenamePrefix());
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
     *
     * @return array<string, mixed>
     */
    abstract protected function buildViewData(object $model, array $options = []): array;

    /**
     * กำหนด Header และ Footer
     */
    abstract protected function addHeaderFooter(Mpdf $mpdf, array $data): void;

    /**
     * ระบุรายการไฟล์ CSS
     *
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

    /**
     * Path ของ View Template สำหรับลายเซ็น
     */
    abstract protected function getSignatureTemplatePath(): string;

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
        $this->renderSignatureAdaptive($mpdf, $viewData);

        return $mpdf;
    }

    protected function getMpdfConfig(array $options = []): array
    {
        $defaultConfig = (new ConfigVariables)->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];
        $defaultFontConfig = (new FontVariables)->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

        $customFontDir = config('pdf.custom_font_dir', public_path('fonts/thsarabun/'));
        $customFontData = config('pdf.custom_font_data', [
            'thsarabun' => [
                'R' => 'Sarabun-Regular.ttf',
                'B' => 'Sarabun-Bold.ttf',
                'I' => 'Sarabun-Italic.ttf',
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
            'margin_bottom' => 10,
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

        if (! is_dir($config['tempDir'])) {
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
    // |  File & System Helpers
    // =======================================================================

    protected function savePdfFile(Mpdf $mpdf, array $viewData): string
    {
        $model = $viewData[strtolower($this->getFilenamePrefix())];
        $directory = storage_path('app/public/pdfs/'.$this->getStorageFolder());

        if (! is_dir($directory)) {
            @mkdir($directory, 0755, true);
        }

        $filename = sprintf('%s-%s-%s.pdf', $this->getFilenamePrefix(), $model->number ?? $model->id, date('Y-m-d-His'));
        $fullPath = $directory.DIRECTORY_SEPARATOR.$filename;
        $mpdf->Output($fullPath, 'F');

        return $fullPath;
    }

    protected function getStorageFolder(): string
    {
        // e.g., 'invoices', 'quotations'
        return $this->getFilenamePrefix().'s';
    }

    protected function generatePublicUrl(string $filePath): string
    {
        $relative = str_replace(storage_path('app/public/'), '', $filePath);
        $relative = str_replace('\\', '/', $relative);

        return url('storage/'.$relative);
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
            'mpdf_available' => class_exists(Mpdf::class),
            'thai_fonts_available' => $this->checkThaiFonts(),
            'storage_writable' => is_writable(storage_path('app/public/pdfs/'.$this->getStorageFolder())),
            'temp_dir_writable' => is_writable(storage_path('app/mpdf-temp')) || @mkdir(storage_path('app/mpdf-temp'), 0755, true),
        ];

        return $status;
    }

    protected function checkThaiFonts(): bool
    {
        $fontPath = config('pdf.custom_font_dir', public_path('fonts/thsarabun/'));
        $required = ['Sarabun-Regular.ttf', 'Sarabun-Bold.ttf'];
        foreach ($required as $f) {
            if (! is_file($fontPath.$f)) {
                return false;
            }
        }

        return true;
    }

    // =======================================================================
    // |  Absolute Signature Rendering (Fixed Position)
    // =======================================================================

    /**
     * Render a signature section at a fixed position on the LAST page.
     * This renders *ABOVE* the footer (which is handled by SetHTMLFooter in child classes)
     *
     * Layout numbers (after 2026-05-05 hotfix per user feedback "ลายเซ็นติดเส้น page-bottom"):
     * - Footer margin: 10mm (footer with border-top line renders here)
     * - Signature bottom edge: 25mm from page bottom → ~15mm visual gap above footer-top line
     * - Signature height: 30mm → top edge at 55mm from page bottom
     * - Body spacer: 45mm reserved at end of content (page-break-inside: avoid) so flow doesn't push into signature area
     */
    protected function renderSignatureAdaptive(Mpdf $mpdf, array $data): void
    {
        try {
            // 1. Render HTML ลายเซ็นจากคลาสลูก (เช่น quotation-signature, invoice-signature)
            $sigHtml = View::make($this->getSignatureTemplatePath(), $data)->render();

            // 2. ความสูงของลายเซ็น (ครอบคลุม 220×70pt box + label/date lines)
            $signature_height_mm = 30;

            // 3. ตำแหน่ง bottom — ห่างจาก footer top 15mm เพื่อกัน "ติดเส้น" ที่ user รายงาน
            //    Footer occupies 0–10mm; signature bottom 25mm → 15mm air above footer border
            $bottom_position_mm = 25;

            /*
             * ภาพประกอบการวางตำแหน่ง:
             * |-------------------|
             * | (Body Content)    |
             * |                   |
             * | [Spacer 45mm]     | <--- จองพื้นที่ในเนื้อหา (page-break-inside: avoid)
             * |                   |     ครอบคลุม 10mm–55mm จาก page bottom
             * | (ลายเซ็น $sigHtml) | <--- สูง 30mm (position: absolute, bottom: 25mm)
             * |                   |     ขนาด: 10pt font, 220×70pt box
             * |-------------------| ขอบล่าง Margin (10mm) — footer border-top อยู่ที่นี่
             * | (Footer เลขหน้า)   | <--- SetHTMLFooter แสดงผลในพื้นที่นี้
             * |-------------------| ขอบล่างกระดาษ (0mm)
             *
             * Gap signature ↔ footer line ≈ 15mm — ไม่ติดเส้น look professional
             */

            // 4. สร้าง HTML wrapper (เฉพาะลายเซ็นชุดเดียว - ไม่ซ้ำซ้อน)
            $wrapper = sprintf(
                '<div style="position: absolute; width: 98%%; left: 1%%; bottom: %.2fmm; height: %.2fmm; page-break-inside: avoid;" class="signature-absolute-wrapper">
                    %s
                </div>',
                $bottom_position_mm,
                $signature_height_mm,
                $sigHtml
            );

            // 5. เขียน HTML ลงไป (mPDF จะวางไว้ในหน้าสุดท้าย)
            $mpdf->WriteHTML($wrapper, HTMLParserMode::HTML_BODY);

        } catch (\Throwable $e) {
            Log::error('Signature absolute placement failed: '.$e->getMessage(), [
                'model_id' => $data[strtolower($this->getFilenamePrefix())]->id ?? 'unknown',
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    // =======================================================================
    // |  Document Metadata Helpers
    // =======================================================================

    /**
     * Get document metadata for PDF header (document number, reference number, mode)
     * This method extracts the appropriate numbers based on document type and mode
     *
     * @param  object  $document  Invoice, Quotation, etc.
     * @param  string  $documentType  'invoice' | 'tax_invoice' | 'receipt'
     * @return array ['docNumber' => string, 'referenceNo' => string|null, 'mode' => string]
     */
    protected function getDocumentMetadata(object $document, string $documentType, array $options = []): array
    {
        // Determine mode from options or document's deposit_display_order
        $mode = $options['deposit_mode'] ?? $document->deposit_display_order ?? 'before';

        // Get appropriate document number using the model's method
        $docNumber = method_exists($document, 'getDocumentNumber')
            ? $document->getDocumentNumber($documentType, $mode)
            : ($document->number ?? 'DRAFT');

        // Get reference number using the model's method
        $referenceNo = method_exists($document, 'getReferenceNumber')
            ? $document->getReferenceNumber($mode)
            : null;

        return [
            'docNumber' => $docNumber,
            'referenceNo' => $referenceNo,
            'mode' => $mode,
        ];
    }
}
