<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('quotation_items')) {
            return;
        }

        // ---- Helpers ----
        $indexExists = function (string $table, string $index) {
            $db = DB::getDatabaseName();
            $res = DB::selectOne(
                'SELECT COUNT(1) AS cnt FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
                [$db, $table, $index]
            );
            return ($res && (int)$res->cnt > 0);
        };

        $getFkNameOnColumn = function (string $table, string $column): ?string {
            $row = DB::selectOne("
                SELECT CONSTRAINT_NAME AS name
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1
            ", [$table, $column]);
            return $row ? $row->name : null;
        };

        // ---- 0) DROP FK ก่อนแก้คอลัมน์ที่เกี่ยวข้อง ----
        if ($fkName = $getFkNameOnColumn('quotation_items', 'quotation_id')) {
            DB::statement("ALTER TABLE `quotation_items` DROP FOREIGN KEY `{$fkName}`");
        }

        // ---- 1) Force column definitions & defaults ----
        // บางระบบอาจไม่รองรับ DEFAULT (UUID()) -> หุ้ม try/catch ไว้
        try {
            DB::statement("ALTER TABLE `quotation_items` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())");
        } catch (\Throwable $e) {
            // fallback: แค่บังคับชนิด ไม่ตั้ง default
            DB::statement("ALTER TABLE `quotation_items` MODIFY `id` CHAR(36) NOT NULL");
        }

        DB::statement("ALTER TABLE `quotation_items` MODIFY `quotation_id` CHAR(36) NOT NULL COMMENT 'อ้างอิงถึง quotations.id'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `pricing_request_id` CHAR(36) NULL COMMENT 'อ้างอิงถึง pricing_requests.pr_id'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `item_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อสินค้า/งาน'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `item_description` TEXT NULL COMMENT 'รายละเอียดสินค้า'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `sequence_order` INT(11) NOT NULL DEFAULT 1 COMMENT 'ลำดับการแสดงผล'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `pattern` VARCHAR(255) NULL COMMENT 'แพทเทิร์น'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `fabric_type` VARCHAR(255) NULL COMMENT 'ประเภทผ้า'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `color` VARCHAR(255) NULL COMMENT 'สี'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `size` VARCHAR(255) NULL COMMENT 'ขนาด'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `quantity` INT(11) NOT NULL DEFAULT 0 COMMENT 'จำนวน'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `unit` VARCHAR(50) NOT NULL DEFAULT 'ชิ้น' COMMENT 'หน่วยนับ'");

        // ---- 2) Generated columns ----
        try { DB::statement('ALTER TABLE `quotation_items` DROP COLUMN `subtotal`'); } catch (\Throwable $e) {}
        try { DB::statement('ALTER TABLE `quotation_items` DROP COLUMN `final_amount`'); } catch (\Throwable $e) {}

        DB::statement("ALTER TABLE `quotation_items`
            ADD `subtotal` DECIMAL(12,2)
            GENERATED ALWAYS AS (`unit_price` * `quantity`) STORED
            COMMENT 'ยอดรวม (คำนวณอัตโนมัติ)'
            AFTER `unit`"
        );

        DB::statement("ALTER TABLE `quotation_items` MODIFY `discount_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลดเปอร์เซ็นต์'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินส่วนลด'");

        DB::statement("ALTER TABLE `quotation_items`
            ADD `final_amount` DECIMAL(12,2)
            GENERATED ALWAYS AS ((`unit_price` * `quantity`) - `discount_amount`) STORED
            COMMENT 'ยอดสุทธิหลังหักส่วนลด'
            AFTER `discount_amount`"
        );

        // ---- 3) JSON column & CHECK (best-effort) ----
        try {
            DB::statement("ALTER TABLE `quotation_items` MODIFY `item_images` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL COMMENT 'รูปภาพสินค้า (JSON array)'");
            try { DB::statement('ALTER TABLE `quotation_items` DROP CHECK `ck_quotation_items_item_images_json`'); } catch (\Throwable $e) {}
            DB::statement('ALTER TABLE `quotation_items` ADD CONSTRAINT `ck_quotation_items_item_images_json` CHECK (json_valid(`item_images`))');
        } catch (\Throwable $e) {
            // ignore for engines that don't support it
        }

        // ---- 4) Notes/Status/Audit/Timestamps ----
        DB::statement("ALTER TABLE `quotation_items` MODIFY `notes` TEXT NULL COMMENT 'หมายเหตุสำหรับรายการนี้'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `status` ENUM('draft','confirmed','in_production','completed','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'สถานะของรายการสินค้า'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `created_by` CHAR(36) NULL COMMENT 'ผู้สร้าง'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `updated_by` CHAR(36) NULL COMMENT 'ผู้แก้ไขล่าสุด'");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()");
        DB::statement("ALTER TABLE `quotation_items` MODIFY `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()");

        // ---- 5) Indexes (ไม่ลบของเดิม ป้องกัน 1553) ----
        if (!$indexExists('quotation_items', 'quotation_items_quotation_id_index')) {
            DB::statement('ALTER TABLE `quotation_items` ADD INDEX `quotation_items_quotation_id_index` (`quotation_id`)');
        }
        if (!$indexExists('quotation_items', 'quotation_items_pricing_request_id_index')) {
            DB::statement('ALTER TABLE `quotation_items` ADD INDEX `quotation_items_pricing_request_id_index` (`pricing_request_id`)');
        }
        if (!$indexExists('quotation_items', 'quotation_items_sequence_order_index')) {
            DB::statement('ALTER TABLE `quotation_items` ADD INDEX `quotation_items_sequence_order_index` (`sequence_order`)');
        }
        if (!$indexExists('quotation_items', 'quotation_items_status_index')) {
            DB::statement('ALTER TABLE `quotation_items` ADD INDEX `quotation_items_status_index` (`status`)');
        }
        if (!$indexExists('quotation_items', 'idx_quotation_items_order')) {
            DB::statement('ALTER TABLE `quotation_items` ADD INDEX `idx_quotation_items_order` (`quotation_id`,`sequence_order`)');
        }

        // ---- 6) ADD FK กลับภายหลังจากทุกอย่างนิ่ง ----
        DB::statement('ALTER TABLE `quotation_items`
            ADD CONSTRAINT `quotation_items_quotation_id_foreign`
            FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`)
            ON DELETE CASCADE
        ');
    }

    public function down(): void
    {
        // no-op: เลี่ยง destructive rollback
    }
};
