<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->char('company_id', 36);
            $table->string('doc_type', 50); // quotation, invoice, receipt, tax_invoice, full_tax_invoice, delivery_note
            $table->integer('year');
            $table->integer('month');
            $table->integer('last_number')->default(0);
            $table->string('prefix_override', 50)->nullable();
            $table->timestamps();
            $table->unique(['company_id','doc_type','year','month'], 'uniq_company_doctype_year_month');
            $table->index(['doc_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_sequences');
    }
};
