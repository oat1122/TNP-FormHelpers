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
        Schema::create('notebooks', function (Blueprint $table) {
            $table->id();
            $table->date('nb_date')->nullable();
            $table->string('nb_time')->nullable();
            $table->string('nb_customer_name')->nullable();
            $table->boolean('nb_is_online')->default(false);
            $table->text('nb_additional_info')->nullable();
            $table->string('nb_contact_number')->nullable();
            $table->string('nb_email')->nullable();
            $table->string('nb_contact_person')->nullable();
            $table->string('nb_action')->nullable();
            $table->string('nb_status')->nullable();
            $table->text('nb_remarks')->nullable();
            $table->timestamp('nb_converted_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notebooks');
    }
};
