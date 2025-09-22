<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;

/**
 * Console command to clean up duplicate document history entries
 * 
 * This command addresses the issue where multiple history entries
 * were created for the same action due to overlapping logging methods
 */
class CleanupDuplicateHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'history:cleanup-duplicates 
                          {--document-type= : Filter by document type (invoice, quotation, receipt, etc.)}
                          {--document-id= : Filter by specific document ID}
                          {--dry-run : Show what would be deleted without actually deleting}
                          {--action= : Filter by specific action (revert_to_draft, status_change, etc.)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up duplicate document history entries that were created due to overlapping logging';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $documentType = $this->option('document-type');
        $documentId = $this->option('document-id');
        $dryRun = $this->option('dry-run');
        $action = $this->option('action');

        $this->info('🧹 Document History Cleanup Tool');
        $this->info('=====================================');

        if ($dryRun) {
            $this->warn('DRY RUN MODE: No entries will be deleted');
            $this->newLine();
        }

        // Build query
        $query = DocumentHistory::query();
        
        if ($documentType) {
            $query->where('document_type', $documentType);
            $this->info("📄 Filtering by document type: {$documentType}");
        }
        
        if ($documentId) {
            $query->where('document_id', $documentId);
            $this->info("🔍 Filtering by document ID: {$documentId}");
        }
        
        if ($action) {
            $query->where('action', $action);
            $this->info("⚡ Filtering by action: {$action}");
        }

        // Find duplicates
        $this->info('🔍 Analyzing history entries...');
        
        $duplicates = $query->get()
            ->groupBy(function ($item) {
                // Group by document + action + user + time (within 10 seconds)
                $timeGroup = $item->created_at->format('Y-m-d H:i:') . 
                           str_pad(intval($item->created_at->format('s')) ?? 0 / 10, 2, '0', STR_PAD_LEFT);
                
                return "{$item->document_type}:{$item->document_id}:{$item->action}:{$item->action_by}:{$timeGroup}";
            })
            ->filter(function ($group) {
                return $group->count() > 1;
            });

        if ($duplicates->isEmpty()) {
            $this->info('✅ No duplicate entries found!');
            return Command::SUCCESS;
        }

        $totalDuplicates = 0;
        $totalGroups = $duplicates->count();
        
        $this->warn("⚠️  Found {$totalGroups} groups with duplicate entries:");
        $this->newLine();

        // Create progress bar
        $bar = $this->output->createProgressBar($totalGroups);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');

        foreach ($duplicates as $groupKey => $group) {
            $keepFirst = $group->sortBy('created_at')->first();
            $toDelete = $group->sortBy('created_at')->skip(1);
            
            $groupDuplicates = $toDelete->count();
            $totalDuplicates += $groupDuplicates;
            
            $bar->setMessage("Processing group: {$groupKey}");
            $bar->advance();

            if ($this->getOutput()->isVeryVerbose()) {
                $this->newLine();
                $this->line("📋 Group: {$groupKey}");
                $this->line("   Keep: {$keepFirst->id} ({$keepFirst->created_at})");
                $this->line("   Delete {$groupDuplicates} duplicates:");
                
                foreach ($toDelete as $duplicate) {
                    $this->line("   - {$duplicate->id} ({$duplicate->created_at})");
                }
            }

            if (!$dryRun) {
                // Delete the duplicates
                foreach ($toDelete as $duplicate) {
                    $duplicate->delete();
                }
            }
        }

        $bar->setMessage('Completed');
        $bar->finish();
        $this->newLine();
        $this->newLine();

        if ($dryRun) {
            $this->info("📊 Summary (DRY RUN):");
            $this->info("   - Would delete: {$totalDuplicates} duplicate entries");
            $this->info("   - Across: {$totalGroups} groups");
            $this->newLine();
            $this->info("💡 Run without --dry-run to perform actual cleanup");
        } else {
            $this->info("✅ Cleanup completed!");
            $this->info("   - Deleted: {$totalDuplicates} duplicate entries");
            $this->info("   - From: {$totalGroups} groups");
        }

        return Command::SUCCESS;
    }
}