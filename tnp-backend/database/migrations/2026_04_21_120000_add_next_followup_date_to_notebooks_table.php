<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->date('nb_next_followup_date')->nullable()->after('nb_remarks');
            $table->index(
                ['nb_manage_by', 'nb_next_followup_date'],
                'notebooks_manage_by_next_followup_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->dropIndex('notebooks_manage_by_next_followup_idx');
            $table->dropColumn('nb_next_followup_date');
        });
    }
};
