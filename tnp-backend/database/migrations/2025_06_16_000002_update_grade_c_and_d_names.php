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
        // Update grade C to Grade C
        DB::table('master_customer_groups')
            ->where('mcg_name', 'C')
            ->update([
                'mcg_name' => 'Grade C',
                'updated_at' => now()
            ]);

        // Update grade D to Grade D
        DB::table('master_customer_groups')
            ->where('mcg_name', 'D')
            ->update([
                'mcg_name' => 'Grade D',
                'updated_at' => now()
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to C and D
        DB::table('master_customer_groups')
            ->where('mcg_name', 'Grade C')
            ->update([
                'mcg_name' => 'C',
                'updated_at' => now()
            ]);

        DB::table('master_customer_groups')
            ->where('mcg_name', 'Grade D')
            ->update([
                'mcg_name' => 'D',
                'updated_at' => now()
            ]);
    }
};
