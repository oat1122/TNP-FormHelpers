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
        Schema::create('recall_status_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('snapshot_date');
            
            // ข้อมูลลูกค้า
            $table->char('customer_id', 36);
            $table->string('customer_name', 255)->nullable();
            $table->char('customer_group_id', 36)->nullable();
            $table->enum('source', ['sales', 'telesales', 'online', 'office'])->nullable();
            
            // ข้อมูลเซลที่ดูแล
            $table->unsignedBigInteger('manage_by')->nullable();
            
            // สถานะ Recall ณ วันที่นั้น
            $table->enum('recall_status', ['overdue', 'in_criteria']);
            $table->dateTime('cd_last_datetime')->nullable();
            $table->integer('days_overdue')->default(0);
            
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes & Unique Constraints
            $table->unique(['snapshot_date', 'customer_id'], 'idx_unique_daily');
            $table->index('snapshot_date', 'idx_date');
            $table->index('manage_by', 'idx_manage_by');
            $table->index('recall_status', 'idx_status');
            $table->index('customer_id', 'idx_customer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recall_status_histories');
    }
};
