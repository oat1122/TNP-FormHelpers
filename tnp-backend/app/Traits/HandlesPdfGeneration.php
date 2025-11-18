<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Trait HandlesPdfGeneration
 * 
 * Provides reusable methods for PDF generation, streaming, and downloading
 * across multiple controllers (QuotationController, InvoiceController, etc.)
 */
trait HandlesPdfGeneration
{
    /**
     * Extract PDF options from request
     * 
     * @param Request $request
     * @return array
     */
    protected function extractPdfOptions(Request $request): array
    {
        $options = $request->only(['format', 'orientation', 'showWatermark', 'document_header_type', 'deposit_mode']);
        
        // Check for force regenerate flag
        $options['force_regenerate'] = $request->query('force_regenerate', false) || 
                                       $request->input('force_regenerate', false);
        
        return $options;
    }

    /**
     * Generate PDF and return JSON response
     * 
     * @param object $service Service instance with generatePdf method
     * @param string|int $id Resource ID
     * @param array $options PDF generation options
     * @return JsonResponse
     */
    protected function generatePdfJsonResponse($service, $id, array $options = []): JsonResponse
    {
        try {
            $useCache = !($options['force_regenerate'] ?? false);
            $result = $service->generatePdf($id, $options, $useCache);
            
            $response = [
                'success' => true,
                'pdf_url' => $result['url'] ?? null,
                'filename' => $result['filename'] ?? null,
                'size' => $result['size'] ?? null,
                'type' => $result['type'] ?? null,
                'engine' => $result['engine'] ?? 'mPDF',
                'cached' => $result['from_cache'] ?? false,
                'cache_expires_at' => $result['expires_at'] ?? null,
                'data' => $result,
                'message' => $this->generatePdfMessage($result)
            ];
            
            // Add HTTP cache headers
            return response()->json($response)
                ->header('Cache-Control', 'public, max-age=' . $this->getCacheMaxAge($result))
                ->header('ETag', $this->generateETag($result))
                ->header('Last-Modified', $this->getLastModified($result));
                
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_type' => 'pdf_generation_failed'
            ], 500);
        }
    }
    
    /**
     * Generate appropriate message based on PDF generation result
     * 
     * @param array $result
     * @return string
     */
    protected function generatePdfMessage(array $result): string
    {
        if ($result['from_cache'] ?? false) {
            return 'PDF loaded from cache';
        }
        
        if (isset($result['engine']) && $result['engine'] === 'fpdf') {
            return 'PDF สร้างด้วย FPDF (fallback) เนื่องจาก mPDF ไม่พร้อมใช้งาน';
        }
        
        return 'PDF สร้างด้วย mPDF สำเร็จ';
    }
    
    /**
     * Get cache max-age for HTTP header
     * 
     * @param array $result
     * @return int seconds
     */
    protected function getCacheMaxAge(array $result): int
    {
        if (!isset($result['expires_at'])) {
            return 1800; // 30 minutes default
        }
        
        $expiresAt = \Carbon\Carbon::parse($result['expires_at']);
        $secondsUntilExpiry = max(0, $expiresAt->diffInSeconds(now()));
        
        return $secondsUntilExpiry;
    }
    
    /**
     * Generate ETag from cache version
     * 
     * @param array $result
     * @return string
     */
    protected function generateETag(array $result): string
    {
        $version = $result['cache_version'] ?? md5($result['filename'] ?? time());
        return '"' . $version . '"';
    }
    
    /**
     * Get Last-Modified header value
     * 
     * @param array $result
     * @return string
     */
    protected function getLastModified(array $result): string
    {
        $cachedAt = $result['cached_at'] ?? now();
        return \Carbon\Carbon::parse($cachedAt)->toRfc7231String();
    }

    /**
     * Stream PDF to browser
     * 
     * @param object $service Service instance with streamPdf method
     * @param string|int $id Resource ID
     * @param array $options PDF generation options
     * @return mixed Response or JsonResponse on error
     */
    protected function streamPdfResponse($service, $id, array $options = [])
    {
        try {
            return $service->streamPdf($id, $options);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถแสดง PDF ได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download PDF file
     * 
     * @param object $service Service instance with generatePdf method
     * @param string|int $id Resource ID
     * @param array $options PDF generation options
     * @param string|null $defaultFilename Default filename if not in result
     * @return mixed Download response or JsonResponse on error
     */
    protected function downloadPdfResponse($service, $id, array $options = [], ?string $defaultFilename = null)
    {
        try {
            $useCache = !($options['force_regenerate'] ?? false);
            $result = $service->generatePdf($id, $options, $useCache);
            $filename = $result['filename'] ?? ($defaultFilename ?? "document-{$id}.pdf");
            $path = $result['path'] ?? null;
            
            if (!$path || !is_file($path)) {
                throw new \Exception('PDF ยังไม่พร้อมดาวน์โหลด');
            }
            
            // Add cache headers to download response
            $response = response()->download($path, $filename, [
                'Content-Type' => 'application/pdf',
                'Cache-Control' => 'public, max-age=' . $this->getCacheMaxAge($result),
                'ETag' => $this->generateETag($result),
                'Last-Modified' => $this->getLastModified($result)
            ]);
            
            return $response;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดาวน์โหลด PDF ได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check PDF system status
     * 
     * @param object $service Service instance with checkPdfSystemStatus method
     * @return JsonResponse
     */
    protected function checkPdfSystemStatusResponse($service): JsonResponse
    {
        try {
            $status = $service->checkPdfSystemStatus();
            
            return response()->json([
                'success' => true,
                'system_ready' => $status['system_ready'] ?? false,
                'preferred_engine' => $status['preferred_engine'] ?? 'FPDF',
                'components' => $status['components'] ?? [],
                'recommendations' => $status['recommendations'] ?? []
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'preferred_engine' => 'FPDF'
            ], 500);
        }
    }

    /**
     * Extract deposit mode from request or invoice
     * 
     * @param Request $request
     * @param object $invoice Invoice model
     * @return string 'before' or 'after'
     */
    protected function extractDepositMode(Request $request, $invoice): string
    {
        $mode = $request->input('mode') ?? $request->query('mode');
        
        if (!in_array($mode, ['before', 'after'])) {
            $mode = $invoice->deposit_display_order ?? 'before';
        }
        
        return $mode;
    }

    /**
     * Generate multiple PDFs with different headers and create ZIP bundle
     * 
     * @param object $pdfService PDF service instance with generatePdf method
     * @param object $model Model instance (Invoice, etc.)
     * @param array $headerTypes Array of header types
     * @param array $options PDF generation options
     * @param string $bundleType Type for naming (e.g., 'invoice', 'tax-invoice', 'receipt')
     * @return JsonResponse|mixed Download response or JSON with ZIP info
     */
    protected function generateMultiHeaderPdfWithZip($pdfService, $model, array $headerTypes, array $options = [], string $bundleType = 'document')
    {
        try {
            // If no header types or single header, generate single PDF
            if (empty($headerTypes) || !is_array($headerTypes) || count($headerTypes) === 1) {
                $headerType = !empty($headerTypes) && is_array($headerTypes) ? $headerTypes[0] : ($model->document_header_type ?? 'ต้นฉบับ');
                $options['document_header_type'] = $headerType;
                
                $result = $pdfService->generatePdf($model, $options);
                $filename = $result['filename'] ?? "{$bundleType}-{$model->id}.pdf";
                
                return response()->json([
                    'success' => true,
                    'mode' => 'single',
                    'pdf_url' => $result['url'] ?? null,
                    'filename' => $filename,
                    'size' => $result['size'] ?? null,
                    'message' => 'PDF generated successfully'
                ]);
            }

            // Multiple headers - generate each PDF
            $files = [];
            foreach ($headerTypes as $headerType) {
                if (!is_string($headerType) || trim($headerType) === '') continue;
                
                $localOptions = $options + ['document_header_type' => $headerType];
                $pdfData = $pdfService->generatePdf($model, $localOptions);
                
                $files[] = [
                    'path' => $pdfData['path'],
                    'filename' => $pdfData['filename'],
                    'url' => $pdfData['url'] ?? null,
                    'size' => $pdfData['size'] ?? null,
                ];
            }

            if (count($files) === 0) {
                throw new \Exception('No valid PDFs generated');
            }

            // Create ZIP bundle
            $modeLabel = isset($options['deposit_mode']) ? $options['deposit_mode'] : 'default';
            $zipDir = storage_path("app/public/pdfs/{$bundleType}s/zips");
            if (!is_dir($zipDir)) @mkdir($zipDir, 0755, true);
            
            $modelNumber = $model->number ?? $model->id;
            $zipName = sprintf('%s-%s-%s-%s.zip', $bundleType, $modelNumber, $modeLabel, now()->format('YmdHis'));
            $zipPath = $zipDir . DIRECTORY_SEPARATOR . $zipName;
            
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                throw new \Exception('ไม่สามารถสร้างไฟล์ ZIP');
            }
            
            foreach ($files as $file) {
                if (is_file($file['path'])) {
                    $zip->addFile($file['path'], $file['filename']);
                }
            }
            $zip->close();
            
            // Return JSON with ZIP info
            $zipUrl = url("storage/pdfs/{$bundleType}s/zips/" . $zipName);
            return response()->json([
                'success' => true,
                'mode' => 'zip',
                'zip_url' => $zipUrl,
                'zip_filename' => $zipName,
                'zip_size' => filesize($zipPath),
                'files' => $files,
                'count' => count($files),
                'message' => 'PDF bundle generated successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF bundle: ' . $e->getMessage()
            ], 500);
        }
    }
}
