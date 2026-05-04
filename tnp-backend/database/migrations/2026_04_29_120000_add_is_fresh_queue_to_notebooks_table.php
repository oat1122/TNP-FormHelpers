<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->boolean('nb_is_fresh_queue')->default(false)->after('nb_is_favorite');
            $table->index(
                ['nb_manage_by', 'nb_is_fresh_queue'],
                'notebooks_manage_by_fresh_queue_idx'
            );
        });

        DB::table('notebooks')
            ->where('nb_workflow', 'lead_queue')
            ->whereNotNull('nb_manage_by')
            ->whereNull('nb_converted_at')
            ->where(fn ($q) => $q->whereNull('nb_status')->orWhere('nb_status', ''))
            ->whereNull('nb_next_followup_date')
            ->where(fn ($q) => $q->whereNull('nb_next_followup_note')->orWhere('nb_next_followup_note', ''))
            ->update(['nb_is_fresh_queue' => true]);
    }

    public function down(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->dropIndex('notebooks_manage_by_fresh_queue_idx');
            $table->dropColumn('nb_is_fresh_queue');
        });
    }
};
