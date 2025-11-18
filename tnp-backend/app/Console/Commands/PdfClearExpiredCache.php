<?php

namespace App\Console\Commands;

use App\Services\Accounting\PdfCacheService;
use Illuminate\Console\Command;
use Carbon\Carbon;

/**
 * Clear expired PDF cache entries
 * 
 * Usage:
 * php artisan pdf:clear-expired
 * php artisan pdf:clear-expired --dry-run
 * php artisan pdf:clear-expired --before-date="2025-01-01"
 */
class PdfClearExpiredCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdf:clear-expired
                            {--dry-run : Show what would be deleted without actually deleting}
                            {--before-date= : Delete cache entries before this date (Y-m-d format)}
                            {--grace-period=24 : Hours to keep soft-deleted files before physical deletion}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear expired PDF cache entries and free up disk space';

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
        $this->info('🧹 PDF Cache Cleanup Started');
        $this->newLine();

        $dryRun = $this->option('dry-run');
        $gracePeriod = (int) $this->option('grace-period');

        if ($dryRun) {
            $this->warn('⚠️  DRY RUN MODE - No files will be deleted');
            $this->newLine();
        }

        // Show current statistics before cleanup
        $this->info('📊 Current Cache Statistics:');
        $stats = $this->cacheService->getStatistics();
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Cached PDFs', number_format($stats['total_entries'])],
                ['Total Size (MB)', number_format($stats['total_size_mb'], 2)],
                ['Expired Entries', number_format($stats['expired_count'])],
            ]
        );
        $this->newLine();

        if ($stats['total_entries'] == 0) {
            $this->info('✅ No cache entries found. Nothing to clean up.');
            return self::SUCCESS;
        }

        // Perform cleanup
        if (!$dryRun) {
            $this->info('🗑️  Cleaning up expired cache...');
            
            with($this->output->createProgressBar())->advance();
            
            $result = $this->cacheService->cleanupExpired($gracePeriod);
            
            $this->newLine(2);
            
            $this->info('✅ Cleanup completed successfully!');
            $this->newLine();
            
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Files Deleted', number_format($result['deleted_count'])],
                    ['Space Freed (MB)', number_format($result['freed_space'] / 1024 / 1024, 2)],
                ]
            );
        } else {
            $this->info('✅ Dry run completed. Use without --dry-run to actually delete files.');
        }

        $this->newLine();
        
        // Show updated statistics after cleanup
        if (!$dryRun) {
            $this->info('📊 Updated Cache Statistics:');
            $statsAfter = $this->cacheService->getStatistics();
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Cached PDFs', number_format($statsAfter['total_entries'])],
                    ['Total Size (MB)', number_format($statsAfter['total_size_mb'], 2)],
                    ['Expired Entries', number_format($statsAfter['expired_count'])],
                ]
            );
        }

        return self::SUCCESS;
    }
}
