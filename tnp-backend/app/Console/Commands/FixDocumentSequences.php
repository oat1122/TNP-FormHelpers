<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixDocumentSequences extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'document:fix-sequences {--dry-run : Show what would be changed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix document sequences to match actual document numbers in database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔧 Fixing Document Sequences...');
        
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->warn('🔍 DRY RUN MODE - No changes will be made');
        }
        
        // Document types to check
        $docTypes = [
            'quotation' => 'quotations',
            'invoice' => 'invoices', 
            'receipt' => 'receipts',
            'delivery_note' => 'delivery_notes'
        ];
        
        $totalFixed = 0;
        
        foreach ($docTypes as $docType => $tableName) {
            $this->info("\n📋 Checking {$docType}...");
            
            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable($tableName)) {
                $this->warn("   ⚠️  Table {$tableName} not found, skipping");
                continue;
            }
            
            // Get all sequences for this doc type
            $sequences = DB::table('document_sequences')
                ->where('doc_type', $docType)
                ->get(['id', 'company_id', 'doc_type', 'year', 'month', 'last_number']);
                
            foreach ($sequences as $sequence) {
                $prefix = $this->getPrefix($docType) . $sequence->year . str_pad($sequence->month, 2, '0', STR_PAD_LEFT);
                
                // Find actual max number in documents table
                $maxNumber = DB::table($tableName)
                    ->where('company_id', $sequence->company_id)
                    ->where('number', 'like', $prefix . '-%')
                    ->selectRaw('MAX(CAST(SUBSTRING(number, -4) AS UNSIGNED)) as max_num')
                    ->first()->max_num ?? 0;
                
                if ($maxNumber !== (int)$sequence->last_number) {
                    $this->line("   🔧 Company {$this->getCompanyName($sequence->company_id)}: {$sequence->last_number} → {$maxNumber}");
                    
                    if (!$isDryRun) {
                        DB::table('document_sequences')
                            ->where('id', $sequence->id)
                            ->update(['last_number' => $maxNumber]);
                    }
                    
                    $totalFixed++;
                } else {
                    $this->line("   ✅ Company {$this->getCompanyName($sequence->company_id)}: {$sequence->last_number} (correct)");
                }
            }
        }
        
        if ($totalFixed > 0) {
            if ($isDryRun) {
                $this->info("\n🎯 Would fix {$totalFixed} sequences");
                $this->info("💡 Run without --dry-run to apply changes");
            } else {
                $this->success("\n🎉 Fixed {$totalFixed} sequences successfully!");
            }
        } else {
            $this->success("\n✨ All sequences are already correct!");
        }
        
        return 0;
    }
    
    private function getPrefix($docType): string
    {
        $prefixMap = [
            'quotation' => 'QT',
            'invoice' => 'INV',
            'receipt' => 'RCPT',
            'tax_invoice' => 'TAX',
            'full_tax_invoice' => 'FTAX',
            'delivery_note' => 'DN',
        ];
        
        return $prefixMap[$docType] ?? strtoupper(substr($docType, 0, 3));
    }
    
    private function getCompanyName($companyId): string
    {
        $company = DB::table('companies')
            ->where('id', $companyId)
            ->first(['name']);
            
        return $company ? substr($company->name, 0, 20) : substr($companyId, 0, 8);
    }
}