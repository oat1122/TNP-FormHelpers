-- tnpdb.activity_logs definition

CREATE TABLE `activity_logs` (
  `id` int(11) DEFAULT NULL,
  `max_supply_id` char(36) DEFAULT NULL COMMENT '(DC2Type:guid)',
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `description` varchar(50) DEFAULT NULL,
  `old_values` varchar(2048) DEFAULT NULL,
  `new_values` varchar(512) DEFAULT NULL,
  `created_at` varchar(50) DEFAULT NULL,
  `updated_at` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.cost_fabrics definition

CREATE TABLE `cost_fabrics` (
  `cost_fabric_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pattern_id` bigint(20) NOT NULL,
  `fabric_name` char(100) NOT NULL,
  `fabric_name_tnp` char(100) DEFAULT NULL,
  `supplier` char(100) DEFAULT NULL,
  `fabric_class` enum('R','P','PR') NOT NULL,
  `fabric_kg` double(8,2) DEFAULT NULL COMMENT '	จำนวนผ้า (กิโลกรัม)',
  `fabric_price_per_kg` double(8,2) DEFAULT NULL,
  `shirt_per_total` int(11) DEFAULT NULL COMMENT 'จำนวนเสื้อที่ตัดได้จากผ้าทั้งหมด',
  `shirt_per_kg` int(11) DEFAULT NULL,
  `cutting_price` double(8,2) DEFAULT 0.00,
  `sewing_price` double(8,2) DEFAULT NULL,
  `collar_kg` int(11) DEFAULT NULL COMMENT 'ราคาบุ้งคอต่อกิโลกรัม',
  `collar_price` int(11) DEFAULT NULL COMMENT 'ราคาปกคอ',
  `button_price` int(11) DEFAULT NULL COMMENT 'ราคากระดุม',
  `shirt_price_percent` int(11) DEFAULT NULL COMMENT 'เปอร์เซ็นต์กำไรราคาเสื้อ',
  `shirt_1k_price_percent` int(11) DEFAULT NULL COMMENT 'เปอร์เซ็นต์กำไรราคาเสื้อขั้นต่ำ 1000 ตัว',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`cost_fabric_id`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.customer definition

CREATE TABLE `customer` (
  `customer_id` int(10) NOT NULL AUTO_INCREMENT,
  `work_id` varchar(15) NOT NULL,
  `user_id` int(10) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_tel` varchar(20) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `customer_taxid` int(15) DEFAULT NULL,
  PRIMARY KEY (`customer_id`),
  KEY `work_id` (`work_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2594 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.customer_details definition

CREATE TABLE `customer_details` (
  `cd_id` char(36) NOT NULL DEFAULT uuid(),
  `cd_cus_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง master_customers',
  `cd_last_datetime` datetime DEFAULT NULL COMMENT 'วันที่สิ้นสุด',
  `cd_note` varchar(255) DEFAULT NULL COMMENT 'ข้อความสั้นๆ',
  `cd_remark` text DEFAULT NULL COMMENT 'หมายเหตุ',
  `cd_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `cd_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `cd_created_by` bigint(20) DEFAULT NULL COMMENT 'คนสร้างข้อมูล',
  `cd_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  `cd_updated_by` bigint(20) DEFAULT NULL COMMENT 'คนอัปเดตข้อมูล',
  PRIMARY KEY (`cd_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tnpdb.customers definition

CREATE TABLE `customers` (
  `customer_id` char(36) NOT NULL COMMENT 'ไอดีตาราง customers',
  `customer_name` varchar(100) DEFAULT '',
  `company_name` varchar(255) DEFAULT '',
  `customer_address` text DEFAULT '',
  `customer_tel` varchar(20) DEFAULT '',
  `customer_email` varchar(100) DEFAULT '',
  `customer_tax_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.customize_pattern definition

CREATE TABLE `customize_pattern` (
  `pattern_id` int(11) NOT NULL AUTO_INCREMENT,
  `work_id` varchar(15) NOT NULL,
  `pattern_name` varchar(100) NOT NULL,
  `chest_sss` float NOT NULL,
  `long_sss` float NOT NULL,
  `chest_ss` float NOT NULL,
  `long_ss` float NOT NULL,
  `chest_s` float NOT NULL,
  `long_s` float NOT NULL,
  `chest_m` float NOT NULL,
  `long_m` float NOT NULL,
  `chest_l` float NOT NULL,
  `long_l` float NOT NULL,
  `chest_xl` float NOT NULL,
  `long_xl` float NOT NULL,
  `chest_2xl` float NOT NULL,
  `long_2xl` float NOT NULL,
  `chest_3xl` float NOT NULL,
  `long_3xl` float NOT NULL,
  `chest_4xl` float NOT NULL,
  `long_4xl` float NOT NULL,
  `chest_5xl` float NOT NULL,
  `long_5xl` float NOT NULL,
  `chest_6xl` float NOT NULL,
  `long_6xl` float NOT NULL,
  `chest_7xl` float NOT NULL,
  `long_7xl` float NOT NULL,
  PRIMARY KEY (`pattern_id`),
  KEY `work_id` (`work_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2594 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.delivery_notes definition

CREATE TABLE `delivery_notes` (
  `id` char(36) NOT NULL,
  `delivery_no` varchar(255) NOT NULL,
  `receipt_id` char(36) DEFAULT NULL,
  `customer_id` char(36) NOT NULL,
  `status` enum('draft','pending_review','approved','rejected','completed','delivered') NOT NULL DEFAULT 'draft',
  `delivery_date` date NOT NULL,
  `delivery_address` text DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version_no` int(11) NOT NULL DEFAULT 1,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` char(36) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_notes_delivery_no_unique` (`delivery_no`),
  KEY `delivery_notes_status_index` (`status`),
  KEY `delivery_notes_customer_id_index` (`customer_id`),
  KEY `delivery_notes_delivery_date_index` (`delivery_date`),
  KEY `delivery_notes_created_at_index` (`created_at`),
  KEY `delivery_notes_delivery_no_index` (`delivery_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.document_attachments definition

CREATE TABLE `document_attachments` (
  `id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `document_type` enum('quotation','invoice','receipt','delivery_note') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `file_type` varchar(255) NOT NULL,
  `uploaded_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `document_attachments_document_id_document_type_index` (`document_id`,`document_type`),
  KEY `document_attachments_uploaded_by_index` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.document_status_history definition

CREATE TABLE `document_status_history` (
  `id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `document_type` enum('quotation','invoice','receipt','delivery_note') NOT NULL,
  `status_from` varchar(255) DEFAULT NULL,
  `status_to` varchar(255) NOT NULL,
  `action_type` enum('create','update','delete','approve','reject','revert') NOT NULL,
  `remarks` text DEFAULT NULL,
  `changed_by` char(36) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `document_status_history_document_id_document_type_index` (`document_id`,`document_type`),
  KEY `document_status_history_changed_at_index` (`changed_at`),
  KEY `document_status_history_action_type_index` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.example_quantity definition

CREATE TABLE `example_quantity` (
  `ex_id` int(11) NOT NULL AUTO_INCREMENT,
  `work_id` varchar(15) NOT NULL,
  `ex_sss` int(5) NOT NULL,
  `ex_ss` int(5) NOT NULL,
  `ex_s` int(5) NOT NULL,
  `ex_m` int(5) NOT NULL,
  `ex_l` int(5) NOT NULL,
  `ex_xl` int(5) NOT NULL,
  `ex_2xl` int(5) NOT NULL,
  `ex_3xl` int(5) NOT NULL,
  `ex_4xl` int(5) NOT NULL,
  `ex_5xl` int(5) NOT NULL,
  `ex_6xl` int(5) NOT NULL,
  PRIMARY KEY (`ex_id`),
  KEY `work_id` (`work_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2594 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.invoices definition

CREATE TABLE `invoices` (
  `id` char(36) NOT NULL,
  `invoice_no` varchar(255) NOT NULL,
  `quotation_id` char(36) DEFAULT NULL,
  `customer_id` char(36) NOT NULL,
  `status` enum('draft','pending_review','approved','rejected','completed') NOT NULL DEFAULT 'draft',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 7.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `credit_term_days` int(11) NOT NULL DEFAULT 30,
  `due_date` date DEFAULT NULL,
  `payment_status` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
  `remarks` text DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version_no` int(11) NOT NULL DEFAULT 1,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` char(36) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoice_no_unique` (`invoice_no`),
  KEY `invoices_status_index` (`status`),
  KEY `invoices_payment_status_index` (`payment_status`),
  KEY `invoices_customer_id_index` (`customer_id`),
  KEY `invoices_due_date_index` (`due_date`),
  KEY `invoices_created_at_index` (`created_at`),
  KEY `invoices_invoice_no_index` (`invoice_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.logs definition

CREATE TABLE `logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cost_fabric_id` bigint(20) unsigned DEFAULT NULL,
  `level` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.master_business_types definition

CREATE TABLE `master_business_types` (
  `bt_id` char(36) NOT NULL DEFAULT 'uuid()',
  `bt_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อประเภทธุรกิจ',
  `bt_sort` int(11) DEFAULT NULL COMMENT 'เรียงลำดับ',
  `bt_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`bt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.master_customer_groups definition

CREATE TABLE `master_customer_groups` (
  `mcg_id` char(36) NOT NULL DEFAULT uuid(),
  `mcg_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อกลุ่ม customer',
  `mcg_remark` varchar(255) DEFAULT NULL COMMENT 'รายละเอียดกลุ่ม customer',
  `mcg_recall_default` varchar(255) DEFAULT NULL COMMENT 'จำนวนวันและเวลาในการติดต่อลูกค้า',
  `mcg_sort` tinyint(4) DEFAULT NULL COMMENT 'ลำดับของกลุ่ม',
  `mcg_is_use` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`mcg_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tnpdb.master_customers definition

CREATE TABLE `master_customers` (
  `cus_id` char(36) NOT NULL DEFAULT uuid(),
  `cus_mcg_id` char(36) DEFAULT NULL COMMENT 'ไอดีตารางกลุ่ม customer',
  `cus_no` char(10) DEFAULT NULL COMMENT 'รหัสลูกค้า',
  `cus_channel` tinyint(4) DEFAULT NULL COMMENT '1=sales, 2=online, 3=office',
  `cus_bt_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง master_business_types',
  `cus_firstname` varchar(100) DEFAULT NULL COMMENT 'ชื่อลูกค้า',
  `cus_lastname` varchar(100) DEFAULT NULL COMMENT 'นามสกุลลูกค้า',
  `cus_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อเล่น',
  `cus_depart` varchar(100) DEFAULT NULL COMMENT 'ตำแหน่งหรือแผนก',
  `cus_company` varchar(255) DEFAULT NULL COMMENT 'ชื่อบริษัท',
  `cus_tel_1` char(20) DEFAULT NULL COMMENT 'เบอร์โทรหลัก',
  `cus_tel_2` char(20) DEFAULT NULL COMMENT 'เบอร์โทรสำรอง',
  `cus_email` varchar(100) DEFAULT NULL COMMENT 'อีเมลล์',
  `cus_tax_id` char(13) DEFAULT NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
  `cus_pro_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง provinces',
  `cus_dis_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง district',
  `cus_sub_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง subdistrict',
  `cus_zip_code` char(5) DEFAULT NULL COMMENT 'รหัสไปรษณีย์',
  `cus_address` text DEFAULT NULL COMMENT 'รายละเอียดที่อยู่',
  `cus_manage_by` bigint(20) DEFAULT NULL COMMENT 'คนดูแล',
  `cus_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `cus_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `cus_created_by` bigint(20) DEFAULT NULL COMMENT 'คนสร้างข้อมูล',
  `cus_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  `cus_updated_by` bigint(20) DEFAULT NULL COMMENT 'คนอัปเดตข้อมูล',
  PRIMARY KEY (`cus_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tnpdb.master_districts definition

CREATE TABLE `master_districts` (
  `dis_id` char(36) NOT NULL DEFAULT uuid(),
  `dis_name_th` varchar(50) DEFAULT NULL COMMENT 'ชื่ออำเภอ ภาษาไทย',
  `dis_name_en` varchar(50) DEFAULT NULL COMMENT 'ชื่ออำเภอ ภาษาอังกฤษ',
  `dis_sort_id` int(11) DEFAULT NULL COMMENT 'เลข id ใช้สำหรับ sort',
  `dis_pro_sort_id` int(11) DEFAULT NULL COMMENT 'sort id ของ provices',
  `dis_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  PRIMARY KEY (`dis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางอำเภอ';


-- tnpdb.master_geographies definition

CREATE TABLE `master_geographies` (
  `geo_id` char(36) NOT NULL DEFAULT uuid(),
  `geo_name` varchar(50) DEFAULT NULL COMMENT 'ชื่อภาค',
  `geo_sort_id` int(11) DEFAULT NULL COMMENT 'เลข id ใช้สำหรับ sort',
  `geo_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  PRIMARY KEY (`geo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางภาค';


-- tnpdb.master_product_categories definition

CREATE TABLE `master_product_categories` (
  `mpc_id` char(36) NOT NULL DEFAULT uuid(),
  `mpc_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อประเภทสินค้า',
  `mpc_remark` text DEFAULT NULL COMMENT 'รายละเอียดประเภทสินค้า',
  `mpc_is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สถานะการลบ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`mpc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประเภทสินค้า';


-- tnpdb.master_provices definition

CREATE TABLE `master_provices` (
  `pro_id` char(36) NOT NULL DEFAULT uuid(),
  `pro_name_th` varchar(50) DEFAULT NULL COMMENT 'ชื่อจังหวัด ภาษาไทย',
  `pro_name_en` varchar(50) DEFAULT NULL COMMENT 'ชื่อจังหวัด ภาษาอังกฤษ',
  `pro_sort_id` int(11) DEFAULT NULL COMMENT 'เลข id ใช้สำหรับ sort',
  `pro_geo_sort_id` int(11) DEFAULT NULL COMMENT 'sort id ของ geographies',
  `pro_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  PRIMARY KEY (`pro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางจังหวัด';


-- tnpdb.master_roles definition

CREATE TABLE `master_roles` (
  `role_id` char(36) NOT NULL DEFAULT uuid() COMMENT 'ไอดีตาราง roles',
  `role_name` varchar(50) DEFAULT NULL COMMENT 'ชื่อแผนก',
  `role_remark` text DEFAULT NULL COMMENT 'รายละเอียดแผนก',
  `role_is_deleted` tinyint(1) DEFAULT 0 COMMENT 'สถานะการลบ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางแผนก';


-- tnpdb.master_status definition

CREATE TABLE `master_status` (
  `status_id` char(36) NOT NULL DEFAULT uuid(),
  `status_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อสถานะ',
  `status_remark` text DEFAULT NULL COMMENT 'รายละเอียดสถานะ',
  `status_type` tinyint(4) DEFAULT NULL COMMENT '1=คำขอราคา',
  `status_is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สถานะการลบ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางสถานะ';


-- tnpdb.master_subdistricts definition

CREATE TABLE `master_subdistricts` (
  `sub_id` char(36) NOT NULL DEFAULT uuid(),
  `sub_name_th` varchar(50) DEFAULT NULL COMMENT 'ชื่อตำบล ภาษาไทย',
  `sub_name_en` varchar(50) DEFAULT NULL COMMENT 'ชื่อตำบล ภาษาอังกฤษ',
  `sub_sort_id` int(11) DEFAULT NULL COMMENT 'เลข id ใช้สำหรับ sort',
  `sub_dis_sort_id` int(11) DEFAULT NULL COMMENT 'sort id ของ districts',
  `sub_zip_code` char(5) DEFAULT NULL COMMENT 'รหัสไปรษณีย์',
  `sub_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  PRIMARY KEY (`sub_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางตำบล';


-- tnpdb.max_supplies definition

CREATE TABLE `max_supplies` (
  `id` char(36) NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'รหัสงาน MS-001, MS-002',
  `worksheet_id` char(36) NOT NULL COMMENT 'ไอดีตาราง new_worksheets',
  `title` varchar(255) NOT NULL COMMENT 'ชื่องาน',
  `customer_name` varchar(255) NOT NULL COMMENT 'ชื่อลูกค้า',
  `production_type` enum('screen','dtf','sublimation','embroidery') NOT NULL COMMENT 'ประเภทการผลิต',
  `start_date` date NOT NULL COMMENT 'วันที่เริ่มผลิต',
  `expected_completion_date` date NOT NULL COMMENT 'วันที่คาดว่าจะเสร็จ',
  `due_date` date NOT NULL COMMENT 'วันครบกำหนด',
  `actual_completion_date` date DEFAULT NULL COMMENT 'วันที่เสร็จจริง',
  `status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `shirt_type` enum('polo','t-shirt','hoodie','tank-top') NOT NULL COMMENT 'ประเภทเสื้อ',
  `total_quantity` int(11) NOT NULL COMMENT 'จำนวนรวม',
  `completed_quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'จำนวนที่เสร็จแล้ว',
  `sizes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ขนาดและจำนวน {"S": 50, "M": 150, "L": 200, "XL": 100}' CHECK (json_valid(`sizes`)),
  `screen_points` int(11) NOT NULL DEFAULT 0,
  `dtf_points` int(11) NOT NULL DEFAULT 0,
  `sublimation_points` int(11) NOT NULL DEFAULT 0,
  `embroidery_points` int(11) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `work_calculations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'การคำนวณงานแต่ละประเภทการพิมพ์' CHECK (json_valid(`work_calculations`)),
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `max_supplies_code_unique` (`code`),
  KEY `max_supplies_code_index` (`code`),
  KEY `max_supplies_worksheet_id_index` (`worksheet_id`),
  KEY `max_supplies_production_type_index` (`production_type`),
  KEY `max_supplies_status_index` (`status`),
  KEY `max_supplies_start_date_index` (`start_date`),
  KEY `max_supplies_due_date_index` (`due_date`),
  KEY `max_supplies_created_by_index` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.migrations definition

CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.new_worksheet_example_qty definition

CREATE TABLE `new_worksheet_example_qty` (
  `ex_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_example_qty',
  `worksheet_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheets',
  `ex_pattern_type` tinyint(4) DEFAULT NULL COMMENT '1=unisex, 2=men, 3=women',
  `ex_size_name` varchar(10) DEFAULT NULL COMMENT 'ชื่อไซซ์เสื้อตัวอย่าง',
  `ex_quantity` int(11) DEFAULT NULL COMMENT 'จำนวนเสื้อตัวอย่างตามไซซ์',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ex_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_fabric_customs definition

CREATE TABLE `new_worksheet_fabric_customs` (
  `fabric_custom_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_fabric_customs',
  `fabric_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_fabrics',
  `fabric_custom_color` varchar(100) DEFAULT NULL COMMENT 'สีผ้าส่วนบุ๊งคอ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`fabric_custom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_fabrics definition

CREATE TABLE `new_worksheet_fabrics` (
  `fabric_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_fabrics',
  `worksheet_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheets',
  `fabric_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อผ้า',
  `fabric_no` varchar(50) DEFAULT NULL COMMENT 'เบอร์ผ้า',
  `fabric_color` varchar(100) DEFAULT NULL COMMENT 'สีผ้า',
  `fabric_color_no` varchar(100) DEFAULT NULL COMMENT 'เบอร์สีผ้า',
  `fabric_factory` varchar(100) DEFAULT NULL,
  `crewneck_color` varchar(100) DEFAULT NULL COMMENT 'บุ๊งคอ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`fabric_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_polo_details definition

CREATE TABLE `new_worksheet_polo_details` (
  `polo_detail_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_polo_details',
  `worksheet_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheets',
  `collar` tinyint(4) DEFAULT NULL COMMENT '1=คอปก, 2=คอจีน, 3=ปกเชิ้ต',
  `collar_type` tinyint(4) DEFAULT NULL COMMENT '1=ปกธรรมดา, 2=ปกทอ/ขลิบปก, 3=ปกเจ็กการ์ด, 4=ปกเชิ้ต, 0=อื่นๆ',
  `other_collar_type` varchar(100) DEFAULT NULL COMMENT 'ชนิดคอปกอื่นๆ',
  `collar_type_detail` text DEFAULT NULL COMMENT 'รายละเอียดชนิดปกคอ',
  `placket` tinyint(4) DEFAULT NULL COMMENT '1=สาปปกติ, 2=สาปโชว์, 3=สาปแลป, 0=อื่นๆ',
  `other_placket` varchar(100) DEFAULT NULL COMMENT 'ชื่อรูปแบบสาปอื่นๆ',
  `outer_placket` tinyint(1) DEFAULT NULL COMMENT 'สาปนอก',
  `outer_placket_detail` text DEFAULT NULL COMMENT 'รายละเอียดสาปนอก',
  `inner_placket` tinyint(1) DEFAULT NULL COMMENT 'สาปนอก',
  `inner_placket_detail` text DEFAULT NULL COMMENT 'รายละเอียดสาปใน',
  `button` tinyint(4) DEFAULT NULL COMMENT '1=2เม็ด, 2=3เม็ด, 0=อื่นๆ',
  `other_button` varchar(100) DEFAULT NULL COMMENT 'ชื่อรูปแบบกระดุมอื่นๆ',
  `button_color` varchar(100) DEFAULT NULL COMMENT 'สีกระดุม',
  `sleeve` tinyint(4) DEFAULT NULL COMMENT '1=แขนปล่อย, 2=แขนซ้อน/แขนเบิล, 3=แขนจั๊มรอบ, 4=แขนจั๊มครึ่ง',
  `sleeve_detail` text DEFAULT NULL COMMENT 'รายละเอียดแขนเสื้อ',
  `pocket` tinyint(4) DEFAULT NULL COMMENT '1=กระเป๋าโชว์, 2=กระเป๋าเจาะ, 3=ไม่มีกระเป๋า',
  `pocket_detail` text DEFAULT NULL COMMENT 'รายละเอียดกระเป๋า',
  `bottom_hem` tinyint(1) DEFAULT NULL COMMENT 'ชายซ้อน',
  `bottom_hem_detail` text DEFAULT NULL COMMENT 'รายละเอียดชายซ้อน',
  `back_seam` tinyint(1) DEFAULT NULL COMMENT 'วงพระจันทร์',
  `back_seam_detail` text DEFAULT NULL COMMENT 'รายละเอียดวงพระจันทร์',
  `side_vents` tinyint(1) DEFAULT NULL COMMENT 'ผ่าข้างชายเสื้อ',
  `side_vents_detail` text DEFAULT NULL COMMENT 'รายละเอียดผ่าข้างชายเสื้อ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`polo_detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_polo_embroiders definition

CREATE TABLE `new_worksheet_polo_embroiders` (
  `polo_embroider_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_polo_embroiders',
  `polo_detail_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_polo_details',
  `embroider_position` tinyint(4) DEFAULT NULL COMMENT '1=ปักบนกระเป๋า, 2=ปักเหนือกระเป๋า, 3=ปักอกซ้าย, 4=ปักอกขวา, 5=ปักแขนซ้าย, 6=ปักแขนขวา, 7=ปักหลัง',
  `embroider_size` text DEFAULT NULL COMMENT 'ขนาดลายปัก',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`polo_embroider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_screens definition

CREATE TABLE `new_worksheet_screens` (
  `screen_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_screens',
  `screen_point` int(11) DEFAULT NULL,
  `screen_dft` int(11) DEFAULT NULL,
  `screen_flex` int(11) DEFAULT NULL,
  `screen_label` int(11) DEFAULT NULL,
  `screen_embroider` int(11) DEFAULT NULL,
  `screen_detail` text DEFAULT NULL COMMENT 'รายละเอียดลายสกรีน',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`screen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_shirt_patterns definition

CREATE TABLE `new_worksheet_shirt_patterns` (
  `pattern_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_shirt_patterns',
  `display_pattern_id` varchar(50) DEFAULT NULL COMMENT 'ไอดีแพทเทิร์นเสื้อสำหรับแสดงผล',
  `pattern_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อแพทเทิร์นเสื้อ',
  `pattern_type` tinyint(4) DEFAULT NULL COMMENT '1=unisex, 2=men/women',
  `enable_edit` enum('Y','N') NOT NULL DEFAULT 'Y' COMMENT 'สถานะการใช้งาน',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`pattern_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_shirt_sizes definition

CREATE TABLE `new_worksheet_shirt_sizes` (
  `shirt_size_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_shirt_sizes',
  `pattern_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_shirt_patterns',
  `shirt_pattern_type` tinyint(4) DEFAULT NULL COMMENT '1=unisex, 2=men, 3=women',
  `size_name` varchar(10) DEFAULT NULL COMMENT 'ชื่อไซซ์',
  `chest` double(8,2) DEFAULT NULL COMMENT 'รอบอก',
  `long` double(8,2) DEFAULT NULL COMMENT 'ความยาว',
  `quantity` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`shirt_size_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheet_status definition

CREATE TABLE `new_worksheet_status` (
  `status_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_status',
  `worksheet_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheets',
  `sales` int(11) NOT NULL DEFAULT 0 COMMENT '0=ใบงานถูกสร้าง, 1=ยืนยันใบงาน, 2=ขอสิทธิ์แก้ไขใบงาน, 3=แก้ไขใบงาน',
  `manager` int(11) NOT NULL DEFAULT 0 COMMENT '0=ใบงานถูกสร้าง, 1=ยืนยันใบงาน',
  `sales_confirm_date` datetime DEFAULT NULL COMMENT 'วันที่เซลยืนยันใบงาน',
  `manager_confirm_date` datetime DEFAULT NULL COMMENT 'วันที่ผู้จัดการยืนยันใบงาน',
  `sales_permission_date` datetime DEFAULT NULL COMMENT 'วันที่เซลขอแก้ไขใบงาน',
  `manager_approve_date` datetime DEFAULT NULL COMMENT 'วันที่ผู้จัดการอนุมัติแก้ไขใบงาน',
  `sales_edit_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.new_worksheets definition

CREATE TABLE `new_worksheets` (
  `worksheet_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheets',
  `work_id` varchar(20) DEFAULT NULL COMMENT 'ไอดีใบงานสำหรับแสดงผล',
  `customer_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง customers',
  `pattern_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_shirt_patterns',
  `user_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง users',
  `fabric_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_fabrics',
  `screen_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_screens',
  `work_name` varchar(100) DEFAULT NULL COMMENT 'ชื่องาน',
  `total_quantity` int(11) DEFAULT NULL,
  `due_date` date DEFAULT NULL COMMENT 'วันนัดส่งงาน',
  `exam_date` date DEFAULT NULL COMMENT 'วันนัดส่งตัวอย่าง',
  `date_created` timestamp NULL DEFAULT NULL COMMENT 'วันสร้างใบงาน',
  `creator_name` char(36) DEFAULT NULL COMMENT 'ชื่อคนสร้างใบงาน',
  `manager_name` char(36) DEFAULT NULL COMMENT 'ชื่อผู้จัดการ',
  `production_name` char(36) DEFAULT NULL COMMENT 'ชื่อฝ่ายผลิต',
  `images` varchar(255) DEFAULT NULL COMMENT 'รูปเสื้อ',
  `worksheet_note` text DEFAULT '' COMMENT 'บันทึกข้อมูลใบงาน',
  `worksheet_edit_detail` text DEFAULT NULL COMMENT 'รายละเอียดขอแก้ไขใบงาน',
  `type_shirt` enum('t-shirt','polo-shirt') DEFAULT NULL COMMENT 'ประเภทเสื้อ',
  `shirt_detail` text DEFAULT NULL COMMENT 'รายละเอียดเสื้อ',
  `size_tag` tinyint(1) DEFAULT NULL COMMENT 'ติดป้ายไซซ์',
  `packaging` varchar(100) DEFAULT NULL COMMENT 'แพคเกจใส่เสื้อ',
  `deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '1=deleted',
  `nws_is_deleted` tinyint(1) DEFAULT 0 COMMENT 'สถานะการลบ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `nws_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `nws_created_by` char(36) DEFAULT NULL COMMENT 'คนสร้างข้อมูล',
  `nws_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  `nws_updated_by` char(36) DEFAULT NULL COMMENT 'คนอัปเดตข้อมูล',
  PRIMARY KEY (`worksheet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- tnpdb.personal_access_tokens definition

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=313 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.polo_tailoring definition

CREATE TABLE `polo_tailoring` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_id` varchar(20) NOT NULL,
  `collar` enum('คอปก','คอจีน','คอวี') NOT NULL,
  `collar_type` enum('ปกธรรมดา','ปกทอ / ขลิบปก','ปกเจ็กการ์ด','ปกผ้าในตัว','ปกเชิ้ต','อื่นๆ') NOT NULL COMMENT 'ชนิดคอปก',
  `other_collar_type` varchar(100) NOT NULL COMMENT 'ชนิดคอปกอื่นๆ',
  `collar_type_d` text NOT NULL COMMENT 'รายละเอียดชนิดปกคอ',
  `placket` enum('สาปปกติ','สาปโชว์','สาปแลป','อื่นๆ') NOT NULL,
  `other_placket` text NOT NULL COMMENT 'ชื่อรูปแบบสาปอื่นๆ',
  `outer_placket` int(10) NOT NULL COMMENT 'สาปนอก',
  `outer_placket_d` text NOT NULL COMMENT 'รายละเอียดสาปนอก',
  `inner_placket` int(10) NOT NULL COMMENT 'สาปใน',
  `inner_placket_d` text NOT NULL COMMENT 'รายละเอียดสาปใน',
  `button` enum('2 เม็ด','3 เม็ด','อื่นๆ') NOT NULL,
  `other_button` text NOT NULL COMMENT 'ชื่อรูปแบบกระดุมอื่นๆ',
  `button_color` varchar(100) NOT NULL,
  `sleeve` enum('แขนปล่อย','แขนซ้อน / แขนเบิล','แขนจั๊มรอบ','แขนจั๊มครึ่ง') NOT NULL,
  `sleeve_detail` text NOT NULL,
  `pocket` enum('กระเป๋าโชว์','กระเป๋าเจาะ','ไม่มีกระเป๋า') NOT NULL,
  `pocket_detail` text NOT NULL,
  `bottom_hem` int(10) NOT NULL COMMENT 'ชายซ้อน',
  `bottom_hem_d` text NOT NULL COMMENT 'รายละเอียดชายซ้อน',
  `back_seam` int(10) NOT NULL COMMENT 'วงพระจันทร์',
  `back_seam_d` text NOT NULL COMMENT 'รายละเอียดวงพระจันทร์',
  `side_vents` int(10) NOT NULL COMMENT 'ผ่าข้างชายเสื้อ',
  `side_vents_d` text NOT NULL COMMENT 'รายละเอียดผ่าข้างชายเสื้อ',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=583 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.pricing_request_notes definition

CREATE TABLE `pricing_request_notes` (
  `prn_id` char(36) NOT NULL DEFAULT uuid(),
  `prn_pr_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง pricing_requests',
  `prn_text` text DEFAULT NULL COMMENT 'ข้อความ',
  `prn_note_type` tinyint(4) DEFAULT NULL COMMENT '1=sale, 2=price, 3=manager',
  `prn_is_deleted` tinyint(1) DEFAULT 0 COMMENT 'สถานะการลบ',
  `prn_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `prn_created_by` char(36) DEFAULT NULL COMMENT 'คนสร้างข้อมูล',
  `prn_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  `prn_updated_by` char(36) DEFAULT NULL COMMENT 'คนอัปเดตข้อมูล',
  PRIMARY KEY (`prn_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางบันทึกคำขอราคา';


-- tnpdb.pricing_requests definition

CREATE TABLE `pricing_requests` (
  `pr_id` char(36) NOT NULL DEFAULT uuid(),
  `pr_cus_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง customers',
  `pr_mpc_id` char(36) DEFAULT NULL COMMENT 'ไอดีตารางประเภทสินค้า',
  `pr_status_id` char(36) DEFAULT NULL COMMENT 'ไอดีตารางสถานะ',
  `pr_no` varchar(20) DEFAULT NULL COMMENT 'รหัสคำขอราคา',
  `pr_work_name` varchar(100) DEFAULT NULL COMMENT 'ชื่องาน',
  `pr_pattern` varchar(255) DEFAULT NULL COMMENT 'แพทเทิร์น',
  `pr_fabric_type` varchar(255) DEFAULT NULL COMMENT 'ชนิดผ้า',
  `pr_color` varchar(255) DEFAULT NULL COMMENT 'สีสินค้า',
  `pr_sizes` varchar(255) DEFAULT NULL COMMENT 'ไซซ์',
  `pr_quantity` varchar(10) DEFAULT NULL COMMENT 'จำนวน',
  `pr_due_date` date DEFAULT NULL COMMENT 'วันที่ส่ง',
  `pr_silk` varchar(255) DEFAULT NULL COMMENT 'silk screen',
  `pr_dft` varchar(255) DEFAULT NULL COMMENT 'dft screen',
  `pr_embroider` varchar(255) DEFAULT NULL COMMENT 'การปัก',
  `pr_sub` varchar(255) DEFAULT NULL COMMENT 'sublimation screen',
  `pr_other_screen` varchar(255) DEFAULT NULL COMMENT 'การสกรีนแบบอื่นๆ',
  `pr_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'รูปสินค้า',
  `pr_is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สถานะการลบ',
  `pr_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `pr_created_by` char(36) DEFAULT NULL COMMENT 'คนสร้างข้อมูล',
  `pr_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  `pr_updated_by` char(36) DEFAULT NULL COMMENT 'คนอัปเดตข้อมูล',
  PRIMARY KEY (`pr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางคำขอราคา';


-- tnpdb.production_blocks definition

CREATE TABLE `production_blocks` (
  `block_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pd_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(10) unsigned DEFAULT NULL,
  `embroid_factory` int(10) DEFAULT NULL,
  `screen_block` enum('IN','OUT','EDIT') DEFAULT NULL,
  `dft_block` enum('IN','OUT','EDIT') DEFAULT NULL,
  `embroid_date` date DEFAULT NULL,
  `screen_date` date DEFAULT NULL,
  `dft_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`block_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2162 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.production_costs definition

CREATE TABLE `production_costs` (
  `cost_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pd_id` bigint(20) NOT NULL,
  `fabric` char(100) DEFAULT NULL,
  `factory` char(100) DEFAULT NULL,
  `fabric_color` char(100) DEFAULT NULL,
  `quantity` float unsigned DEFAULT NULL,
  `fabric_price` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`cost_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.production_notes definition

CREATE TABLE `production_notes` (
  `note_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pd_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `note_category` char(50) DEFAULT NULL,
  `note_descr` text DEFAULT NULL,
  `note_datetime` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`note_id`)
) ENGINE=InnoDB AUTO_INCREMENT=588 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.productions definition

CREATE TABLE `productions` (
  `pd_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_id` bigint(20) unsigned DEFAULT NULL COMMENT 'ไอดีตาราง worksheets',
  `new_worksheet_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheets',
  `production_type` int(2) DEFAULT NULL,
  `screen` int(2) DEFAULT NULL,
  `dft` int(2) DEFAULT NULL,
  `embroid` int(2) DEFAULT NULL,
  `order_start` date DEFAULT NULL,
  `order_end` date DEFAULT NULL,
  `dyeing_start` date DEFAULT NULL,
  `dyeing_end` date DEFAULT NULL,
  `cutting_start` datetime DEFAULT NULL,
  `cutting_end` datetime DEFAULT NULL,
  `sewing_start` datetime DEFAULT NULL,
  `sewing_end` datetime DEFAULT NULL,
  `received_start` date DEFAULT NULL,
  `received_end` date DEFAULT NULL,
  `exam_start` date DEFAULT NULL COMMENT 'วันที่เริ่มทำตัวอย่างเสื้อ',
  `exam_end` date DEFAULT NULL COMMENT 'วันที่ตัวอย่างเสื้อเสร็จ',
  `cutting_factory` int(10) DEFAULT NULL,
  `sewing_factory` int(10) DEFAULT NULL,
  `status` int(2) DEFAULT 0,
  `end_select_process_time` timestamp NULL DEFAULT NULL COMMENT 'วันสิ้นสุดการเริ่มต้นระบบงาน',
  `created_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`pd_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2162 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.quotations definition

CREATE TABLE `quotations` (
  `id` char(36) NOT NULL,
  `quotation_no` varchar(255) NOT NULL,
  `pricing_request_id` char(36) DEFAULT NULL,
  `customer_id` char(36) NOT NULL,
  `status` enum('draft','pending_review','approved','rejected','completed') NOT NULL DEFAULT 'draft',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 7.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deposit_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_terms` varchar(255) DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version_no` int(11) NOT NULL DEFAULT 1,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` char(36) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotations_quotation_no_unique` (`quotation_no`),
  KEY `quotations_status_index` (`status`),
  KEY `quotations_customer_id_index` (`customer_id`),
  KEY `quotations_created_at_index` (`created_at`),
  KEY `quotations_quotation_no_index` (`quotation_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.receipts definition

CREATE TABLE `receipts` (
  `id` char(36) NOT NULL,
  `receipt_no` varchar(255) NOT NULL,
  `tax_invoice_no` varchar(255) NOT NULL,
  `invoice_id` char(36) DEFAULT NULL,
  `customer_id` char(36) NOT NULL,
  `status` enum('draft','pending_review','approved','rejected','completed') NOT NULL DEFAULT 'draft',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 7.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','bank_transfer','cheque','credit_card') NOT NULL DEFAULT 'bank_transfer',
  `payment_reference` varchar(255) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version_no` int(11) NOT NULL DEFAULT 1,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` char(36) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipts_receipt_no_unique` (`receipt_no`),
  UNIQUE KEY `receipts_tax_invoice_no_unique` (`tax_invoice_no`),
  KEY `receipts_status_index` (`status`),
  KEY `receipts_payment_method_index` (`payment_method`),
  KEY `receipts_customer_id_index` (`customer_id`),
  KEY `receipts_payment_date_index` (`payment_date`),
  KEY `receipts_created_at_index` (`created_at`),
  KEY `receipts_receipt_no_index` (`receipt_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.relation_customer_users definition

CREATE TABLE `relation_customer_users` (
  `rcs_id` char(36) NOT NULL DEFAULT uuid(),
  `rcs_cus_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง master_customers',
  `rcs_user_id` bigint(20) DEFAULT NULL COMMENT 'ไอดีตาราง users',
  `rcs_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `rcs_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `rcs_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  PRIMARY KEY (`rcs_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tnpdb.relation_user_roles definition

CREATE TABLE `relation_user_roles` (
  `rur_id` char(36) NOT NULL DEFAULT uuid() COMMENT 'ไอดีตาราง relation_user_roles',
  `rur_user_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง users',
  `rur_role_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง roles',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`rur_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='relation ระหว่าง users กับ roles';


-- tnpdb.relation_worksheets_productions definition

CREATE TABLE `relation_worksheets_productions` (
  `rwp_id` char(36) NOT NULL,
  `rwp_pd_id` bigint(20) DEFAULT NULL COMMENT 'ไอดีตาราง productions',
  `rwp_ws_id` bigint(20) DEFAULT NULL COMMENT 'ไอดีตารางระบบใบงานเก่า',
  `rwp_new_ws_id` char(36) DEFAULT NULL COMMENT 'ไอดีตารางระบบใบงานใหม่',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`rwp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.shirt_patterns definition

CREATE TABLE `shirt_patterns` (
  `pattern_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pattern_name` char(100) NOT NULL,
  `shirt_category` int(2) NOT NULL COMMENT '1=t-shirt, 2=polo shirt',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`pattern_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.tailoring_factory definition

CREATE TABLE `tailoring_factory` (
  `factory_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `factory_no` int(10) NOT NULL,
  `factory_name` char(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`factory_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.tailoring_position definition

CREATE TABLE `tailoring_position` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_id` varchar(15) NOT NULL,
  `position` set('ปักบนกระเป๋า','ปักเหนือกระเป๋า','ปักอกซ้าย','ปักอกขวา','ปักแขนซ้าย','ปักแขนขวา','ปักหลัง') NOT NULL,
  `position_size` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=582 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.users definition

CREATE TABLE `users` (
  `user_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_uuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'ไอดีตาราง users ใหม่',
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `role` enum('admin','manager','account','production','graphic','sale','technician','test') DEFAULT NULL,
  `user_emp_no` varchar(20) DEFAULT NULL COMMENT 'รหัสพนักงาน',
  `user_firstname` varchar(50) DEFAULT NULL COMMENT 'ชื่อ',
  `user_lastname` varchar(50) DEFAULT NULL COMMENT 'นามสกุล',
  `user_phone` varchar(50) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  `user_nickname` varchar(50) DEFAULT NULL COMMENT 'ชื่อเล่น',
  `user_position` varchar(100) DEFAULT NULL COMMENT 'ตำแหน่ง',
  `enable` enum('Y','N') NOT NULL DEFAULT 'Y',
  `user_is_enable` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `deleted` int(2) NOT NULL DEFAULT 0 COMMENT '1=deleted',
  `user_is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สถานะการลบ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `new_pass` varchar(255) DEFAULT NULL COMMENT 'รหัสผ่านใหม่',
  `pass_is_updated` tinyint(1) DEFAULT 0,
  `user_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `user_created_by` char(36) DEFAULT NULL COMMENT 'คนสร้างข้อมูล',
  `user_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  `user_updated_by` char(36) DEFAULT NULL COMMENT 'คนอัปเดตข้อมูล',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tnpdb.worksheets definition

CREATE TABLE `worksheets` (
  `sheetID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `work_id` varchar(20) NOT NULL COMMENT 'ไอดีใบงานสำหรับแสดงผล',
  `customer_id` int(10) NOT NULL COMMENT 'ไอดีตารางลูกค้า',
  `pattern_id` int(10) NOT NULL COMMENT 'ไอดีตารางแพทเทิร์นเสื้อ',
  `ex_id` int(11) NOT NULL COMMENT 'ไอดีตารางจำนวนเสื้อตัวอย่าง',
  `user_id` int(10) NOT NULL COMMENT 'ไอดีผู้ขายงาน',
  `work_name` varchar(100) NOT NULL COMMENT 'ชื่องาน',
  `create_sheet_1` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างใบงาน',
  `create_sheet_2` date NOT NULL,
  `fabric` varchar(100) NOT NULL COMMENT 'ชื่อผ้า',
  `no_fabric` varchar(100) NOT NULL COMMENT 'เบอร์ผ้า',
  `color` varchar(100) NOT NULL COMMENT 'สีผ้า',
  `no_color` varchar(100) NOT NULL COMMENT 'เบอร์สีผ้า',
  `fact_fabric` varchar(100) NOT NULL COMMENT 'ชื่อโรงงานผ้า',
  `quantity` int(10) NOT NULL COMMENT 'จำนวนรวมสินค้า',
  `exam_quantity` int(3) NOT NULL COMMENT 'จำนวนตัวอย่างสินค้า',
  `size_sss` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ sss',
  `size_ss` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ ss',
  `size_s` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ s',
  `size_m` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ m',
  `size_l` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ L',
  `size_xl` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ XL',
  `size_2xl` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ 2XL',
  `size_3xl` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ 3XL',
  `size_4xl` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ 4XL',
  `size_5xl` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ 5XL',
  `size_6xl` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ 6XL',
  `size_7xl` int(7) NOT NULL COMMENT 'จำนวนเสื้อไซซ์ 6XL',
  `screen_point` int(4) NOT NULL COMMENT 'จำนวนจุดสกรีน',
  `screen_flex` int(4) NOT NULL COMMENT 'จำนวนจุดเฟลกซ์สกรีน',
  `screen_dft` int(4) NOT NULL COMMENT 'จำนวนจุด dft',
  `screen_label` int(4) NOT NULL COMMENT 'สกรีนลาเบล',
  `screen_embroider` int(4) NOT NULL COMMENT 'จำนวนจุดปัก',
  `exam_date` date DEFAULT NULL COMMENT 'วันที่นัดส่งตัวอย่าง',
  `due_date` date NOT NULL COMMENT 'วันที่นัดส่งงาน',
  `creator_name` enum('Thung','Pear') DEFAULT NULL COMMENT 'ชื่อผู้สร้างใบงาน หรือกราฟิก',
  `manager_name` enum('Ying') DEFAULT NULL COMMENT 'ชื่อผู้จัดการ',
  `production_name` enum('Ice','Mon','Kluay','Ying') DEFAULT NULL COMMENT 'ชื่อฝ่ายผลิต',
  `picture` varchar(255) NOT NULL COMMENT 'รูปลายสกรีน',
  `note` text DEFAULT NULL COMMENT 'หมายเหตุ',
  `product_category` enum('T-Shirt','Polo Shirt') DEFAULT NULL COMMENT 'ประเภทเสื้อ',
  `product_detail` text DEFAULT NULL COMMENT 'รายละเอียดสินค้า',
  `screen_detail` text DEFAULT NULL COMMENT 'รายละเอียดการสกรีน',
  `size_tag` enum('ติด','ไม่ติด') DEFAULT NULL COMMENT 'ป้ายไซซ์',
  `packaging` varchar(100) DEFAULT NULL COMMENT 'ถุงใส่เสื้อ',
  `deleted` int(2) NOT NULL DEFAULT 0 COMMENT '1=deleted',
  PRIMARY KEY (`sheetID`),
  KEY `c_pattern_id` (`pattern_id`),
  KEY `ex_id` (`ex_id`),
  KEY `customer_id` (`customer_id`),
  KEY `work_id` (`work_id`) USING BTREE,
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2605 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.worksheets_confirm definition

CREATE TABLE `worksheets_confirm` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_id` varchar(15) NOT NULL,
  `sale` int(3) NOT NULL,
  `graphic` int(3) NOT NULL,
  `manager` int(3) NOT NULL,
  `sale_date` datetime NOT NULL,
  `graphic_date` datetime NOT NULL,
  `manager_date` datetime NOT NULL,
  `sale_edit_date` datetime DEFAULT NULL,
  `graphic_edit_date` datetime DEFAULT NULL,
  `manager_edit_date` datetime DEFAULT NULL,
  `sale_access_date` datetime DEFAULT NULL,
  `graphic_access_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `work_id` (`work_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2598 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.delivery_note_items definition

CREATE TABLE `delivery_note_items` (
  `id` char(36) NOT NULL,
  `delivery_note_id` char(36) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `quantity_ordered` decimal(10,2) NOT NULL,
  `quantity_delivered` decimal(10,2) NOT NULL,
  `quantity_remaining` decimal(10,2) NOT NULL,
  `unit` varchar(255) NOT NULL DEFAULT 'ชิ้น',
  `item_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `delivery_note_items_delivery_note_id_index` (`delivery_note_id`),
  CONSTRAINT `delivery_note_items_delivery_note_id_foreign` FOREIGN KEY (`delivery_note_id`) REFERENCES `delivery_notes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.invoice_items definition

CREATE TABLE `invoice_items` (
  `id` char(36) NOT NULL,
  `invoice_id` char(36) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(255) NOT NULL DEFAULT 'ชิ้น',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `item_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_items_invoice_id_index` (`invoice_id`),
  CONSTRAINT `invoice_items_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.quotation_items definition

CREATE TABLE `quotation_items` (
  `id` char(36) NOT NULL,
  `quotation_id` char(36) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(255) NOT NULL DEFAULT 'ชิ้น',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `item_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_items_quotation_id_index` (`quotation_id`),
  CONSTRAINT `quotation_items_quotation_id_foreign` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


-- tnpdb.receipt_items definition

CREATE TABLE `receipt_items` (
  `id` char(36) NOT NULL,
  `receipt_id` char(36) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(255) NOT NULL DEFAULT 'ชิ้น',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `item_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `receipt_items_receipt_id_index` (`receipt_id`),
  CONSTRAINT `receipt_items_receipt_id_foreign` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;