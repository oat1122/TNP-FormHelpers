<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanupInvoiceEvidenceFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoice:cleanup-evidence {--dry-run : Show what would be changed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up corrupted evidence_files structure in invoices table';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        $this->info('Starting invoice evidence_files structure cleanup...');
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }
        
        $processedCount = 0;
        $changedCount = 0;
        $errorCount = 0;

        // Process invoices in chunks to avoid memory issues
        DB::table('invoices')
            ->whereNotNull('evidence_files')
            ->where('evidence_files', '!=', '')
            ->orderBy('id')
            ->chunk(100, function ($invoices) use (&$processedCount, &$changedCount, &$errorCount, $dryRun) {
                foreach ($invoices as $invoice) {
                    try {
                        $originalData = $invoice->evidence_files;
                        $cleaned = $this->cleanEvidenceStructure($originalData);
                        
                        if (json_encode($cleaned) !== $originalData) {
                            $this->info("Invoice {$invoice->id} ({$invoice->number}) needs cleanup:");
                            $this->line("  Before: " . substr($originalData, 0, 100) . '...');
                            $this->line("  After: " . json_encode($cleaned));
                            
                            if (!$dryRun) {
                                DB::table('invoices')
                                    ->where('id', $invoice->id)
                                    ->update([
                                        'evidence_files' => json_encode($cleaned),
                                        'updated_at' => now()
                                    ]);
                                
                                $this->info("  ✓ Updated");
                            } else {
                                $this->warn("  → Would be updated (dry run)");
                            }
                            
                            $changedCount++;
                        }
                        
                        $processedCount++;
                    } catch (\Exception $e) {
                        $errorCount++;
                        $this->error("Error processing invoice {$invoice->id}: " . $e->getMessage());
                    }
                }
            });

        $this->info("\nCleanup completed!");
        $this->table(['Metric', 'Count'], [
            ['Processed', $processedCount],
            ['Changed', $changedCount],
            ['Errors', $errorCount]
        ]);

        if ($dryRun && $changedCount > 0) {
            $this->warn("\nRe-run without --dry-run to apply changes");
        }

        return 0;
    }

    /**
     * Clean and normalize evidence structure
     */
    private function cleanEvidenceStructure($evidenceData)
    {
        // Initialize clean structure
        $normalized = ['before' => [], 'after' => []];

        if (!$evidenceData) {
            return $normalized;
        }

        // Handle string JSON
        if (is_string($evidenceData)) {
            $decoded = json_decode($evidenceData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return $normalized;
            }
            $evidenceData = $decoded;
        }

        // Handle array (legacy format)
        if (is_array($evidenceData) && !isset($evidenceData['before']) && !isset($evidenceData['after'])) {
            // Legacy array - treat as 'before' mode
            $normalized['before'] = array_values(array_unique(array_filter($evidenceData, function($item) {
                return is_string($item) && strpos($item, 'inv_') === 0;
            })));
            return $normalized;
        }

        // Handle object/array with structure
        if (is_array($evidenceData)) {
            // Extract files from nested/corrupted structure
            $beforeFiles = $this->extractFilesFromNestedStructure($evidenceData, 'before');
            $afterFiles = $this->extractFilesFromNestedStructure($evidenceData, 'after');
            
            $normalized['before'] = array_values(array_unique(array_filter($beforeFiles, function($item) {
                return is_string($item) && strpos($item, 'inv_') === 0;
            })));
            
            $normalized['after'] = array_values(array_unique(array_filter($afterFiles, function($item) {
                return is_string($item) && strpos($item, 'inv_') === 0;
            })));
        }

        return $normalized;
    }

    /**
     * Recursively extract files from nested/corrupted evidence structure
     */
    private function extractFilesFromNestedStructure($data, $mode)
    {
        $files = [];
        
        if (!is_array($data)) {
            return $files;
        }

        // Direct mode access
        if (isset($data[$mode])) {
            if (is_array($data[$mode])) {
                foreach ($data[$mode] as $item) {
                    if (is_string($item) && strpos($item, 'inv_') === 0) {
                        $files[] = $item;
                    } elseif (is_array($item)) {
                        // Recursive extraction for nested arrays
                        $files = array_merge($files, $this->extractFilesFromNestedStructure($item, $mode));
                    }
                }
            } elseif (is_string($data[$mode]) && strpos($data[$mode], 'inv_') === 0) {
                $files[] = $data[$mode];
            }
        }

        // Look for files in numeric keys (corruption artifacts)
        foreach ($data as $key => $value) {
            if (is_numeric($key) && is_string($value) && strpos($value, 'inv_') === 0) {
                // Determine mode from filename pattern
                if (strpos($value, "_{$mode}_") !== false) {
                    $files[] = $value;
                }
            }
        }

        // Recursive search in nested objects
        foreach ($data as $value) {
            if (is_array($value)) {
                $files = array_merge($files, $this->extractFilesFromNestedStructure($value, $mode));
            }
        }

        return $files;
    }
}