<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Services\Accounting\QuotationService;
use App\Services\Accounting\InvoiceService;
use App\Services\Accounting\ReceiptService;
use App\Services\Accounting\DeliveryNoteService;

/**
 * Generate PDF Job - Background PDF generation for long-running tasks
 * 
 * Usage:
 * GeneratePdfJob::dispatch('invoice', $invoiceId, ['document_header_type' => 'ต้นฉบับ'], $userId);
 */
class GeneratePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out
     */
    public $timeout = 120;

    /**
     * Document type (quotation, invoice, receipt, delivery_note)
     */
    protected string $documentType;

    /**
     * Document ID
     */
    protected string $documentId;

    /**
     * PDF generation options
     */
    protected array $options;

    /**
     * User ID who requested the generation
     */
    protected ?string $userId;

    /**
     * Create a new job instance
     *
     * @param string $documentType
     * @param string $documentId
     * @param array $options
     * @param string|null $userId
     */
    public function __construct(string $documentType, string $documentId, array $options = [], ?string $userId = null)
    {
        $this->documentType = $documentType;
        $this->documentId = $documentId;
        $this->options = $options;
        $this->userId = $userId;
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        try {
            Log::info("GeneratePdfJob started", [
                'document_type' => $this->documentType,
                'document_id' => $this->documentId,
                'options' => $this->options,
                'user_id' => $this->userId
            ]);

            $service = $this->getService();
            
            if (!$service) {
                throw new \Exception("Unknown document type: {$this->documentType}");
            }

            // Get document
            $document = $this->getDocument();
            
            if (!$document) {
                throw new \Exception("Document not found: {$this->documentType} ID {$this->documentId}");
            }

            // Generate PDF (will be cached automatically by BasePdfMasterService)
            $result = $service->generatePdf($document, $this->options);

            Log::info("GeneratePdfJob completed successfully", [
                'document_type' => $this->documentType,
                'document_id' => $this->documentId,
                'pdf_url' => $result['url'] ?? null,
                'from_cache' => $result['from_cache'] ?? false
            ]);

        } catch (\Exception $e) {
            Log::error("GeneratePdfJob failed", [
                'document_type' => $this->documentType,
                'document_id' => $this->documentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("GeneratePdfJob permanently failed after all retries", [
            'document_type' => $this->documentType,
            'document_id' => $this->documentId,
            'error' => $exception->getMessage()
        ]);

        // TODO: Notify user or system admin about the failure
        // You could dispatch a notification job here
    }

    /**
     * Get the appropriate service based on document type
     */
    protected function getService()
    {
        $serviceMap = [
            'quotation' => QuotationService::class,
            'invoice' => InvoiceService::class,
            'receipt' => ReceiptService::class,
            'delivery_note' => DeliveryNoteService::class,
        ];

        $serviceClass = $serviceMap[$this->documentType] ?? null;
        
        return $serviceClass ? app($serviceClass) : null;
    }

    /**
     * Get document model instance
     */
    protected function getDocument()
    {
        $modelMap = [
            'quotation' => \App\Models\Accounting\Quotation::class,
            'invoice' => \App\Models\Accounting\Invoice::class,
            'receipt' => \App\Models\Accounting\Receipt::class,
            'delivery_note' => \App\Models\Accounting\DeliveryNote::class,
        ];

        $modelClass = $modelMap[$this->documentType] ?? null;
        
        if (!$modelClass) {
            return null;
        }

        return $modelClass::with('items', 'customer', 'company')->find($this->documentId);
    }
}
