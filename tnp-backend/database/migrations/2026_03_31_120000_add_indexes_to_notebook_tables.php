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
        Schema::table('notebooks', function (Blueprint $table) {
            $table->index(['nb_manage_by', 'created_at'], 'notebooks_manage_by_created_at_idx');
            $table->index(['nb_manage_by', 'updated_at'], 'notebooks_manage_by_updated_at_idx');
            $table->index('nb_date', 'notebooks_nb_date_idx');
            $table->index('nb_status', 'notebooks_nb_status_idx');
        });

        Schema::table('notebook_histories', function (Blueprint $table) {
            $table->index('created_at', 'notebook_histories_created_at_idx');
            $table->index(['action_by', 'created_at'], 'notebook_histories_action_by_created_at_idx');
            $table->index(['notebook_id', 'created_at'], 'notebook_histories_notebook_id_created_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notebook_histories', function (Blueprint $table) {
            $table->dropIndex('notebook_histories_notebook_id_created_at_idx');
            $table->dropIndex('notebook_histories_action_by_created_at_idx');
            $table->dropIndex('notebook_histories_created_at_idx');
        });

        Schema::table('notebooks', function (Blueprint $table) {
            $table->dropIndex('notebooks_nb_status_idx');
            $table->dropIndex('notebooks_nb_date_idx');
            $table->dropIndex('notebooks_manage_by_updated_at_idx');
            $table->dropIndex('notebooks_manage_by_created_at_idx');
        });
    }
};
