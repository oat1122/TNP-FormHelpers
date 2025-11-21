<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\DocumentHistory;
use App\Services\Accounting\InvoiceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncService
{
    /**
     * Sync quotation changes to related invoices immediately (for <=3 invoices)
     * 
     * @param Quotation $quotation
     * @param string|null $userId
     * @return array
     */
    public function syncToInvoicesImmediately(Quotation $quotation, ?string $userId): array
    {
        try {
            DB::beginTransaction();

            $invoices = $quotation->invoices()->with('items')->get();
            $invoiceIds = $invoices->pluck('id')->toArray();

            // Create sync job record for tracking
            $syncJob = \App\Models\Accounting\QuotationInvoiceSyncJob::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'quotation_id' => $quotation->id,
                'affected_invoice_ids' => $invoiceIds,
                'original_quotation_snapshot' => json_encode($quotation->load('items')->toArray()),
                'original_invoices_snapshot' => json_encode($invoices->toArray()),
                'status' => 'processing',
                'progress_total' => $invoices->count(),
                'progress_current' => 0,
                'started_by' => $userId,
                'started_at' => now()
            ]);

            $totalUpdated = 0;
            $totalItemsUpdated = 0;
            $totalItemsDeleted = 0;

            // Update each invoice
            foreach ($invoices as $invoice) {
                // Sync header fields from quotation
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
                $invoice->due_date = $quotation->due_date ?? $invoice->due_date;
                $invoice->notes = $quotation->notes ?? $invoice->notes;
                $invoice->has_vat = $quotation->has_vat;
                $invoice->vat_percentage = $quotation->vat_percentage;
                $invoice->pricing_mode = $quotation->pricing_mode;
                $invoice->special_discount_percentage = $quotation->special_discount_percentage ?? 0;
                $invoice->special_discount_amount = $quotation->special_discount_amount ?? 0;
                $invoice->has_withholding_tax = $quotation->has_withholding_tax ?? false;
                $invoice->withholding_tax_percentage = $quotation->withholding_tax_percentage ?? 0;
                $invoice->deposit_percentage = $quotation->deposit_percentage;
                $invoice->deposit_mode = $quotation->deposit_mode ?? $invoice->deposit_mode;
                $invoice->document_header_type = $quotation->document_header_type ?? $invoice->document_header_type;

                // Delete all existing invoice items and recreate from quotation
                $deletedCount = \App\Models\Accounting\InvoiceItem::where('invoice_id', $invoice->id)->delete();
                $totalItemsDeleted += $deletedCount;

                // Create new invoice items from quotation items
                $itemsCreated = 0;
                foreach ($quotation->items as $qItem) {
                    \App\Models\Accounting\InvoiceItem::create([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'invoice_id' => $invoice->id,
                        'quotation_item_id' => $qItem->id,
                        'pricing_request_id' => $qItem->pricing_request_id,
                        'item_name' => $qItem->item_name,
                        'item_description' => $qItem->item_description,
                        'sequence_order' => $qItem->sequence_order,
                        'pattern' => $qItem->pattern,
                        'fabric_type' => $qItem->fabric_type,
                        'color' => $qItem->color,
                        'size' => $qItem->size,
                        'unit_price' => $qItem->unit_price,
                        'quantity' => $qItem->quantity,
                        'unit' => $qItem->unit,
                        'discount_percentage' => $qItem->discount_percentage,
                        'discount_amount' => $qItem->discount_amount,
                        'item_images' => $qItem->item_images,
                        'notes' => $qItem->notes,
                        'status' => 'draft',
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $itemsCreated++;
                }

                $totalItemsUpdated += $itemsCreated;

                // Recalculate invoice totals from items
                $this->recalculateInvoiceTotals($invoice, $quotation);
                
                $invoice->save();
                $totalUpdated++;
                
                // Update sync job progress
                $syncJob->update([
                    'progress_current' => $totalUpdated
                ]);
            }

            // Mark job as completed
            $syncJob->update([
                'status' => 'completed',
                'completed_at' => now(),
                'result_summary' => json_encode([
                    'invoices_updated' => $totalUpdated,
                    'items_deleted' => $totalItemsDeleted,
                    'items_created' => $totalItemsUpdated
                ])
            ]);

            // Log history
            DocumentHistory::logAction(
                'quotation',
                $quotation->id,
                'sync_invoices',
                $userId,
                "Synced changes to {$totalUpdated} invoices"
            );

            DB::commit();

            return [
                'success' => true,
                'job_id' => $syncJob->id,
                'updated_count' => $totalUpdated
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            if (isset($syncJob)) {
                $syncJob->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'completed_at' => now()
                ]);
            }
            
            Log::error('QuotationService::syncToInvoicesImmediately error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue invoice sync job for background processing (for >3 invoices)
     * 
     * @param Quotation $quotation
     * @param string|null $userId
     * @return string Sync job ID
     */
    public function queueInvoiceSync(Quotation $quotation, ?string $userId): string
    {
        try {
            // Capture pre-sync snapshot
            $quotationSnapshot = $quotation->load('items')->toArray();
            $invoicesSnapshot = $quotation->invoices()->with('items')->get()->toArray();
            $invoiceIds = array_column($invoicesSnapshot, 'id');

            // Create sync job record
            $syncJob = \App\Models\Accounting\QuotationInvoiceSyncJob::create([
                'quotation_id' => $quotation->id,
                'affected_invoice_ids' => $invoiceIds,
                'original_quotation_snapshot' => $quotationSnapshot,
                'original_invoices_snapshot' => $invoicesSnapshot,
                'status' => 'pending',
                'progress_current' => 0,
                'progress_total' => count($invoiceIds),
                'started_by' => $userId
            ]);

            // Dispatch queue job
            \App\Jobs\Accounting\SyncQuotationToInvoicesJob::dispatch(
                $quotation->id,
                $syncJob->id,
                $userId
            )->onQueue('accounting-sync');

            // Log action
            DocumentHistory::logAction(
                'quotation',
                $quotation->id,
                'sync_queued',
                $userId,
                json_encode([
                    'sync_job_id' => $syncJob->id,
                    'invoice_count' => count($invoiceIds)
                ])
            );

            Log::info('Quotation sync job queued', [
                'quotation_id' => $quotation->id,
                'sync_job_id' => $syncJob->id,
                'invoice_count' => count($invoiceIds)
            ]);

            return $syncJob->id;

        } catch (\Exception $e) {
            Log::error('QuotationService::queueInvoiceSync error: ' . $e->getMessage(), [
                'quotation_id' => $quotation->id,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Recalculate invoice totals based on its items and quotation settings
     * 
     * @param \App\Models\Accounting\Invoice $invoice
     * @param Quotation $quotation
     * @return void
     */
    protected function recalculateInvoiceTotals($invoice, Quotation $quotation): void
    {
        // Calculate subtotal from invoice items
        $items = \App\Models\Accounting\InvoiceItem::where('invoice_id', $invoice->id)->get();
        
        $subtotal = 0;
        foreach ($items as $item) {
            $itemTotal = ($item->unit_price * $item->quantity);
            $itemTotal -= $item->discount_amount;
            if ($item->discount_percentage > 0) {
                $itemTotal -= ($itemTotal * $item->discount_percentage / 100);
            }
            $subtotal += $itemTotal;
        }
        $subtotal = round($subtotal, 2);

        // Calculate based on pricing mode
        $hasVat = $invoice->has_vat ?? true;
        $vatRate = $hasVat ? ($invoice->vat_percentage ?? 7) : 0;
        $pricingMode = $invoice->pricing_mode ?? 'net';
        
        $netSubtotal = $subtotal;
        $vatAmount = 0;
        
        if ($pricingMode === 'vat_included' && $hasVat && $vatRate > 0) {
            // VAT is included in prices - extract it
            $vatMultiplier = 1 + ($vatRate / 100);
            $netSubtotal = round($subtotal / $vatMultiplier, 2);
            $vatAmount = $subtotal - $netSubtotal;
        } else if ($pricingMode === 'net' && $hasVat && $vatRate > 0) {
            // VAT is added on top
            $vatAmount = round($netSubtotal * ($vatRate / 100), 2);
        }
        
        $totalAmount = round($netSubtotal + $vatAmount, 2);
        
        // Calculate withholding tax if applicable
        $withholdingTaxAmount = 0;
        if ($invoice->has_withholding_tax && ($invoice->withholding_tax_percentage ?? 0) > 0) {
            $withholdingTaxAmount = round($netSubtotal * ($invoice->withholding_tax_percentage / 100), 2);
        }
        
        $finalTotalAmount = round($totalAmount - $withholdingTaxAmount, 2);
        
        // Calculate deposit amount
        $depositAmount = 0;
        $depositPercentage = $invoice->deposit_percentage ?? 0;
        
        if ($depositPercentage > 0) {
            $depositMode = $invoice->deposit_mode ?? 'percentage';
            $depositBase = ($depositMode === 'before') ? $netSubtotal : $totalAmount;
            $depositAmount = round($depositBase * ($depositPercentage / 100), 2);
        }
        
        // Update invoice fields
        $invoice->subtotal = $subtotal;
        $invoice->subtotal_before_vat = $subtotal;
        $invoice->net_subtotal = $netSubtotal;
        $invoice->vat_amount = $vatAmount;
        $invoice->total_amount = $totalAmount;
        $invoice->withholding_tax_amount = $withholdingTaxAmount;
        $invoice->final_total_amount = $finalTotalAmount;
        $invoice->deposit_amount = $depositAmount;
        
        // Calculate deposit base before VAT for the deposit invoice type
        if ($depositPercentage > 0 && $depositMode === 'before') {
            $invoice->deposit_amount_before_vat = round($netSubtotal * ($depositPercentage / 100), 2);
        } else {
            $invoice->deposit_amount_before_vat = $depositAmount;
        }
    }
}
