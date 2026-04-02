<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->string('nb_workflow')->default('standard')->after('nb_remarks');
            $table->json('nb_lead_payload')->nullable()->after('nb_workflow');
            $table->timestamp('nb_claimed_at')->nullable()->after('nb_lead_payload');
            $table->char('nb_converted_customer_id', 36)->nullable()->after('nb_converted_at');

            $table->index(['nb_workflow', 'nb_manage_by', 'nb_converted_at'], 'idx_notebooks_workflow_queue');
            $table->index(['created_by', 'nb_workflow', 'created_at'], 'idx_notebooks_creator_workflow');
        });
    }

    public function down(): void
    {
        Schema::table('notebooks', function (Blueprint $table) {
            $table->dropIndex('idx_notebooks_workflow_queue');
            $table->dropIndex('idx_notebooks_creator_workflow');
            $table->dropColumn([
                'nb_workflow',
                'nb_lead_payload',
                'nb_claimed_at',
                'nb_converted_customer_id',
            ]);
        });
    }
};
