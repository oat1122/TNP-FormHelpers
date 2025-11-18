<?php

namespace App\Console\Commands;

use App\Services\Accounting\PdfCacheService;
use Illuminate\Console\Command;

/**
 * Display PDF cache statistics
 * 
 * Usage:
 * php artisan pdf:cache-stats
 */
class PdfCacheStats extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdf:cache-stats
                            {--json : Output as JSON}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Display PDF cache statistics and usage information';

    /**
     * PDF Cache Service
     */
    protected PdfCacheService $cacheService;

    /**
     * Create a new command instance
     */
    public function __construct(PdfCacheService $cacheService)
    {
        parent::__construct();
        $this->cacheService = $cacheService;
    }

    /**
     * Execute the console command
     */
    public function handle(): int
    {
        $stats = $this->cacheService->getStatistics();

        if ($this->option('json')) {
            $this->line(json_encode($stats, JSON_PRETTY_PRINT));
            return self::SUCCESS;
        }

        $this->info('📊 PDF Cache Statistics');
        $this->newLine();

        // Overall statistics
        $this->info('📈 Overall Statistics:');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Cached PDFs', number_format($stats['total_entries'])],
                ['Total Size', $this->formatBytes($stats['total_size_bytes'])],
                ['Expired Entries', number_format($stats['expired_count'])],
                ['Cache Hit Rate', $this->calculateHitRate() . '%'],
            ]
        );
        $this->newLine();

        // By document type
        if (!empty($stats['by_document_type'])) {
            $this->info('📄 Breakdown by Document Type:');
            $rows = [];
            foreach ($stats['by_document_type'] as $typeStats) {
                $rows[] = [
                    ucfirst(str_replace('_', ' ', $typeStats['document_type'])),
                    number_format($typeStats['count']),
                    $this->formatBytes($typeStats['size']),
                ];
            }
            $this->table(['Document Type', 'Count', 'Size'], $rows);
            $this->newLine();
        }

        // Storage path
        $this->info('💾 Storage Location:');
        $this->line('   ' . storage_path('app/public/pdfs-cache/'));
        $this->newLine();

        // Recommendations
        $this->info('💡 Recommendations:');
        if ($stats['expired_count'] > 0) {
            $this->warn("   • Run 'php artisan pdf:clear-expired' to free up " . 
                       $this->formatBytes($this->estimateExpiredSize()) . " of disk space");
        }
        if ($stats['total_entries'] > 10000) {
            $this->warn("   • Consider lowering TTL values or increasing cleanup frequency");
        }
        if ($stats['total_entries'] == 0) {
            $this->line("   • No cache entries found. PDFs will be cached on first generation.");
        } else {
            $this->line("   • Cache is working properly! " . number_format($stats['total_entries']) . " PDFs cached.");
        }
        $this->newLine();

        return self::SUCCESS;
    }

    /**
     * Format bytes to human-readable format
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
        
        return number_format($bytes / pow(1024, $power), 2) . ' ' . $units[$power];
    }

    /**
     * Calculate cache hit rate (placeholder - would need actual metrics)
     */
    protected function calculateHitRate(): string
    {
        // This is a placeholder. In production, you'd track actual cache hits/misses
        // and calculate the percentage. For now, return "N/A"
        return 'N/A';
    }

    /**
     * Estimate size of expired entries
     */
    protected function estimateExpiredSize(): int
    {
        $stats = $this->cacheService->getStatistics();
        
        if ($stats['total_entries'] == 0) {
            return 0;
        }
        
        // Rough estimate: expired count / total count * total size
        $ratio = $stats['expired_count'] / $stats['total_entries'];
        return (int) ($stats['total_size_bytes'] * $ratio);
    }
}
