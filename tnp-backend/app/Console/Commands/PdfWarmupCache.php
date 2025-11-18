<?php

namespace App\Console\Commands;

use App\Jobs\GeneratePdfJob;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use Illuminate\Console\Command;

/**
 * Warmup PDF cache by pre-generating PDFs for approved documents
 * 
 * Usage:
 * php artisan pdf:warmup
 * php artisan pdf:warmup quotation
 * php artisan pdf:warmup invoice --limit=50
 */
class PdfWarmupCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdf:warmup
                            {type? : Document type to warmup (quotation, invoice, receipt, delivery_note)}
                            {--limit=100 : Maximum number of documents to process}
                            {--async : Process in background queue instead of immediately}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pre-generate PDFs for approved documents to warm up the cache';

    /**
     * Execute the console command
     */
    public function handle(): int
    {
        $this->info('🔥 PDF Cache Warmup Started');
        $this->newLine();

        $type = $this->argument('type');
        $limit = (int) $this->option('limit');
        $async = $this->option('async');

        $types = $type ? [$type] : ['quotation', 'invoice', 'receipt', 'delivery_note'];

        $totalGenerated = 0;

        foreach ($types as $documentType) {
            $this->info("📄 Processing {$documentType}s...");
            
            $documents = $this->getDocumentsForWarmup($documentType, $limit);
            
            if ($documents->isEmpty()) {
                $this->warn("   No approved {$documentType}s found to warmup.");
                continue;
            }

            $this->info("   Found {$documents->count()} approved {$documentType}(s)");
            
            if ($async) {
                // Dispatch to queue
                foreach ($documents as $document) {
                    GeneratePdfJob::dispatch($documentType, $document->id, [], null);
                }
                $this->info("   ✅ Dispatched {$documents->count()} jobs to queue");
            } else {
                // Process immediately with progress bar
                $bar = $this->output->createProgressBar($documents->count());
                $bar->start();
                
                foreach ($documents as $document) {
                    try {
                        $service = $this->getService($documentType);
                        $service->generatePdf($document, [], true); // Use cache
                        $bar->advance();
                    } catch (\Exception $e) {
                        $this->newLine();
                        $this->error("   Failed to generate PDF for {$documentType} {$document->number}: " . $e->getMessage());
                    }
                }
                
                $bar->finish();
                $this->newLine();
                $this->info("   ✅ Generated {$documents->count()} PDFs");
            }
            
            $totalGenerated += $documents->count();
            $this->newLine();
        }

        $this->newLine();
        $this->info("🎉 Warmup completed! Total: {$totalGenerated} PDFs " . ($async ? 'queued' : 'generated'));

        return self::SUCCESS;
    }

    /**
     * Get documents for warmup based on type
     */
    protected function getDocumentsForWarmup(string $type, int $limit)
    {
        switch ($type) {
            case 'quotation':
                return Quotation::with('items', 'customer', 'company')
                    ->whereIn('status', ['approved', 'sent', 'completed'])
                    ->orderBy('updated_at', 'desc')
                    ->limit($limit)
                    ->get();

            case 'invoice':
                return Invoice::with('items', 'customer', 'company')
                    ->where(function($q) {
                        $q->where('status_before', 'approved')
                          ->orWhere('status_after', 'approved');
                    })
                    ->orderBy('updated_at', 'desc')
                    ->limit($limit)
                    ->get();

            case 'receipt':
                return Receipt::with('invoice', 'customer', 'company')
                    ->where('status', 'approved')
                    ->orderBy('updated_at', 'desc')
                    ->limit($limit)
                    ->get();

            case 'delivery_note':
                return DeliveryNote::with('items', 'customer', 'company')
                    ->whereIn('status', ['shipping', 'in_transit', 'delivered', 'completed'])
                    ->orderBy('updated_at', 'desc')
                    ->limit($limit)
                    ->get();

            default:
                return collect();
        }
    }

    /**
     * Get service instance for document type
     */
    protected function getService(string $type)
    {
        $serviceMap = [
            'quotation' => \App\Services\Accounting\QuotationService::class,
            'invoice' => \App\Services\Accounting\InvoiceService::class,
            'receipt' => \App\Services\Accounting\ReceiptService::class,
            'delivery_note' => \App\Services\Accounting\DeliveryNoteService::class,
        ];

        $serviceClass = $serviceMap[$type] ?? null;
        
        if (!$serviceClass) {
            throw new \Exception("Unknown document type: {$type}");
        }

        return app($serviceClass);
    }
}
