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
        Schema::create('customer_transfer_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id')->comment('FK: master_customers.cus_id');
            $table->tinyInteger('previous_channel')->comment('1=sales, 2=online, 3=office');
            $table->tinyInteger('new_channel')->comment('1=sales, 2=online, 3=office');
            $table->bigInteger('previous_manage_by')->nullable()->comment('User ID เดิม');
            $table->bigInteger('new_manage_by')->nullable()->comment('User ID ใหม่');
            $table->unsignedBigInteger('action_by_user_id')->comment('ผู้ทำการโอน');
            $table->text('remark')->nullable()->comment('หมายเหตุ');
            $table->timestamp('created_at')->useCurrent();

            // Indexes for query performance
            $table->index('customer_id', 'idx_cth_customer_id');
            $table->index('action_by_user_id', 'idx_cth_action_by');
            $table->index('created_at', 'idx_cth_created_at');

            // Foreign Keys
            $table->foreign('customer_id', 'fk_cth_customer')
                ->references('cus_id')
                ->on('master_customers')
                ->onDelete('cascade');
                
            $table->foreign('action_by_user_id', 'fk_cth_action_by')
                ->references('user_id')
                ->on('users')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_transfer_history');
    }
};
