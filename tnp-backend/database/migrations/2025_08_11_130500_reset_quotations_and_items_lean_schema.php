<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Non-prod safe: Drop and recreate quotations + quotation_items with a lean schema.
     */
    public function up(): void
    {
        // Disable foreign key checks (session scope)
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        // Drop child then parent
        DB::statement('DROP TABLE IF EXISTS `quotation_items`');
        DB::statement('DROP TABLE IF EXISTS `quotations`');

        // Create quotations (LEAN)
        DB::statement(<<<SQL
        CREATE TABLE `quotations` (
          `id` CHAR(36) NOT NULL DEFAULT (uuid()),
          `number` VARCHAR(50) NOT NULL COMMENT 'เลขที่ใบเสนอราคา',
          `customer_id` CHAR(36) DEFAULT NULL COMMENT 'ref master_customers.cus_id',
          `primary_pricing_request_id` CHAR(36) DEFAULT NULL COMMENT 'ref pricing_requests.pr_id',
          `primary_pricing_request_ids` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array ของ PR IDs' CHECK (json_valid(`primary_pricing_request_ids`)),
          `customer_snapshot` JSON DEFAULT NULL COMMENT 'snapshot ข้อมูลลูกค้า ณ เวลาออกใบ',
          `work_name` VARCHAR(100) DEFAULT NULL COMMENT 'ชื่องาน (หัวใบ)',
          `status` ENUM('draft','pending_review','approved','rejected','sent','completed') NOT NULL DEFAULT 'draft' COMMENT 'สถานะใบเสนอราคา',
          `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาก่อนภาษี',
          `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนภาษี',
          `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคารวม',
          `deposit_percentage` INT(11) NOT NULL DEFAULT 0 COMMENT 'เปอร์เซ็นต์เงินมัดจำ',
          `deposit_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินมัดจำ',
          `payment_terms` VARCHAR(50) DEFAULT NULL COMMENT 'เงื่อนไขการชำระเงิน',
          `due_date` DATE DEFAULT NULL COMMENT 'วันครบกำหนด',
          `notes` TEXT DEFAULT NULL COMMENT 'หมายเหตุ',
          `created_by` CHAR(36) DEFAULT NULL COMMENT 'ผู้สร้าง (ref users.user_uuid)',
          `updated_by` CHAR(36) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด (ref users.user_uuid)',
          `approved_by` CHAR(36) DEFAULT NULL COMMENT 'ผู้อนุมัติ (ref users.user_uuid)',
          `approved_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'วันที่อนุมัติ',
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
          `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `quotations_number_unique` (`number`),
          KEY `quotations_status_index` (`status`),
          KEY `quotations_customer_id_index` (`customer_id`),
          KEY `quotations_created_at_index` (`created_at`),
          KEY `quotations_due_date_index` (`due_date`),
          KEY `idx_quotations_primary_pricing_request` (`primary_pricing_request_id`),
          KEY `idx_quotations_created_by` (`created_by`),
          KEY `idx_quotations_updated_by` (`updated_by`),
          KEY `idx_quotations_approved_by` (`approved_by`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางใบเสนอราคา (LEAN)';
        SQL);

        // Create quotation_items
        DB::statement(<<<SQL
        CREATE TABLE `quotation_items` (
          `id` CHAR(36) NOT NULL DEFAULT (uuid()),
          `quotation_id` CHAR(36) NOT NULL COMMENT 'ref quotations.id',
          `pricing_request_id` CHAR(36) DEFAULT NULL COMMENT 'ref pricing_requests.pr_id',
          `item_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อสินค้า/งาน',
          `item_description` TEXT DEFAULT NULL COMMENT 'รายละเอียดสินค้า',
          `sequence_order` INT(11) NOT NULL DEFAULT 1 COMMENT 'ลำดับการแสดงผลต่อใบ',
          `pattern` VARCHAR(255) DEFAULT NULL COMMENT 'แพทเทิร์น',
          `fabric_type` VARCHAR(255) DEFAULT NULL COMMENT 'ประเภทผ้า',
          `color` VARCHAR(255) DEFAULT NULL COMMENT 'สี',
          `size` VARCHAR(255) DEFAULT NULL COMMENT 'ขนาด',
          `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย',
          `quantity` INT(11) NOT NULL DEFAULT 0 COMMENT 'จำนวน',
          `unit` VARCHAR(50) NOT NULL DEFAULT 'ชิ้น' COMMENT 'หน่วยนับ',
          `subtotal` DECIMAL(12,2) GENERATED ALWAYS AS ((`unit_price` * `quantity`)) STORED COMMENT 'ยอดรวม (auto)',
          `discount_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลด %',
          `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนส่วนลด',
          `final_amount` DECIMAL(12,2) GENERATED ALWAYS AS (((`unit_price` * `quantity`) - `discount_amount`)) STORED COMMENT 'ยอดสุทธิหลังหักส่วนลด',
          `item_images` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'รูปภาพสินค้า (JSON array)',
          `notes` TEXT DEFAULT NULL COMMENT 'หมายเหตุรายการ',
          `status` ENUM('draft','confirmed','in_production','completed','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'สถานะของรายการ',
          `created_by` CHAR(36) DEFAULT NULL COMMENT 'ผู้สร้าง (ref users.user_uuid)',
          `updated_by` CHAR(36) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด (ref users.user_uuid)',
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
          `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `uq_qitems_quotation_sequence` (`quotation_id`,`sequence_order`),
          KEY `quotation_items_quotation_id_index` (`quotation_id`),
          KEY `quotation_items_pricing_request_id_index` (`pricing_request_id`),
          KEY `quotation_items_sequence_order_index` (`sequence_order`),
          KEY `quotation_items_status_index` (`status`),
          CONSTRAINT `ck_quotation_items_item_images_json` CHECK (json_valid(`item_images`))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรายละเอียดสินค้าในใบเสนอราคา (LEAN)';
        SQL);

        // Foreign Keys (after tables exist)
  // Ensure referenced columns are indexed (MySQL requires an index on referenced columns)
  DB::statement("CREATE INDEX IF NOT EXISTS idx_users_user_uuid ON `users` (`user_uuid`)");

        DB::statement(<<<SQL
        ALTER TABLE `quotations`
          ADD CONSTRAINT `fk_quotations_customer`
            FOREIGN KEY (`customer_id`) REFERENCES `master_customers` (`cus_id`)
            ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT `fk_quotations_primary_pr`
            FOREIGN KEY (`primary_pricing_request_id`) REFERENCES `pricing_requests` (`pr_id`)
            ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT `fk_quotations_created_by`
            FOREIGN KEY (`created_by`) REFERENCES `users` (`user_uuid`)
            ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT `fk_quotations_updated_by`
            FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_uuid`)
            ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT `fk_quotations_approved_by`
            FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_uuid`)
            ON UPDATE CASCADE ON DELETE SET NULL;
        SQL);

        DB::statement(<<<SQL
        ALTER TABLE `quotation_items`
          ADD CONSTRAINT `quotation_items_quotation_id_foreign`
            FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
          ADD CONSTRAINT `fk_qitems_pricing_request`
            FOREIGN KEY (`pricing_request_id`) REFERENCES `pricing_requests` (`pr_id`)
            ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT `fk_qitems_created_by`
            FOREIGN KEY (`created_by`) REFERENCES `users` (`user_uuid`)
            ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT `fk_qitems_updated_by`
            FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_uuid`)
            ON UPDATE CASCADE ON DELETE SET NULL;
        SQL);

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');
        DB::statement('DROP TABLE IF EXISTS `quotation_items`');
        DB::statement('DROP TABLE IF EXISTS `quotations`');
        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
    }
};
