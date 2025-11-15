<?php

namespace App\Console\Commands;

use App\Services\PdfImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupPdfImageCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdf:cleanup-cache 
                            {--days=30 : Delete cached images older than N days}
                            {--dry-run : Show what would be deleted without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up optimized PDF image cache based on age';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $days = (int) $this->option('days');
        
        $this->info('Starting PDF image cache cleanup...');
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }
        
        $cachePath = config('pdf.image_optimization.cache_path', storage_path('app/pdf-images-cache'));
        
        if (!is_dir($cachePath)) {
            $this->warn("Cache directory does not exist: {$cachePath}");
            return Command::SUCCESS;
        }

        $this->info("Cache directory: {$cachePath}");
        $this->info("Deleting files older than {$days} days...");
        $this->newLine();

        $cutoffTime = time() - ($days * 24 * 60 * 60);
        $files = glob($cachePath . DIRECTORY_SEPARATOR . '*');
        
        $deleteCount = 0;
        $deleteSize = 0;
        $keepCount = 0;
        $keepSize = 0;

        foreach ($files as $file) {
            if (!is_file($file)) {
                continue;
            }

            $fileTime = filemtime($file);
            $fileSize = filesize($file);
            $age = round((time() - $fileTime) / (24 * 60 * 60), 1);

            if ($fileTime < $cutoffTime) {
                $deleteCount++;
                $deleteSize += $fileSize;
                
                if ($this->output->isVerbose()) {
                    $this->line("  [DELETE] " . basename($file) . " ({$this->formatBytes($fileSize)}, {$age} days old)");
                }
                
                if (!$dryRun) {
                    @unlink($file);
                }
            } else {
                $keepCount++;
                $keepSize += $fileSize;
                
                if ($this->output->isVeryVerbose()) {
                    $this->line("  [KEEP]   " . basename($file) . " ({$this->formatBytes($fileSize)}, {$age} days old)");
                }
            }
        }

        $this->newLine();
        $this->info('Summary:');
        $this->table(
            ['Status', 'Files', 'Size'],
            [
                ['To Delete', $deleteCount, $this->formatBytes($deleteSize)],
                ['To Keep', $keepCount, $this->formatBytes($keepSize)],
                ['Total', $deleteCount + $keepCount, $this->formatBytes($deleteSize + $keepSize)],
            ]
        );

        if ($dryRun && $deleteCount > 0) {
            $this->newLine();
            $this->comment('Run without --dry-run flag to actually delete these files.');
        } elseif (!$dryRun && $deleteCount > 0) {
            $this->newLine();
            $this->info("✓ Successfully deleted {$deleteCount} cached image(s), freed {$this->formatBytes($deleteSize)}");
            
            Log::info('PDF image cache cleanup completed', [
                'deleted_count' => $deleteCount,
                'deleted_size' => $deleteSize,
                'days' => $days
            ]);
        } else {
            $this->newLine();
            $this->info('✓ No files to delete.');
        }

        return Command::SUCCESS;
    }

    /**
     * Format bytes to human-readable format
     *
     * @param int $bytes
     * @return string
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $pow = floor(log($bytes, 1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
