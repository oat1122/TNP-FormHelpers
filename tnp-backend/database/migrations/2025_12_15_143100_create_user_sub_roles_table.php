<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_sub_roles', function (Blueprint $table) {
            $table->char('usr_id', 36)->primary()->comment('Primary key UUID');
            $table->unsignedBigInteger('usr_user_id')->comment('FK: users.user_id');
            $table->char('usr_sub_role_id', 36)->comment('FK: master_sub_roles.msr_id');
            $table->timestamp('created_at')->useCurrent();
            $table->bigInteger('created_by')->nullable()->comment('ผู้สร้าง');

            // Unique constraint to prevent duplicate assignments
            $table->unique(['usr_user_id', 'usr_sub_role_id'], 'unique_user_sub_role');

            // Indexes for query performance
            $table->index('usr_user_id', 'idx_usr_user_id');
            $table->index('usr_sub_role_id', 'idx_usr_sub_role_id');
        });

        // Set charset and collation to match related tables
        DB::statement('ALTER TABLE user_sub_roles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        // Add foreign keys after charset conversion
        Schema::table('user_sub_roles', function (Blueprint $table) {
            $table->foreign('usr_user_id', 'fk_usr_user')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('usr_sub_role_id', 'fk_usr_sub_role')
                ->references('msr_id')
                ->on('master_sub_roles')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_sub_roles');
    }
};
