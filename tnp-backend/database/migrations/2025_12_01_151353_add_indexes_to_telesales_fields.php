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
        Schema::table('master_customers', function (Blueprint $table) {
            // Add single column indexes for frequently queried fields
            $table->index('cus_allocation_status', 'idx_cus_allocation_status');
            $table->index('cus_source', 'idx_cus_source');
            $table->index('cus_allocated_at', 'idx_cus_allocated_at');
            
            // Add composite index for common query pattern (pool customers by source)
            $table->index(['cus_allocation_status', 'cus_source'], 'idx_cus_allocation_source');
            
            // Add composite index for date-based allocation queries
            $table->index(['cus_allocated_at', 'cus_manage_by'], 'idx_cus_allocated_manager');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_customers', function (Blueprint $table) {
            // Drop indexes in reverse order
            $table->dropIndex('idx_cus_allocated_manager');
            $table->dropIndex('idx_cus_allocation_source');
            $table->dropIndex('idx_cus_allocated_at');
            $table->dropIndex('idx_cus_source');
            $table->dropIndex('idx_cus_allocation_status');
        });
    }
};
