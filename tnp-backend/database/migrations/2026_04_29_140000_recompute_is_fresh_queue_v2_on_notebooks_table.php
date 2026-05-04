<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('notebooks')->update(['nb_is_fresh_queue' => false]);

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
        // No-op: this migration only recomputes the boolean flag and is safe to leave in place.
    }
};
