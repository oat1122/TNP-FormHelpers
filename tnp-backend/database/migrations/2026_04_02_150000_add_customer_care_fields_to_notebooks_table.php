<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->string('nb_entry_type')->default('standard')->after('nb_workflow');
            $table->string('nb_source_type')->nullable()->after('nb_entry_type');
            $table->char('nb_source_customer_id', 36)->nullable()->after('nb_source_type');
            $table->unsignedBigInteger('nb_source_notebook_id')->nullable()->after('nb_source_customer_id');

            $table->index('nb_entry_type', 'notebooks_nb_entry_type_idx');
            $table->index(['nb_source_type', 'nb_source_customer_id'], 'notebooks_source_customer_idx');
            $table->index(['nb_source_type', 'nb_source_notebook_id'], 'notebooks_source_notebook_idx');
            $table->index(
                ['nb_manage_by', 'nb_entry_type', 'created_at'],
                'notebooks_manage_by_entry_type_created_at_idx'
            );
            $table->index(
                ['nb_manage_by', 'nb_entry_type', 'updated_at'],
                'notebooks_manage_by_entry_type_updated_at_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->dropIndex('notebooks_manage_by_entry_type_updated_at_idx');
            $table->dropIndex('notebooks_manage_by_entry_type_created_at_idx');
            $table->dropIndex('notebooks_source_notebook_idx');
            $table->dropIndex('notebooks_source_customer_idx');
            $table->dropIndex('notebooks_nb_entry_type_idx');

            $table->dropColumn([
                'nb_entry_type',
                'nb_source_type',
                'nb_source_customer_id',
                'nb_source_notebook_id',
            ]);
        });
    }
};
