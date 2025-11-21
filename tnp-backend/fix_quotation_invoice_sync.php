<?php

/**
 * Script to fix existing quotation-invoice sync issues
 * 
 * This script will:
 * 1. Find all quotations that have related invoices
 * 2. Sync the data from quotations to invoices
 * 3. Update all 4 tables: quotations, quotation_items, invoices, invoice_items
 * 
 * Usage: php fix_quotation_invoice_sync.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\InvoiceItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

echo "=== Starting Quotation-Invoice Sync Fix ===\n\n";

try {
    DB::beginTransaction();
    
    // Find all quotations that have related invoices
    $quotationsWithInvoices = Quotation::whereHas('invoices')
        ->with(['items', 'invoices.items'])
        ->get();
    
    echo "Found " . $quotationsWithInvoices->count() . " quotations with invoices\n\n";
    
    $totalFixed = 0;
    $totalInvoices = 0;
    $totalItemsFixed = 0;
    
    foreach ($quotationsWithInvoices as $quotation) {
        echo "Processing Quotation: {$quotation->number} (ID: {$quotation->id})\n";
        
        $invoices = $quotation->invoices;
        echo "  - Found " . $invoices->count() . " related invoices\n";
        
        foreach ($invoices as $invoice) {
            echo "  - Syncing Invoice: {$invoice->number} (ID: {$invoice->id})\n";
            
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

            // Delete existing invoice items
            $deletedCount = InvoiceItem::where('invoice_id', $invoice->id)->delete();
            echo "    - Deleted {$deletedCount} old invoice items\n";
            
            // Create new invoice items from quotation items
            $itemsCreated = 0;
            foreach ($quotation->items as $qItem) {
                InvoiceItem::create([
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
                    'created_by' => '1c914879-ffff-11ef-afa3-38ca84abdf0a', // System user
                    'updated_by' => '1c914879-ffff-11ef-afa3-38ca84abdf0a',
                ]);
                $itemsCreated++;
            }
            echo "    - Created {$itemsCreated} new invoice items\n";
            $totalItemsFixed += $itemsCreated;
            
            // Recalculate invoice totals from items
            $items = InvoiceItem::where('invoice_id', $invoice->id)->get();
            
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
                $vatMultiplier = 1 + ($vatRate / 100);
                $netSubtotal = round($subtotal / $vatMultiplier, 2);
                $vatAmount = $subtotal - $netSubtotal;
            } else if ($pricingMode === 'net' && $hasVat && $vatRate > 0) {
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
            $depositMode = $invoice->deposit_mode ?? 'percentage';
            
            if ($depositPercentage > 0) {
                $depositBase = ($depositMode === 'before') ? $netSubtotal : $totalAmount;
                $depositAmount = round($depositBase * ($depositPercentage / 100), 2);
            }
            
            // Update invoice fields
            $oldSubtotal = $invoice->subtotal;
            $oldTotal = $invoice->final_total_amount;
            
            $invoice->subtotal = $subtotal;
            $invoice->subtotal_before_vat = $subtotal;
            $invoice->net_subtotal = $netSubtotal;
            $invoice->vat_amount = $vatAmount;
            $invoice->total_amount = $totalAmount;
            $invoice->withholding_tax_amount = $withholdingTaxAmount;
            $invoice->final_total_amount = $finalTotalAmount;
            $invoice->deposit_amount = $depositAmount;
            
            if ($depositPercentage > 0 && $depositMode === 'before') {
                $invoice->deposit_amount_before_vat = round($netSubtotal * ($depositPercentage / 100), 2);
            } else {
                $invoice->deposit_amount_before_vat = $depositAmount;
            }
            
            $invoice->save();
            
            echo "    - Updated totals: {$oldSubtotal} -> {$subtotal}, {$oldTotal} -> {$finalTotalAmount}\n";
            
            $totalInvoices++;
        }
        
        $totalFixed++;
        echo "  ✓ Completed\n\n";
    }
    
    DB::commit();
    
    echo "\n=== Sync Fix Completed Successfully ===\n";
    echo "Total quotations fixed: {$totalFixed}\n";
    echo "Total invoices synced: {$totalInvoices}\n";
    echo "Total invoice items recreated: {$totalItemsFixed}\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
