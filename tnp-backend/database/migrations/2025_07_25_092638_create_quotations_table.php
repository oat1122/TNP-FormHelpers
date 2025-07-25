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
        // Create quotations table
        Schema::create('quotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('quotation_no')->unique();
            $table->uuid('pricing_request_id')->nullable();
            $table->uuid('customer_id');
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'completed'])->default('draft');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(7.0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('deposit_amount', 10, 2)->default(0);
            $table->decimal('remaining_amount', 10, 2)->default(0);
            $table->string('payment_terms')->nullable();
            $table->date('valid_until')->nullable();
            $table->text('remarks')->nullable();
            $table->uuid('created_by');
            $table->uuid('updated_by')->nullable();
            $table->integer('version_no')->default(1);
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['customer_id']);
            $table->index(['created_at']);
            $table->index(['quotation_no']);
        });

        // Create quotation_items table
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('quotation_id');
            $table->string('item_name');
            $table->text('item_description')->nullable();
            $table->decimal('quantity', 10, 2);
            $table->string('unit')->default('ชิ้น');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->integer('item_order')->default(1);
            $table->timestamps();

            $table->foreign('quotation_id')->references('id')->on('quotations')->onDelete('cascade');
            $table->index(['quotation_id']);
        });

        // Create invoices table
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_no')->unique();
            $table->uuid('quotation_id')->nullable();
            $table->uuid('customer_id');
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'completed'])->default('draft');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(7.0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('remaining_amount', 10, 2)->default(0);
            $table->integer('credit_term_days')->default(30);
            $table->date('due_date')->nullable();
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->text('remarks')->nullable();
            $table->uuid('created_by');
            $table->uuid('updated_by')->nullable();
            $table->integer('version_no')->default(1);
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['payment_status']);
            $table->index(['customer_id']);
            $table->index(['due_date']);
            $table->index(['created_at']);
            $table->index(['invoice_no']);
        });

        // Create invoice_items table
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id');
            $table->string('item_name');
            $table->text('item_description')->nullable();
            $table->decimal('quantity', 10, 2);
            $table->string('unit')->default('ชิ้น');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->integer('item_order')->default(1);
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
            $table->index(['invoice_id']);
        });

        // Create receipts table
        Schema::create('receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('receipt_no')->unique();
            $table->string('tax_invoice_no')->unique();
            $table->uuid('invoice_id')->nullable();
            $table->uuid('customer_id');
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'completed'])->default('draft');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(7.0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'credit_card'])->default('bank_transfer');
            $table->string('payment_reference')->nullable();
            $table->date('payment_date');
            $table->text('remarks')->nullable();
            $table->uuid('created_by');
            $table->uuid('updated_by')->nullable();
            $table->integer('version_no')->default(1);
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['payment_method']);
            $table->index(['customer_id']);
            $table->index(['payment_date']);
            $table->index(['created_at']);
            $table->index(['receipt_no']);
        });

        // Create receipt_items table
        Schema::create('receipt_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('receipt_id');
            $table->string('item_name');
            $table->text('item_description')->nullable();
            $table->decimal('quantity', 10, 2);
            $table->string('unit')->default('ชิ้น');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->integer('item_order')->default(1);
            $table->timestamps();

            $table->foreign('receipt_id')->references('id')->on('receipts')->onDelete('cascade');
            $table->index(['receipt_id']);
        });

        // Create delivery_notes table
        Schema::create('delivery_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('delivery_no')->unique();
            $table->uuid('receipt_id')->nullable();
            $table->uuid('customer_id');
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'completed', 'delivered'])->default('draft');
            $table->date('delivery_date');
            $table->text('delivery_address')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('remarks')->nullable();
            $table->uuid('created_by');
            $table->uuid('updated_by')->nullable();
            $table->integer('version_no')->default(1);
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['customer_id']);
            $table->index(['delivery_date']);
            $table->index(['created_at']);
            $table->index(['delivery_no']);
        });

        // Create delivery_note_items table
        Schema::create('delivery_note_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('delivery_note_id');
            $table->string('item_name');
            $table->text('item_description')->nullable();
            $table->decimal('quantity_ordered', 10, 2);
            $table->decimal('quantity_delivered', 10, 2);
            $table->decimal('quantity_remaining', 10, 2);
            $table->string('unit')->default('ชิ้น');
            $table->integer('item_order')->default(1);
            $table->timestamps();

            $table->foreign('delivery_note_id')->references('id')->on('delivery_notes')->onDelete('cascade');
            $table->index(['delivery_note_id']);
        });

        // Create document_status_history table
        Schema::create('document_status_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('document_id');
            $table->enum('document_type', ['quotation', 'invoice', 'receipt', 'delivery_note']);
            $table->string('status_from')->nullable();
            $table->string('status_to');
            $table->enum('action_type', ['create', 'update', 'delete', 'approve', 'reject', 'revert']);
            $table->text('remarks')->nullable();
            $table->uuid('changed_by');
            $table->timestamp('changed_at');
            $table->timestamps();

            $table->index(['document_id', 'document_type']);
            $table->index(['changed_at']);
            $table->index(['action_type']);
        });

        // Create document_attachments table
        Schema::create('document_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('document_id');
            $table->enum('document_type', ['quotation', 'invoice', 'receipt', 'delivery_note']);
            $table->string('file_name');
            $table->string('original_name');
            $table->string('file_path');
            $table->bigInteger('file_size');
            $table->string('file_type');
            $table->uuid('uploaded_by');
            $table->timestamps();

            $table->index(['document_id', 'document_type']);
            $table->index(['uploaded_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_attachments');
        Schema::dropIfExists('document_status_history');
        Schema::dropIfExists('delivery_note_items');
        Schema::dropIfExists('delivery_notes');
        Schema::dropIfExists('receipt_items');
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('quotation_items');
        Schema::dropIfExists('quotations');
    }
};
