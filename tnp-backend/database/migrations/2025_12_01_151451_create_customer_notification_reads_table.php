<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customer_notification_reads', function (Blueprint $table) {
            $table->id();
            
            // ใช้ char(36) แทน uuid() และบังคับ charset/collation ให้ตรงกับ master_customers
            $table->char('cus_id', 36)
                ->charset('utf8mb4')
                ->collation('utf8mb4_unicode_ci')
                ->comment('Customer ID from master_customers');
            
            $table->bigInteger('user_id')->unsigned()->comment('User ID who read the notification');
            $table->timestamp('read_at')->useCurrent()->comment('When the notification was read');
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('cus_id')
                ->references('cus_id')
                ->on('master_customers')
                ->onDelete('cascade');
                
            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade');
            
            // Unique constraint to prevent duplicate reads
            $table->unique(['cus_id', 'user_id'], 'unique_customer_user_read');
            
            // Index for fast lookups
            $table->index(['user_id', 'read_at'], 'idx_user_read_at');
        });
        
        // บังคับ charset/collation ของตารางทั้งตาราง (optional แต่แนะนำ)
        DB::statement('ALTER TABLE customer_notification_reads ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_notification_reads');
    }
};
