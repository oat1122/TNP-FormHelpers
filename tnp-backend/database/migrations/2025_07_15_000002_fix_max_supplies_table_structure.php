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
        // Backup existing data
        $existingData = DB::table('max_supplies')->get();
        
        // Drop and recreate the table with correct structure
        Schema::dropIfExists('max_supplies');
        
        Schema::create('max_supplies', function (Blueprint $table) {
            $table->uuid('id')->primary(); // Use UUID as primary key
            $table->string('code', 50)->unique()->comment('รหัสงาน MS-001, MS-002');
            $table->char('worksheet_id', 36)->comment('ไอดีตาราง new_worksheets');
            $table->string('title', 255)->comment('ชื่องาน');
            $table->string('customer_name', 255)->comment('ชื่อลูกค้า');
            $table->enum('production_type', ['screen', 'dtf', 'sublimation', 'embroidery'])->comment('ประเภทการผลิต');

            // วันที่
            $table->date('start_date')->comment('วันที่เริ่มผลิต');
            $table->date('expected_completion_date')->comment('วันที่คาดว่าจะเสร็จ');
            $table->date('due_date')->comment('วันครบกำหนด');
            $table->date('actual_completion_date')->nullable()->comment('วันที่เสร็จจริง');

            // สถานะ
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');

            // ข้อมูลการผลิต
            $table->enum('shirt_type', ['polo', 't-shirt', 'hoodie', 'tank-top'])->comment('ประเภทเสื้อ');
            $table->integer('total_quantity')->comment('จำนวนรวม');
            $table->integer('completed_quantity')->default(0)->comment('จำนวนที่เสร็จแล้ว');
            $table->json('sizes')->comment('ขนาดและจำนวน {"S": 50, "M": 150, "L": 200, "XL": 100}');

            // จุดพิมพ์แยกตามประเภท
            $table->integer('screen_points')->default(0);
            $table->integer('dtf_points')->default(0);
            $table->integer('sublimation_points')->default(0);
            $table->integer('embroidery_points')->default(0);

            // หมายเหตุ
            $table->text('notes')->nullable();
            $table->text('special_instructions')->nullable();
            $table->json('work_calculations')->nullable()->comment('การคำนวณงานแต่ละประเภทการพิมพ์');

            // ผู้สร้างและแก้ไข
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();

            $table->timestamps();

            // Indexes
            $table->index('code');
            $table->index('worksheet_id');
            $table->index('production_type');
            $table->index('status');
            $table->index('start_date');
            $table->index('due_date');
            $table->index('created_by');
        });

        // Restore data with proper conversion and new UUIDs
        foreach ($existingData as $data) {
            DB::table('max_supplies')->insert([
                'id' => \Illuminate\Support\Str::uuid(), // Generate new UUID
                'code' => $data->code,
                'worksheet_id' => $data->worksheet_id,
                'title' => $data->title,
                'customer_name' => $data->customer_name,
                'production_type' => $data->production_type,
                'start_date' => $data->start_date,
                'expected_completion_date' => $data->expected_completion_date,
                'due_date' => $data->due_date,
                'actual_completion_date' => $data->actual_completion_date ?: null,
                'status' => $data->status,
                'priority' => $data->priority,
                'shirt_type' => $data->shirt_type,
                'total_quantity' => (int) $data->total_quantity,
                'completed_quantity' => (int) $data->completed_quantity,
                'sizes' => $data->sizes,
                'screen_points' => (int) $data->screen_points,
                'dtf_points' => (int) $data->dtf_points,
                'sublimation_points' => (int) $data->sublimation_points,
                'embroidery_points' => (int) $data->embroidery_points,
                'notes' => $data->notes ?: null,
                'special_instructions' => $data->special_instructions ?: null,
                'work_calculations' => $data->work_calculations ?: null,
                'created_by' => $data->created_by,
                'updated_by' => $data->updated_by,
                'created_at' => $data->created_at,
                'updated_at' => $data->updated_at,
            ]);
        }

        // Note: Foreign key constraints will be added separately if needed
        // เพิ่ม Foreign Key Constraints แยกออกมา
        // if (Schema::hasTable('new_worksheets')) {
        //     Schema::table('max_supplies', function (Blueprint $table) {
        //         $table->foreign('worksheet_id')
        //               ->references('worksheet_id')
        //               ->on('new_worksheets')
        //               ->onDelete('cascade');
        //     });
        // }

        // เพิ่ม Foreign Key สำหรับ users ก็ต่อเมื่อ table มีอยู่
        // if (Schema::hasTable('users')) {
        //     Schema::table('max_supplies', function (Blueprint $table) {
        //         $table->foreign('created_by')->references('user_id')->on('users')->onDelete('set null');
        //         $table->foreign('updated_by')->references('user_id')->on('users')->onDelete('set null');
        //     });
        // }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('max_supplies');
    }
};
