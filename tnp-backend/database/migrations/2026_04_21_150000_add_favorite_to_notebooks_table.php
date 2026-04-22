<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->boolean('nb_is_favorite')->default(false)->after('nb_next_followup_note');
            $table->index(
                ['nb_manage_by', 'nb_is_favorite'],
                'notebooks_manage_by_favorite_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->dropIndex('notebooks_manage_by_favorite_idx');
            $table->dropColumn('nb_is_favorite');
        });
    }
};
