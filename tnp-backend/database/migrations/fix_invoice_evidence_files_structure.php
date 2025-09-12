<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Fix corrupted evidence_files structure in invoices table
 * This migration cleans up nested/duplicated evidence structures
 */
class FixInvoiceEvidenceFilesStructure extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Log::info('Starting invoice evidence_files structure cleanup...');
        
        $processedCount = 0;
        $errorCount = 0;

        // Process invoices in chunks to avoid memory issues
        DB::table('invoices')
            ->whereNotNull('evidence_files')
            ->where('evidence_files', '!=', '')
            ->orderBy('id')
            ->chunk(100, function ($invoices) use (&$processedCount, &$errorCount) {
                foreach ($invoices as $invoice) {
                    try {
                        $cleaned = $this->cleanEvidenceStructure($invoice->evidence_files);
                        
                        if ($cleaned !== $invoice->evidence_files) {
                            DB::table('invoices')
                                ->where('id', $invoice->id)
                                ->update([
                                    'evidence_files' => json_encode($cleaned),
                                    'updated_at' => now()
                                ]);
                            
                            Log::info("Cleaned evidence structure for invoice {$invoice->id}");
                        }
                        
                        $processedCount++;
                    } catch (\Exception $e) {
                        $errorCount++;
                        Log::error("Error processing invoice {$invoice->id}: " . $e->getMessage());
                    }
                }
            });

        Log::info("Evidence cleanup completed. Processed: {$processedCount}, Errors: {$errorCount}");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // This migration is designed to be safe and irreversible
        // as it only cleans up corrupted data structures
        Log::info('Evidence cleanup migration rollback - no action needed');
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