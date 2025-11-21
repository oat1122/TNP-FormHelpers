<?php

namespace App\Jobs\Accounting;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\QuotationInvoiceSyncJob;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\InvoiceItem;
use App\Models\Accounting\DocumentHistory;
use App\Services\Accounting\InvoiceService;

/**
 * Sync Quotation to Invoices Job
 * 
 * Background job for syncing quotation changes to related invoices
 * Used when there are more than 3 invoices to update
 */
class SyncQuotationToInvoicesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out
     */
    public $timeout = 300;

    /**
     * Quotation ID to sync from
     */
    protected string $quotationId;

    /**
     * Sync job ID for tracking
     */
    protected string $syncJobId;

    /**
     * User ID who initiated the sync
     */
    protected ?string $userId;

    /**
     * Create a new job instance
     *
     * @param string $quotationId
     * @param string $syncJobId
     * @param string|null $userId
     */
    public function __construct(string $quotationId, string $syncJobId, ?string $userId = null)
    {
        $this->quotationId = $quotationId;
        $this->syncJobId = $syncJobId;
        $this->userId = $userId;
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        try {
            Log::info('SyncQuotationToInvoicesJob started', [
                'quotation_id' => $this->quotationId,
                'sync_job_id' => $this->syncJobId,
                'user_id' => $this->userId
            ]);

            // Load sync job and update status
            $syncJob = QuotationInvoiceSyncJob::findOrFail($this->syncJobId);
            $syncJob->update([
                'status' => 'processing',
                'started_at' => now()
            ]);

            // Load quotation with items and invoices
            $quotation = Quotation::with(['items', 'invoices.items'])->findOrFail($this->quotationId);
            $invoices = $quotation->invoices;

            if ($invoices->isEmpty()) {
                Log::warning('No invoices found for quotation', ['quotation_id' => $this->quotationId]);
                $syncJob->update([
                    'status' => 'completed',
                    'completed_at' => now()
                ]);
                return;
            }

            $currentQItemIds = $quotation->items->pluck('id')->toArray();
            $invoiceIds = $invoices->pluck('id')->toArray();
            $totalItemsUpdated = 0;
            $totalItemsDeleted = 0;

            DB::beginTransaction();

            // Delete orphaned invoice items
            $deletedCount = InvoiceItem::whereIn('invoice_id', $invoiceIds)
                ->whereNotIn('quotation_item_id', $currentQItemIds)
                ->delete();
            $totalItemsDeleted += $deletedCount;

            if ($deletedCount > 0) {
                Log::info("Deleted {$deletedCount} orphaned invoice items", [
                    'quotation_id' => $this->quotationId,
                    'invoice_ids' => $invoiceIds
                ]);
            }

            // Sync each invoice
            $invoiceService = app(InvoiceService::class);

            foreach ($invoices as $index => $invoice) {
                try {
                    // Sync header fields
                    $invoice->customer_company = $quotation->customer_company ?? $invoice->customer_company;
                    $invoice->customer_tax_id = $quotation->customer_tax_id ?? $invoice->customer_tax_id;
                    $invoice->customer_address = $quotation->customer_address ?? $invoice->customer_address;
                    $invoice->customer_zip_code = $quotation->customer_zip_code ?? $invoice->customer_zip_code;
                    $invoice->customer_tel_1 = $quotation->customer_tel_1 ?? $invoice->customer_tel_1;
                    $invoice->customer_email = $quotation->customer_email ?? $invoice->customer_email;
                    $invoice->customer_firstname = $quotation->customer_firstname ?? $invoice->customer_firstname;
                    $invoice->customer_lastname = $quotation->customer_lastname ?? $invoice->customer_lastname;
                    $invoice->customer_snapshot = $quotation->customer_snapshot ?? $invoice->customer_snapshot;
                    $invoice->payment_terms = $quotation->payment_terms ?? $invoice->payment_terms;
                    $invoice->notes = $quotation->notes ?? $invoice->notes;
                    $invoice->has_vat = $quotation->has_vat;
                    $invoice->vat_percentage = $quotation->vat_percentage;
                    $invoice->pricing_mode = $quotation->pricing_mode;
                    $invoice->has_withholding_tax = $quotation->has_withholding_tax;
                    $invoice->withholding_tax_percentage = $quotation->withholding_tax_percentage;
                    $invoice->deposit_percentage = $quotation->deposit_percentage;
                    $invoice->deposit_mode = $quotation->deposit_mode ?? $invoice->deposit_mode;
                    $invoice->document_header_type = $quotation->document_header_type ?? $invoice->document_header_type;

                    // Sync invoice items
                    $itemsUpdated = 0;
                    foreach ($quotation->items as $qItem) {
                        $invoiceItem = $invoice->items->where('quotation_item_id', $qItem->id)->first();
                        
                        if ($invoiceItem) {
                            $invoiceItem->item_name = $qItem->item_name;
                            $invoiceItem->item_description = $qItem->item_description;
                            $invoiceItem->sequence_order = $qItem->sequence_order;
                            $invoiceItem->pattern = $qItem->pattern;
                            $invoiceItem->fabric_type = $qItem->fabric_type;
                            $invoiceItem->color = $qItem->color;
                            $invoiceItem->size = $qItem->size;
                            $invoiceItem->unit_price = $qItem->unit_price;
                            $invoiceItem->quantity = $qItem->quantity;
                            $invoiceItem->unit = $qItem->unit;
                            $invoiceItem->discount_percentage = $qItem->discount_percentage;
                            $invoiceItem->discount_amount = $qItem->discount_amount;
                            $invoiceItem->item_images = $qItem->item_images;
                            $invoiceItem->notes = $qItem->notes;
                            $invoiceItem->updated_at = now();
                            $invoiceItem->save();
                            $itemsUpdated++;
                        }
                    }

                    $totalItemsUpdated += $itemsUpdated;

                    // Recalculate invoice totals
                    $recalculated = $invoiceService->calculateBeforeVatFields($invoice);
                    
                    $invoice->subtotal = $recalculated['subtotal'];
                    $invoice->net_subtotal = $recalculated['net_subtotal'] ?? $recalculated['subtotal'];
                    $invoice->tax_amount = $recalculated['tax_amount'];
                    $invoice->vat_amount = $recalculated['vat_amount'];
                    $invoice->total_amount = $recalculated['total_amount'];
                    $invoice->special_discount_amount = $recalculated['special_discount_amount'];
                    $invoice->withholding_tax_amount = $recalculated['withholding_tax_amount'];
                    $invoice->deposit_amount = $recalculated['deposit_amount'];
                    $invoice->deposit_amount_before_vat = $recalculated['deposit_amount_before_vat'] ?? null;
                    $invoice->final_total_amount = $recalculated['final_total_amount'];
                    $invoice->updated_at = now();
                    $invoice->save();

                    // Log history for this invoice
                    DocumentHistory::logAction(
                        'invoice',
                        $invoice->id,
                        'synced_from_quotation',
                        $this->userId,
                        json_encode([
                            'quotation_id' => $this->quotationId,
                            'quotation_number' => $quotation->number,
                            'sync_mode' => 'queued',
                            'sync_job_id' => $this->syncJobId,
                            'updated_items_count' => $itemsUpdated,
                            'deleted_items_count' => $deletedCount,
                            'timestamp' => now()->toISOString()
                        ])
                    );

                    // Update progress
                    $syncJob->increment('progress_current');

                    $currentProgress = $index + 1;
                    Log::info("Synced invoice {$currentProgress}/{$syncJob->progress_total}", [
                        'invoice_id' => $invoice->id,
                        'invoice_number' => $invoice->number
                    ]);

                } catch (\Exception $e) {
                    Log::error("Failed to sync invoice in background job", [
                        'invoice_id' => $invoice->id,
                        'error' => $e->getMessage()
                    ]);
                    throw $e; // Re-throw to trigger job failure
                }
            }

            DB::commit();

            // Mark sync job as completed
            $syncJob->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);

            // Log completion
            DocumentHistory::logAction(
                'quotation',
                $this->quotationId,
                'sync_completed',
                $this->userId,
                json_encode([
                    'sync_job_id' => $this->syncJobId,
                    'total_invoices' => $syncJob->progress_total,
                    'updated_items' => $totalItemsUpdated,
                    'deleted_items' => $totalItemsDeleted
                ])
            );

            Log::info('SyncQuotationToInvoicesJob completed successfully', [
                'quotation_id' => $this->quotationId,
                'sync_job_id' => $this->syncJobId,
                'invoices_synced' => $syncJob->progress_total
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('SyncQuotationToInvoicesJob failed', [
                'quotation_id' => $this->quotationId,
                'sync_job_id' => $this->syncJobId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e; // Re-throw to trigger failed() method
        }
    }

    /**
     * Handle a job failure
     */
    public function failed(\Throwable $exception): void
    {
        try {
            $syncJob = QuotationInvoiceSyncJob::find($this->syncJobId);
            
            if ($syncJob) {
                $syncJob->update([
                    'status' => 'failed',
                    'error_message' => $exception->getMessage(),
                    'completed_at' => now()
                ]);
            }

            // Log failure
            DocumentHistory::logAction(
                'quotation',
                $this->quotationId,
                'sync_failed',
                $this->userId,
                json_encode([
                    'sync_job_id' => $this->syncJobId,
                    'error' => $exception->getMessage()
                ])
            );

            Log::error('SyncQuotationToInvoicesJob permanently failed', [
                'quotation_id' => $this->quotationId,
                'sync_job_id' => $this->syncJobId,
                'error' => $exception->getMessage()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to handle job failure', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
