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
        Schema::table('master_customers', function (Blueprint $table) {
            // Add new columns after cus_channel
            $table->enum('cus_source', ['sales', 'telesales', 'online', 'office'])
                ->default('sales')
                ->after('cus_channel')
                ->comment('Source of customer: sales=direct sales, telesales=phone sales, online=website, office=walk-in');
            
            $table->enum('cus_allocation_status', ['pool', 'allocated'])
                ->default('allocated')
                ->after('cus_source')
                ->comment('Allocation status: pool=waiting for assignment, allocated=assigned to sales');
            
            $table->bigInteger('cus_allocated_by')
                ->unsigned()
                ->nullable()
                ->after('cus_allocation_status')
                ->comment('User ID who allocated this customer from pool');
            
            $table->timestamp('cus_allocated_at')
                ->nullable()
                ->after('cus_allocated_by')
                ->comment('Timestamp when customer was allocated');
            
            // Add foreign key constraint for cus_allocated_by
            $table->foreign('cus_allocated_by')
                ->references('user_id')
                ->on('users')
                ->onDelete('set null');
        });

        // Backfill existing data
        // Set all existing customers as 'sales' source and 'allocated' status
        // This ensures backward compatibility with existing reports
        DB::table('master_customers')->update([
            'cus_source' => 'sales',
            'cus_allocation_status' => 'allocated',
            'cus_channel' => DB::raw('COALESCE(cus_channel, 1)'), // Default to 1 (sales) if null
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_customers', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['cus_allocated_by']);
            
            // Drop columns in reverse order
            $table->dropColumn([
                'cus_allocated_at',
                'cus_allocated_by',
                'cus_allocation_status',
                'cus_source',
            ]);
        });
    }
};
