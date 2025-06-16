<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert grade C
        DB::table('master_customer_groups')->insert([
            'mcg_id' => Str::uuid()->toString(),
            'mcg_name' => 'C',
            'mcg_remark' => 'Grade C Customer',
            'mcg_recall_default' => '60 day',
            'mcg_sort' => 3,
            'mcg_is_use' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Insert grade D
        DB::table('master_customer_groups')->insert([
            'mcg_id' => Str::uuid()->toString(),
            'mcg_name' => 'D',
            'mcg_remark' => 'Grade D Customer',
            'mcg_recall_default' => '60 day',
            'mcg_sort' => 4,
            'mcg_is_use' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove grades C and D
        DB::table('master_customer_groups')
            ->where('mcg_name', 'C')
            ->orWhere('mcg_name', 'D')
            ->delete();
    }
};
