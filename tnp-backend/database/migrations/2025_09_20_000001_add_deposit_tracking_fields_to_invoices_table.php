<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Add fields to track pre-VAT amounts for deposit invoices
            $table->decimal('subtotal_before_vat', 15, 2)->nullable()
                  ->after('subtotal')
                  ->comment('Subtotal amount before VAT calculation (for deposit tracking)');
                  
            $table->decimal('deposit_amount_before_vat', 15, 2)->nullable()
                  ->after('deposit_amount')
                  ->comment('Deposit amount before VAT calculation');
            
            // Add fields for separate document numbering
            $table->string('number_before', 50)->nullable()
                  ->after('number')
                  ->comment('Document number for before-deposit invoice');
                  
            $table->string('number_after', 50)->nullable()
                  ->after('number_before')
                  ->comment('Document number for after-deposit invoice');
            
            // Add reference to before-deposit invoice for after-deposit invoices
            $table->string('reference_invoice_id', 36)->nullable()
                  ->after('quotation_id')
                  ->comment('Reference to before-deposit invoice ID');
                  
            $table->string('reference_invoice_number', 50)->nullable()
                  ->after('reference_invoice_id')
                  ->comment('Reference to before-deposit invoice number');
            
            // Add index for better performance
            $table->index(['reference_invoice_id'], 'idx_invoices_reference_invoice_id');
            $table->index(['number_before'], 'idx_invoices_number_before');
            $table->index(['number_after'], 'idx_invoices_number_after');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_reference_invoice_id');
            $table->dropIndex('idx_invoices_number_before');
            $table->dropIndex('idx_invoices_number_after');
            
            $table->dropColumn([
                'subtotal_before_vat',
                'deposit_amount_before_vat',
                'number_before',
                'number_after',
                'reference_invoice_id',
                'reference_invoice_number'
            ]);
        });
    }
};