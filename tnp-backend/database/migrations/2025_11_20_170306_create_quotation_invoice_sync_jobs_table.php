<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quotation_invoice_sync_jobs', function (Blueprint $table) {
            $table->char('id', 36)->primary()->default(DB::raw('uuid()'));
            $table->char('quotation_id', 36)->comment('FK to quotations.id');
            $table->json('affected_invoice_ids')->comment('JSON array of invoice IDs');
            $table->longText('original_quotation_snapshot')->nullable()->comment('Complete quotation + items snapshot before sync');
            $table->longText('original_invoices_snapshot')->nullable()->comment('Affected invoices + items snapshot before sync');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->integer('progress_current')->default(0)->comment('Current progress count');
            $table->integer('progress_total')->default(0)->comment('Total items to process');
            $table->text('error_message')->nullable()->comment('Error message if failed');
            $table->char('started_by', 36)->nullable()->comment('User UUID who initiated sync - FK to users.user_uuid');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('quotation_id', 'idx_sync_jobs_quotation');
            $table->index('status', 'idx_sync_jobs_status');
            $table->index('started_by', 'idx_sync_jobs_started_by');
            $table->index('created_at', 'idx_sync_jobs_created');
        });

        // Add comment to table
        DB::statement("ALTER TABLE `quotation_invoice_sync_jobs` COMMENT = 'Tracking table for quotation-invoice sync operations'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_invoice_sync_jobs');
    }
};
