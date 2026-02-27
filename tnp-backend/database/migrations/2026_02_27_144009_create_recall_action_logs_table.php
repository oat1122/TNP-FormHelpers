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
        Schema::create('recall_action_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->char('customer_id', 36);
            $table->unsignedBigInteger('user_id');
            
            $table->dateTime('previous_datetime')->nullable();
            $table->dateTime('new_datetime');
            $table->text('recall_note')->nullable();
            $table->char('customer_group_id', 36)->nullable();
            
            // Context when the recall was pressed
            $table->boolean('was_overdue')->default(false);
            $table->integer('days_overdue')->default(0);
            
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes
            $table->index('customer_id', 'idx_customer');
            $table->index('user_id', 'idx_user');
            $table->index('created_at', 'idx_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recall_action_logs');
    }
};
