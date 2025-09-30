<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('delivery_notes', 'invoice_id')) {
                $table->char('invoice_id', 36)->nullable()->after('receipt_id');
                $table->index('invoice_id', 'delivery_notes_invoice_id_index');
            }

            if (!Schema::hasColumn('delivery_notes', 'invoice_item_id')) {
                $table->char('invoice_item_id', 36)->nullable()->after('invoice_id');
                $table->index('invoice_item_id', 'delivery_notes_invoice_item_id_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (Schema::hasColumn('delivery_notes', 'invoice_item_id')) {
                $table->dropIndex('delivery_notes_invoice_item_id_index');
                $table->dropColumn('invoice_item_id');
            }

            if (Schema::hasColumn('delivery_notes', 'invoice_id')) {
                $table->dropIndex('delivery_notes_invoice_id_index');
                $table->dropColumn('invoice_id');
            }
        });
    }
};
