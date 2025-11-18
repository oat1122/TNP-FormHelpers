<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Bus;

/**
 * Bulk Generate PDF Job - Background PDF generation for multiple documents
 * 
 * Usage:
 * BulkGeneratePdfJob::dispatch('invoice', [$id1, $id2, $id3], ['document_header_type' => 'ต้นฉบับ'], $userId);
 */
class BulkGeneratePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted
     */
    public $tries = 2;

    /**
     * The number of seconds the job can run before timing out
     */
    public $timeout = 600;

    /**
     * Document type (quotation, invoice, receipt, delivery_note)
     */
    protected string $documentType;

    /**
     * Array of document IDs
     */
    protected array $documentIds;

    /**
     * PDF generation options
     */
    protected array $options;

    /**
     * User ID who requested the generation
     */
    protected ?string $userId;

    /**
     * Chunk size for processing
     */
    protected int $chunkSize;

    /**
     * Create a new job instance
     *
     * @param string $documentType
     * @param array $documentIds
     * @param array $options
     * @param string|null $userId
     * @param int $chunkSize Number of documents to process per chunk
     */
    public function __construct(
        string $documentType, 
        array $documentIds, 
        array $options = [], 
        ?string $userId = null,
        int $chunkSize = 20
    ) {
        $this->documentType = $documentType;
        $this->documentIds = $documentIds;
        $this->options = $options;
        $this->userId = $userId;
        $this->chunkSize = $chunkSize;
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        try {
            $total = count($this->documentIds);
            
            Log::info("BulkGeneratePdfJob started", [
                'document_type' => $this->documentType,
                'total_documents' => $total,
                'chunk_size' => $this->chunkSize,
                'user_id' => $this->userId
            ]);

            $chunks = array_chunk($this->documentIds, $this->chunkSize);
            $jobs = [];

            // Create individual jobs for each document
            foreach ($chunks as $chunkIndex => $chunk) {
                $chunkJobs = [];
                
                foreach ($chunk as $documentId) {
                    $chunkJobs[] = new GeneratePdfJob(
                        $this->documentType,
                        $documentId,
                        $this->options,
                        $this->userId
                    );
                }

                // Dispatch chunk of jobs
                Bus::batch($chunkJobs)
                    ->name("PDF Generation Chunk " . ($chunkIndex + 1) . " of " . count($chunks))
                    ->allowFailures()
                    ->dispatch();

                Log::info("BulkGeneratePdfJob dispatched chunk", [
                    'chunk_index' => $chunkIndex + 1,
                    'chunk_size' => count($chunk),
                    'total_chunks' => count($chunks)
                ]);
            }

            Log::info("BulkGeneratePdfJob completed dispatching", [
                'document_type' => $this->documentType,
                'total_documents' => $total,
                'total_chunks' => count($chunks)
            ]);

        } catch (\Exception $e) {
            Log::error("BulkGeneratePdfJob failed", [
                'document_type' => $this->documentType,
                'total_documents' => count($this->documentIds),
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
        Log::error("BulkGeneratePdfJob permanently failed", [
            'document_type' => $this->documentType,
            'total_documents' => count($this->documentIds),
            'error' => $exception->getMessage()
        ]);

        // TODO: Notify user or system admin about the failure
    }

    /**
     * Get statistics about bulk job
     */
    public function getStatistics(): array
    {
        return [
            'document_type' => $this->documentType,
            'total_documents' => count($this->documentIds),
            'chunk_size' => $this->chunkSize,
            'estimated_chunks' => ceil(count($this->documentIds) / $this->chunkSize),
            'estimated_duration_minutes' => ceil((count($this->documentIds) * 5) / 60), // Assume 5 seconds per PDF
        ];
    }
}
