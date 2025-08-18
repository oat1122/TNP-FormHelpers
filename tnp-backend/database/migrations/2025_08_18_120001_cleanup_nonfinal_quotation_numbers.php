<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Replace any official-looking numbers on non-final quotations with DRAFT placeholders
        // so sequences can be reused. Final statuses keep their numbers.
        $rows = DB::table('quotations')
            ->select('id', 'number')
            ->whereNotIn('status', ['approved', 'sent', 'completed'])
            ->whereNotNull('number')
            ->where('number', 'not like', 'DRAFT-%')
            ->get();

        foreach ($rows as $row) {
            $suffix = substr(str_replace('-', '', (string)$row->id), -8);
            DB::table('quotations')->where('id', $row->id)->update([
                'number' => 'DRAFT-' . $suffix,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Non-destructive: we won't attempt to restore previous numbers
    }
};
