<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;

/**
 * PDF Image Optimizer Service
 * 
 * Optimizes images for PDF generation by resizing them to reasonable dimensions
 * to improve mPDF performance and reduce memory usage.
 * Uses Intervention Image v3 with GD driver.
 */
class PdfImageOptimizer
{
    protected ImageManager $imageManager;
    protected array $config;
    protected string $placeholderPath;

    /**
     * Constructor with Dependency Injection
     * 
     * @param ImageManager $imageManager Intervention Image manager instance
     */
    public function __construct(ImageManager $imageManager)
    {
        $this->imageManager = $imageManager;
        $this->config = config('pdf.image_optimization', []);
        $this->placeholderPath = public_path('images/placeholder-image.png');
        
        // Ensure cache directory exists
        $this->ensureCacheDirectory();
    }

    /**
     * Optimize image for PDF generation
     * 
     * @param string $imagePath Absolute path to the original image
     * @return string Path to optimized image (or placeholder on error)
     */
    public function optimizeForPdf(string $imagePath): string
    {
        // Return placeholder if optimization is disabled
        if (!($this->config['enabled'] ?? true)) {
            return $this->getValidImagePath($imagePath);
        }

        // Validate original image exists
        if (!is_file($imagePath)) {
            Log::warning('PdfImageOptimizer: Image file not found', [
                'path' => $imagePath
            ]);
            return $this->placeholderPath;
        }

        try {
            // Check cache first
            $cacheEnabled = $this->config['cache_enabled'] ?? true;
            if ($cacheEnabled) {
                $cachedPath = $this->getCachedImagePath($imagePath);
                if (file_exists($cachedPath)) {
                    return $cachedPath;
                }
            }

            // Load and resize image
            $image = $this->imageManager->read($imagePath);
            
            $maxWidth = $this->config['max_width'] ?? 800;
            $maxHeight = $this->config['max_height'] ?? 800;
            
            // Only resize if image is larger than max dimensions
            if ($image->width() > $maxWidth || $image->height() > $maxHeight) {
                $image->scale(
                    width: $maxWidth,
                    height: $maxHeight
                );
            }

            // Save optimized image
            $outputPath = $cacheEnabled ? $cachedPath : $this->getTempPath();
            $quality = $this->config['jpeg_quality'] ?? 85;
            
            $image->toJpeg($quality)->save($outputPath);

            Log::info('PdfImageOptimizer: Image optimized successfully', [
                'original' => $imagePath,
                'optimized' => $outputPath,
                'original_size' => filesize($imagePath),
                'optimized_size' => filesize($outputPath)
            ]);

            return $outputPath;

        } catch (\Throwable $e) {
            Log::warning('PdfImageOptimizer: Failed to optimize image', [
                'path' => $imagePath,
                'error' => $e->getMessage()
            ]);
            
            // Return placeholder on any error
            return $this->placeholderPath;
        }
    }

    /**
     * Get cached image path based on original file hash
     * 
     * @param string $imagePath Original image path
     * @return string Path to cached image
     */
    protected function getCachedImagePath(string $imagePath): string
    {
        $cachePath = $this->config['cache_path'] ?? storage_path('app/pdf-images-cache');
        $hash = md5_file($imagePath);
        $extension = $this->config['output_format'] ?? 'jpg';
        
        return $cachePath . DIRECTORY_SEPARATOR . $hash . '.' . $extension;
    }

    /**
     * Get temporary path for non-cached optimization
     * 
     * @return string Temporary file path
     */
    protected function getTempPath(): string
    {
        $tempDir = sys_get_temp_dir();
        return $tempDir . DIRECTORY_SEPARATOR . 'pdf_img_' . uniqid() . '.jpg';
    }

    /**
     * Ensure cache directory exists
     */
    protected function ensureCacheDirectory(): void
    {
        $cachePath = $this->config['cache_path'] ?? storage_path('app/pdf-images-cache');
        
        if (!is_dir($cachePath)) {
            @mkdir($cachePath, 0755, true);
        }
    }

    /**
     * Get valid image path or placeholder
     * 
     * @param string $imagePath Original image path
     * @return string Valid image path or placeholder
     */
    protected function getValidImagePath(string $imagePath): string
    {
        if (is_file($imagePath)) {
            return $imagePath;
        }
        
        return $this->placeholderPath;
    }

    /**
     * Clear all cached images
     * 
     * @return array Statistics about cleared cache
     */
    public function clearCache(): array
    {
        $cachePath = $this->config['cache_path'] ?? storage_path('app/pdf-images-cache');
        
        if (!is_dir($cachePath)) {
            return ['count' => 0, 'size' => 0];
        }

        $count = 0;
        $size = 0;
        
        $files = glob($cachePath . DIRECTORY_SEPARATOR . '*');
        foreach ($files as $file) {
            if (is_file($file)) {
                $size += filesize($file);
                @unlink($file);
                $count++;
            }
        }

        return ['count' => $count, 'size' => $size];
    }

    /**
     * Get cache statistics
     * 
     * @return array Cache statistics
     */
    public function getCacheStats(): array
    {
        $cachePath = $this->config['cache_path'] ?? storage_path('app/pdf-images-cache');
        
        if (!is_dir($cachePath)) {
            return ['count' => 0, 'size' => 0];
        }

        $count = 0;
        $size = 0;
        
        $files = glob($cachePath . DIRECTORY_SEPARATOR . '*');
        foreach ($files as $file) {
            if (is_file($file)) {
                $size += filesize($file);
                $count++;
            }
        }

        return ['count' => $count, 'size' => $size];
    }
}
