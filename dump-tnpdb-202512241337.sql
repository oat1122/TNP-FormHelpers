/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.7.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: tnpdb
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int(11) DEFAULT NULL,
  `max_supply_id` varchar(50) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `description` varchar(50) DEFAULT NULL,
  `old_values` varchar(2048) DEFAULT NULL,
  `new_values` varchar(512) DEFAULT NULL,
  `created_at` varchar(50) DEFAULT NULL,
  `updated_at` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL COMMENT 'ชื่อย่อ/ชื่อที่ใช้แสดง',
  `legal_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อจดทะเบียน',
  `branch` varchar(255) DEFAULT NULL COMMENT 'สาขา',
  `address` text DEFAULT NULL,
  `tax_id` char(13) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `short_code` varchar(20) DEFAULT NULL COMMENT 'โค้ดสั้น เช่น TNP, TNP153',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `account_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อบัญชี',
  `bank_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อธนาคาร',
  `account_number` varchar(255) DEFAULT NULL COMMENT 'เลขบัญชี',
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_name_unique` (`name`),
  KEY `companies_is_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cost_fabrics`
--

DROP TABLE IF EXISTS `cost_fabrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_creation_audit`
--

DROP TABLE IF EXISTS `customer_creation_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_creation_audit` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `error_type` varchar(50) NOT NULL,
  `error_message` text DEFAULT NULL,
  `request_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_creation_audit_user_id_index` (`user_id`),
  KEY `customer_creation_audit_phone_index` (`phone`),
  KEY `customer_creation_audit_error_type_index` (`error_type`),
  KEY `customer_creation_audit_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_details`
--

DROP TABLE IF EXISTS `customer_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_notification_reads`
--

DROP TABLE IF EXISTS `customer_notification_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_notification_reads` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cus_id` char(36) NOT NULL COMMENT 'Customer ID from master_customers',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'User ID who read the notification',
  `read_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'When the notification was read',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_customer_user_read` (`cus_id`,`user_id`),
  KEY `idx_user_read_at` (`user_id`,`read_at`),
  CONSTRAINT `customer_notification_reads_cus_id_foreign` FOREIGN KEY (`cus_id`) REFERENCES `master_customers` (`cus_id`) ON DELETE CASCADE,
  CONSTRAINT `customer_notification_reads_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_transfer_history`
--

DROP TABLE IF EXISTS `customer_transfer_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_transfer_history` (
  `id` char(36) NOT NULL,
  `customer_id` char(36) NOT NULL COMMENT 'FK: master_customers.cus_id',
  `previous_channel` tinyint(4) DEFAULT NULL,
  `new_channel` tinyint(4) DEFAULT NULL,
  `previous_manage_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID เดิม',
  `new_manage_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID ใหม่',
  `action_by_user_id` bigint(20) unsigned NOT NULL COMMENT 'ผู้ทำการโอน',
  `remark` mediumtext DEFAULT NULL COMMENT 'หมายเหตุ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cth_customer_id` (`customer_id`),
  KEY `idx_cth_action_by` (`action_by_user_id`),
  KEY `idx_cth_created_at` (`created_at`),
  CONSTRAINT `fk_cth_action_by` FOREIGN KEY (`action_by_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_cth_customer` FOREIGN KEY (`customer_id`) REFERENCES `master_customers` (`cus_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customize_pattern`
--

DROP TABLE IF EXISTS `customize_pattern`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delivery_note_items`
--

DROP TABLE IF EXISTS `delivery_note_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_note_items` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `delivery_note_id` char(36) NOT NULL COMMENT 'ref delivery_notes.id',
  `invoice_id` char(36) DEFAULT NULL COMMENT 'ref invoices.id (option)',
  `invoice_item_id` char(36) DEFAULT NULL COMMENT 'ref invoice_items.id',
  `sequence_order` int(11) NOT NULL DEFAULT 1 COMMENT 'ลำดับการแสดงผล',
  `item_name` varchar(255) NOT NULL COMMENT 'ชื่อสินค้า/งาน',
  `item_description` text DEFAULT NULL COMMENT 'รายละเอียดเพิ่มเติม',
  `pattern` varchar(255) DEFAULT NULL,
  `fabric_type` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `delivered_quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'จำนวนที่ส่งในใบนี้',
  `unit` varchar(50) NOT NULL DEFAULT 'ชิ้น' COMMENT 'หน่วยนับ',
  `item_snapshot` longtext DEFAULT NULL COMMENT 'JSON snapshot จาก invoice_items',
  `status` enum('ready','delivered','cancelled') NOT NULL DEFAULT 'ready',
  `created_by` char(36) DEFAULT NULL COMMENT 'ref users.user_uuid',
  `updated_by` char(36) DEFAULT NULL COMMENT 'ref users.user_uuid',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dni_delivery_note_id_index` (`delivery_note_id`),
  KEY `dni_invoice_id_index` (`invoice_id`),
  KEY `dni_invoice_item_id_index` (`invoice_item_id`),
  KEY `dni_sequence_order_index` (`sequence_order`),
  KEY `dni_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delivery_notes`
--

DROP TABLE IF EXISTS `delivery_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_notes` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `company_id` char(36) DEFAULT NULL,
  `invoice_id` char(36) DEFAULT NULL COMMENT 'ref invoices.id',
  `invoice_item_id` char(36) DEFAULT NULL COMMENT 'ref invoice_items.id',
  `invoice_number` varchar(50) DEFAULT NULL COMMENT 'เลขใบแจ้งหนี้ (cache เพื่อค้นหาเร็ว)',
  `number` varchar(50) NOT NULL COMMENT 'เลขที่ใบส่งของ',
  `receipt_id` char(36) DEFAULT NULL COMMENT 'อ้างอิงถึง receipts.id',
  `customer_id` char(36) DEFAULT NULL COMMENT 'อ้างอิงถึง master_customers.cus_id',
  `customer_data_source` enum('master','delivery') NOT NULL DEFAULT 'master' COMMENT 'แหล่งข้อมูลลูกค้า (master/delivery)',
  `customer_company` varchar(255) DEFAULT NULL COMMENT 'ชื่อบริษัทลูกค้า',
  `customer_address` text DEFAULT NULL COMMENT 'ที่อยู่ลูกค้า',
  `customer_zip_code` char(5) DEFAULT NULL COMMENT 'รหัสไปรษณีย์',
  `customer_tel_1` varchar(50) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  `customer_tax_id` varchar(50) DEFAULT NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
  `customer_firstname` varchar(100) DEFAULT NULL COMMENT 'ชื่อ',
  `customer_lastname` varchar(100) DEFAULT NULL COMMENT 'นามสกุล',
  `customer_snapshot` longtext DEFAULT NULL COMMENT 'JSON snapshot ข้อมูลลูกค้า ณ วันที่ออกใบส่งของ',
  `work_name` varchar(100) DEFAULT NULL COMMENT 'ชื่องาน',
  `quantity` varchar(10) DEFAULT NULL COMMENT 'จำนวน',
  `status` enum('preparing','shipping','in_transit','delivered','completed','failed') NOT NULL DEFAULT 'preparing' COMMENT 'สถานะการจัดส่ง',
  `delivery_method` enum('self_delivery','courier','customer_pickup') NOT NULL DEFAULT 'courier' COMMENT 'วิธีการจัดส่ง',
  `courier_company` varchar(100) DEFAULT NULL COMMENT 'บริษัทขนส่ง',
  `tracking_number` varchar(100) DEFAULT NULL COMMENT 'เลขที่ติดตาม',
  `delivery_address` text DEFAULT NULL COMMENT 'ที่อยู่จัดส่ง',
  `recipient_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อผู้รับ',
  `recipient_phone` varchar(50) DEFAULT NULL COMMENT 'เบอร์โทรผู้รับ',
  `delivery_date` date DEFAULT NULL COMMENT 'วันที่กำหนดส่ง',
  `delivered_at` timestamp NULL DEFAULT NULL COMMENT 'วันเวลาที่ส่งถึง',
  `delivery_notes` text DEFAULT NULL COMMENT 'หมายเหตุการจัดส่ง',
  `notes` text DEFAULT NULL COMMENT 'หมายเหตุทั่วไป',
  `sender_company_id` char(36) DEFAULT NULL COMMENT 'บริษัทผู้ส่งของ (ref companies.id)',
  `manage_by` bigint(20) unsigned DEFAULT NULL COMMENT 'ผู้ดูแล (ref users.user_id)',
  `created_by` char(36) DEFAULT NULL COMMENT 'ผู้สร้าง',
  `delivered_by` char(36) DEFAULT NULL COMMENT 'ผู้ส่งของ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_dn_company_number` (`company_id`,`number`),
  KEY `delivery_notes_status_index` (`status`),
  KEY `delivery_notes_delivery_method_index` (`delivery_method`),
  KEY `delivery_notes_customer_id_index` (`customer_id`),
  KEY `delivery_notes_receipt_id_index` (`receipt_id`),
  KEY `delivery_notes_tracking_number_index` (`tracking_number`),
  KEY `delivery_notes_delivery_date_index` (`delivery_date`),
  KEY `delivery_notes_created_at_index` (`created_at`),
  KEY `delivery_notes_company_id_number_index` (`company_id`,`number`),
  KEY `delivery_notes_company_id_index` (`company_id`),
  KEY `delivery_notes_invoice_id_index` (`invoice_id`),
  KEY `delivery_notes_invoice_item_id_index` (`invoice_item_id`),
  KEY `delivery_notes_invoice_number_index` (`invoice_number`),
  KEY `delivery_notes_sender_company_id_index` (`sender_company_id`),
  KEY `delivery_notes_manage_by_index` (`manage_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='ตารางใบส่งของ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `document_attachments`
--

DROP TABLE IF EXISTS `document_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_attachments` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `document_type` enum('quotation','invoice','receipt','delivery_note') NOT NULL COMMENT 'ประเภทเอกสาร',
  `document_id` char(36) NOT NULL COMMENT 'ID ของเอกสาร',
  `attachment_type` enum('evidence','signature','cached_pdf') NOT NULL DEFAULT 'evidence' COMMENT 'ประเภทไฟล์แนบ: evidence=หลักฐาน, signature=ลายเซ็น, cached_pdf=PDF แคช',
  `filename` varchar(255) NOT NULL COMMENT 'ชื่อไฟล์ในระบบ',
  `original_filename` varchar(255) NOT NULL COMMENT 'ชื่อไฟล์เดิม',
  `file_path` varchar(500) NOT NULL COMMENT 'path ของไฟล์',
  `file_size` int(11) DEFAULT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'ประเภทไฟล์',
  `cache_expires_at` datetime DEFAULT NULL COMMENT 'เวลาหมดอายุของ PDF cache',
  `cache_version` varchar(32) DEFAULT NULL COMMENT 'Version hash ของเอกสาร (MD5) สำหรับ cache invalidation',
  `cache_key` varchar(255) DEFAULT NULL COMMENT 'Unique cache key: {type}:{id}:{header}:{version}',
  `uploaded_by` char(36) DEFAULT NULL COMMENT 'ผู้อัปโหลด',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete timestamp for cache cleanup',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_cache_key` (`cache_key`),
  KEY `document_attachments_document_type_document_id_index` (`document_type`,`document_id`),
  KEY `document_attachments_uploaded_by_index` (`uploaded_by`),
  KEY `document_attachments_created_at_index` (`created_at`),
  KEY `idx_cache_lookup` (`document_type`,`document_id`,`attachment_type`,`cache_expires_at`),
  KEY `idx_cache_cleanup` (`attachment_type`,`cache_expires_at`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='ตารางเก็บไฟล์แนบเอกสาร';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `document_history`
--

DROP TABLE IF EXISTS `document_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_history` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `document_type` enum('quotation','invoice','receipt','delivery_note','credit_note','debit_note') NOT NULL COMMENT 'ประเภทเอกสาร',
  `document_id` char(36) NOT NULL COMMENT 'ID ของเอกสาร',
  `previous_status` varchar(50) DEFAULT NULL COMMENT 'สถานะเดิม',
  `new_status` varchar(50) DEFAULT NULL COMMENT 'สถานะใหม่',
  `action` varchar(100) DEFAULT NULL COMMENT 'การกระทำ',
  `notes` text DEFAULT NULL COMMENT 'หมายเหตุ',
  `action_by` char(36) DEFAULT NULL COMMENT 'ผู้ดำเนินการ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_history_document_type_document_id_index` (`document_type`,`document_id`),
  KEY `document_history_action_by_index` (`action_by`),
  KEY `document_history_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='ตารางติดตามการเปลี่ยนแปลงสถานะเอกสาร';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `document_sequences`
--

DROP TABLE IF EXISTS `document_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_sequences` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` char(36) NOT NULL,
  `doc_type` varchar(50) NOT NULL,
  `year` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `last_number` int(11) NOT NULL DEFAULT 0,
  `prefix_override` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_company_doctype_year_month` (`company_id`,`doc_type`,`year`,`month`),
  KEY `document_sequences_doc_type_index` (`doc_type`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `example_quantity`
--

DROP TABLE IF EXISTS `example_quantity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `invoice_id` char(36) NOT NULL COMMENT 'ref invoices.id',
  `quotation_item_id` char(36) DEFAULT NULL COMMENT 'ref quotation_items.id (ถ้ามาจาก quotation)',
  `pricing_request_id` char(36) DEFAULT NULL COMMENT 'ref pricing_requests.pr_id',
  `item_name` varchar(255) NOT NULL COMMENT 'ชื่อสินค้า/งาน',
  `item_description` text DEFAULT NULL COMMENT 'รายละเอียดสินค้า',
  `sequence_order` int(11) NOT NULL DEFAULT 1 COMMENT 'ลำดับการแสดงผลต่อใบ',
  `pattern` varchar(255) DEFAULT NULL COMMENT 'แพทเทิร์น',
  `fabric_type` varchar(255) DEFAULT NULL COMMENT 'ประเภทผ้า',
  `color` varchar(255) DEFAULT NULL COMMENT 'สี',
  `size` varchar(255) DEFAULT NULL COMMENT 'ขนาด',
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย',
  `quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'จำนวน',
  `unit` varchar(50) NOT NULL DEFAULT 'ชิ้น' COMMENT 'หน่วยนับ',
  `subtotal` decimal(12,2) GENERATED ALWAYS AS (`unit_price` * `quantity`) VIRTUAL COMMENT 'ยอดรวม (auto)',
  `discount_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลด %',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนส่วนลด',
  `final_amount` decimal(12,2) GENERATED ALWAYS AS (`unit_price` * `quantity` - `discount_amount`) VIRTUAL COMMENT 'ยอดสุทธิหลังหักส่วนลด',
  `item_images` longtext DEFAULT NULL COMMENT 'รูปภาพสินค้า (JSON array)',
  `notes` text DEFAULT NULL COMMENT 'หมายเหตุรายการ',
  `status` enum('draft','confirmed','delivered','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'สถานะของรายการ',
  `created_by` char(36) DEFAULT NULL COMMENT 'ผู้สร้าง (ref users.user_uuid)',
  `updated_by` char(36) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด (ref users.user_uuid)',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_items_invoice_sequence` (`invoice_id`,`sequence_order`),
  KEY `invoice_items_invoice_id_index` (`invoice_id`),
  KEY `invoice_items_quotation_item_id_index` (`quotation_item_id`),
  KEY `invoice_items_pricing_request_id_index` (`pricing_request_id`),
  KEY `invoice_items_sequence_order_index` (`sequence_order`),
  KEY `invoice_items_status_index` (`status`),
  KEY `invoice_items_created_by_index` (`created_by`),
  KEY `invoice_items_updated_by_index` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `company_id` char(36) DEFAULT NULL,
  `number` varchar(50) NOT NULL COMMENT 'เลขที่ใบแจ้งหนี้',
  `number_before` varchar(50) DEFAULT NULL COMMENT 'Document number for before-deposit invoice',
  `number_after` varchar(50) DEFAULT NULL COMMENT 'Document number for after-deposit invoice',
  `quotation_id` char(36) DEFAULT NULL COMMENT 'อ้างอิงถึง quotations.id',
  `reference_invoice_id` varchar(36) DEFAULT NULL COMMENT 'Reference to before-deposit invoice ID',
  `reference_invoice_number` varchar(50) DEFAULT NULL COMMENT 'Reference to before-deposit invoice number',
  `primary_pricing_request_id` char(36) DEFAULT NULL COMMENT 'อ้างอิงถึง pricing_requests.pr_id หลัก',
  `primary_pricing_request_ids` longtext DEFAULT NULL COMMENT 'JSON array ของ PR IDs',
  `customer_id` char(36) DEFAULT NULL COMMENT 'อ้างอิงถึง master_customers.cus_id',
  `customer_company` varchar(255) DEFAULT NULL COMMENT 'ชื่อบริษัทลูกค้า',
  `customer_tax_id` char(13) DEFAULT NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
  `customer_address` text DEFAULT NULL COMMENT 'ที่อยู่ลูกค้า',
  `customer_zip_code` char(5) DEFAULT NULL COMMENT 'รหัสไปรษณีย์',
  `customer_tel_1` varchar(50) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  `customer_email` varchar(255) DEFAULT NULL COMMENT 'อีเมล์',
  `customer_firstname` varchar(100) DEFAULT NULL COMMENT 'ชื่อ',
  `customer_lastname` varchar(100) DEFAULT NULL COMMENT 'นามสกุล',
  `customer_data_source` varchar(20) NOT NULL DEFAULT 'master' COMMENT 'แหล่งข้อมูลลูกค้า: ''master_customer'' หรือ ''invoice''',
  `customer_snapshot` longtext DEFAULT NULL COMMENT 'snapshot ข้อมูลลูกค้า ณ เวลาออกใบแจ้งหนี้',
  `status` enum('draft','pending','pending_after','approved','sent','partial_paid','fully_paid','overdue') NOT NULL DEFAULT 'draft',
  `status_before` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft' COMMENT 'Status for before deposit mode',
  `status_after` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft' COMMENT 'Status for after deposit mode',
  `type` enum('full_amount','remaining','deposit','partial') NOT NULL DEFAULT 'full_amount' COMMENT 'ประเภทการเรียกเก็บ',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาก่อนภาษี',
  `net_subtotal` decimal(15,2) DEFAULT NULL COMMENT 'ยอดสุทธิก่อนภาษี (สำหรับโหมดรวม VAT)',
  `subtotal_before_vat` decimal(15,2) DEFAULT NULL COMMENT 'Subtotal amount before VAT calculation (for deposit tracking)',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนภาษี',
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคารวม',
  `special_discount_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลดพิเศษ %',
  `special_discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินส่วนลดพิเศษ',
  `has_vat` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'มีภาษีมูลค่าเพิ่มหรือไม่',
  `vat_percentage` decimal(5,2) NOT NULL DEFAULT 7.00 COMMENT 'อัตราภาษีมูลค่าเพิ่ม (%)',
  `pricing_mode` enum('net','vat_included') NOT NULL DEFAULT 'net' COMMENT 'โหมดการคำนวณราคา: net = ราคาไม่รวมภาษี, vat_included = ราคารวมภาษี',
  `vat_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินภาษีมูลค่าเพิ่ม',
  `has_withholding_tax` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'มีหักภาษี ณ ที่จ่าย',
  `withholding_tax_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'เปอร์เซ็นต์ภาษีหัก ณ ที่จ่าย',
  `withholding_tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนภาษีหัก ณ ที่จ่าย',
  `final_total_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดสุทธิสุดท้าย (หลังหักส่วนลดพิเศษและภาษี ณ ที่จ่าย)',
  `deposit_percentage` int(11) NOT NULL DEFAULT 0 COMMENT 'เปอร์เซ็นต์เงินมัดจำ',
  `deposit_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินมัดจำ',
  `deposit_amount_before_vat` decimal(15,2) DEFAULT NULL COMMENT 'Deposit amount before VAT calculation',
  `deposit_display_order` varchar(10) NOT NULL DEFAULT 'after' COMMENT 'การแสดงมัดจำ: before = มัดจำก่อน, after = มัดจำหลัง',
  `deposit_mode` varchar(20) DEFAULT NULL COMMENT 'percentage | amount',
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินที่ชำระแล้ว',
  `due_date` date DEFAULT NULL COMMENT 'วันครบกำหนดชำระ',
  `payment_method` varchar(50) DEFAULT NULL COMMENT 'วิธีการชำระเงิน',
  `payment_terms` varchar(100) DEFAULT NULL COMMENT 'เงื่อนไขการชำระ',
  `notes` text DEFAULT NULL COMMENT 'หมายเหตุ',
  `signature_images` longtext DEFAULT NULL COMMENT 'JSON array ของไฟล์หลักฐานการเซ็น',
  `sample_images` longtext DEFAULT NULL COMMENT 'ข้อมูลรูปภาพตัวอย่างสินค้า/บริการ',
  `evidence_files` longtext DEFAULT NULL COMMENT 'JSON array ของหลักฐานการชำระ / อื่นๆ',
  `document_header_type` varchar(50) NOT NULL DEFAULT 'ต้นฉบับ' COMMENT 'ประเภทหัวกระดาษ: ต้นฉบับ, สำเนา, หรือกำหนดเอง',
  `created_by` char(36) DEFAULT NULL COMMENT 'ผู้สร้าง',
  `inv_manage_by` char(36) DEFAULT NULL COMMENT 'ผู้จัดการใบแจ้งหนี้ - อ้างอิงถึง users.user_uuid',
  `updated_by` char(36) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด (ref users.user_uuid)',
  `submitted_by` char(36) DEFAULT NULL COMMENT 'ผู้ส่งขออนุมัติ',
  `submitted_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่ส่งขออนุมัติ',
  `approved_by` char(36) DEFAULT NULL COMMENT 'ผู้อนุมัติ',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่อนุมัติ',
  `rejected_by` char(36) DEFAULT NULL COMMENT 'ผู้ปฏิเสธ',
  `rejected_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่ปฏิเสธ',
  `sent_by` char(36) DEFAULT NULL COMMENT 'ผู้ส่งให้ลูกค้า',
  `sent_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่ส่งให้ลูกค้า',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่ชำระครบ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_invoices_company_number` (`company_id`,`number`),
  KEY `invoices_status_index` (`status`),
  KEY `invoices_customer_id_index` (`customer_id`),
  KEY `invoices_quotation_id_index` (`quotation_id`),
  KEY `invoices_due_date_index` (`due_date`),
  KEY `invoices_created_at_index` (`created_at`),
  KEY `invoices_type_index` (`type`),
  KEY `invoices_submitted_at_index` (`submitted_at`),
  KEY `invoices_sent_at_index` (`sent_at`),
  KEY `invoices_paid_at_index` (`paid_at`),
  KEY `invoices_company_id_number_index` (`company_id`,`number`),
  KEY `invoices_company_id_index` (`company_id`),
  KEY `invoices_primary_pricing_request_id_index` (`primary_pricing_request_id`),
  KEY `invoices_updated_by_index` (`updated_by`),
  KEY `invoices_deposit_amount_index` (`deposit_amount`),
  KEY `invoices_final_total_amount_index` (`final_total_amount`),
  KEY `idx_invoices_inv_manage_by` (`inv_manage_by`),
  KEY `idx_invoices_reference_invoice_id` (`reference_invoice_id`),
  KEY `idx_invoices_number_before` (`number_before`),
  KEY `idx_invoices_number_after` (`number_after`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='ตารางใบแจ้งหนี้';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cost_fabric_id` bigint(20) unsigned DEFAULT NULL,
  `level` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_business_types`
--

DROP TABLE IF EXISTS `master_business_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_business_types` (
  `bt_id` char(36) NOT NULL DEFAULT 'uuid()',
  `bt_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อประเภทธุรกิจ',
  `bt_is_system_reserved` tinyint(1) NOT NULL DEFAULT 0,
  `bt_sort` int(11) DEFAULT NULL COMMENT 'เรียงลำดับ',
  `bt_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`bt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_customer_groups`
--

DROP TABLE IF EXISTS `master_customer_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_customers`
--

DROP TABLE IF EXISTS `master_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_customers` (
  `cus_id` char(36) NOT NULL DEFAULT uuid(),
  `cus_mcg_id` char(36) DEFAULT NULL COMMENT 'ไอดีตารางกลุ่ม customer',
  `cus_no` char(10) DEFAULT NULL COMMENT 'รหัสลูกค้า',
  `cus_channel` tinyint(4) DEFAULT NULL COMMENT '1=sales, 2=online, 3=office',
  `cus_source` enum('sales','telesales','online','office') NOT NULL DEFAULT 'sales' COMMENT 'Source of customer: sales=direct sales, telesales=phone sales, online=website, office=walk-in',
  `cus_allocation_status` enum('pool','allocated') NOT NULL DEFAULT 'allocated' COMMENT 'Allocation status: pool=waiting for assignment, allocated=assigned to sales',
  `cus_allocated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who allocated this customer from pool',
  `cus_allocated_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp when customer was allocated',
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
  PRIMARY KEY (`cus_id`),
  UNIQUE KEY `idx_phone_unique` (`cus_tel_1`),
  KEY `master_customers_cus_allocated_by_foreign` (`cus_allocated_by`),
  KEY `idx_cus_allocation_status` (`cus_allocation_status`),
  KEY `idx_cus_source` (`cus_source`),
  KEY `idx_cus_allocated_at` (`cus_allocated_at`),
  KEY `idx_cus_allocation_source` (`cus_allocation_status`,`cus_source`),
  KEY `idx_cus_allocated_manager` (`cus_allocated_at`,`cus_manage_by`),
  CONSTRAINT `master_customers_cus_allocated_by_foreign` FOREIGN KEY (`cus_allocated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_districts`
--

DROP TABLE IF EXISTS `master_districts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_districts` (
  `dis_id` char(36) NOT NULL DEFAULT uuid(),
  `dis_name_th` varchar(50) DEFAULT NULL COMMENT 'ชื่ออำเภอ ภาษาไทย',
  `dis_name_en` varchar(50) DEFAULT NULL COMMENT 'ชื่ออำเภอ ภาษาอังกฤษ',
  `dis_sort_id` int(11) DEFAULT NULL COMMENT 'เลข id ใช้สำหรับ sort',
  `dis_pro_sort_id` int(11) DEFAULT NULL COMMENT 'sort id ของ provices',
  `dis_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  PRIMARY KEY (`dis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางอำเภอ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_geographies`
--

DROP TABLE IF EXISTS `master_geographies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_geographies` (
  `geo_id` char(36) NOT NULL DEFAULT uuid(),
  `geo_name` varchar(50) DEFAULT NULL COMMENT 'ชื่อภาค',
  `geo_sort_id` int(11) DEFAULT NULL COMMENT 'เลข id ใช้สำหรับ sort',
  `geo_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  PRIMARY KEY (`geo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางภาค';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_product_categories`
--

DROP TABLE IF EXISTS `master_product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_product_categories` (
  `mpc_id` char(36) NOT NULL DEFAULT uuid(),
  `mpc_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อประเภทสินค้า',
  `mpc_remark` text DEFAULT NULL COMMENT 'รายละเอียดประเภทสินค้า',
  `mpc_is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สถานะการลบ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`mpc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประเภทสินค้า';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_provices`
--

DROP TABLE IF EXISTS `master_provices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_provices` (
  `pro_id` char(36) NOT NULL DEFAULT uuid(),
  `pro_name_th` varchar(50) DEFAULT NULL COMMENT 'ชื่อจังหวัด ภาษาไทย',
  `pro_name_en` varchar(50) DEFAULT NULL COMMENT 'ชื่อจังหวัด ภาษาอังกฤษ',
  `pro_sort_id` int(11) DEFAULT NULL COMMENT 'เลข id ใช้สำหรับ sort',
  `pro_geo_sort_id` int(11) DEFAULT NULL COMMENT 'sort id ของ geographies',
  `pro_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  PRIMARY KEY (`pro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางจังหวัด';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_roles`
--

DROP TABLE IF EXISTS `master_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_roles` (
  `role_id` char(36) NOT NULL DEFAULT uuid() COMMENT 'ไอดีตาราง roles',
  `role_name` varchar(50) DEFAULT NULL COMMENT 'ชื่อแผนก',
  `role_remark` text DEFAULT NULL COMMENT 'รายละเอียดแผนก',
  `role_is_deleted` tinyint(1) DEFAULT 0 COMMENT 'สถานะการลบ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางแผนก';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_status`
--

DROP TABLE IF EXISTS `master_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_sub_roles`
--

DROP TABLE IF EXISTS `master_sub_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_sub_roles` (
  `msr_id` char(36) NOT NULL COMMENT 'Primary key UUID',
  `msr_code` varchar(50) NOT NULL COMMENT 'รหัส Sub Role เช่น HEAD_ONLINE',
  `msr_name` varchar(100) NOT NULL COMMENT 'ชื่อ Sub Role',
  `msr_description` mediumtext DEFAULT NULL COMMENT 'รายละเอียด',
  `msr_is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `msr_sort` int(11) NOT NULL DEFAULT 0 COMMENT 'ลำดับการแสดงผล',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL COMMENT 'ผู้สร้าง',
  `updated_by` bigint(20) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด',
  PRIMARY KEY (`msr_id`),
  UNIQUE KEY `master_sub_roles_msr_code_unique` (`msr_code`),
  KEY `idx_msr_is_active` (`msr_is_active`),
  KEY `idx_msr_sort` (`msr_sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_subdistricts`
--

DROP TABLE IF EXISTS `master_subdistricts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `max_supplies`
--

DROP TABLE IF EXISTS `max_supplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `max_supplies` (
  `id` varchar(50) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `worksheet_id` varchar(50) DEFAULT NULL,
  `title` varchar(50) DEFAULT NULL,
  `customer_name` varchar(50) DEFAULT NULL,
  `production_type` varchar(50) DEFAULT NULL,
  `start_date` varchar(50) DEFAULT NULL,
  `expected_completion_date` varchar(50) DEFAULT NULL,
  `due_date` varchar(50) DEFAULT NULL,
  `actual_completion_date` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `priority` varchar(50) DEFAULT NULL,
  `shirt_type` varchar(50) DEFAULT NULL,
  `total_quantity` int(11) DEFAULT NULL,
  `completed_quantity` int(11) DEFAULT NULL,
  `sizes` varchar(128) DEFAULT NULL,
  `screen_points` int(11) DEFAULT NULL,
  `dtf_points` int(11) DEFAULT NULL,
  `sublimation_points` int(11) DEFAULT NULL,
  `embroidery_points` int(11) DEFAULT NULL,
  `notes` varchar(50) DEFAULT NULL,
  `special_instructions` varchar(50) DEFAULT NULL,
  `work_calculations` varchar(512) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` varchar(50) DEFAULT NULL,
  `updated_at` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_example_qty`
--

DROP TABLE IF EXISTS `new_worksheet_example_qty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_fabric_customs`
--

DROP TABLE IF EXISTS `new_worksheet_fabric_customs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_worksheet_fabric_customs` (
  `fabric_custom_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_fabric_customs',
  `fabric_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_fabrics',
  `fabric_custom_color` varchar(100) DEFAULT NULL COMMENT 'สีผ้าส่วนบุ๊งคอ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`fabric_custom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_fabrics`
--

DROP TABLE IF EXISTS `new_worksheet_fabrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_polo_details`
--

DROP TABLE IF EXISTS `new_worksheet_polo_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_polo_embroiders`
--

DROP TABLE IF EXISTS `new_worksheet_polo_embroiders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_worksheet_polo_embroiders` (
  `polo_embroider_id` char(36) NOT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_polo_embroiders',
  `polo_detail_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง 24ws_worksheet_polo_details',
  `embroider_position` tinyint(4) DEFAULT NULL COMMENT '1=ปักบนกระเป๋า, 2=ปักเหนือกระเป๋า, 3=ปักอกซ้าย, 4=ปักอกขวา, 5=ปักแขนซ้าย, 6=ปักแขนขวา, 7=ปักหลัง',
  `embroider_size` text DEFAULT NULL COMMENT 'ขนาดลายปัก',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`polo_embroider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_screens`
--

DROP TABLE IF EXISTS `new_worksheet_screens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_shirt_patterns`
--

DROP TABLE IF EXISTS `new_worksheet_shirt_patterns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_shirt_sizes`
--

DROP TABLE IF EXISTS `new_worksheet_shirt_sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheet_status`
--

DROP TABLE IF EXISTS `new_worksheet_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_worksheets`
--

DROP TABLE IF EXISTS `new_worksheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items_tracking`
--

DROP TABLE IF EXISTS `order_items_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items_tracking` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `quotation_id` char(36) DEFAULT NULL COMMENT 'อ้างอิงถึง quotations.id',
  `pricing_request_id` char(36) DEFAULT NULL COMMENT 'อ้างอิงถึง pricing_requests.pr_id',
  `work_name` varchar(100) DEFAULT NULL COMMENT 'ชื่องาน',
  `fabric_type` varchar(255) DEFAULT NULL COMMENT 'ชนิดผ้า',
  `pattern` varchar(255) DEFAULT NULL COMMENT 'แพทเทิร์น',
  `color` varchar(255) DEFAULT NULL COMMENT 'สีสินค้า',
  `sizes` varchar(255) DEFAULT NULL COMMENT 'ไซซ์',
  `ordered_quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'จำนวนที่สั่ง',
  `delivered_quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'จำนวนที่ส่งแล้ว',
  `remaining_quantity` int(11) GENERATED ALWAYS AS (`ordered_quantity` - `delivered_quantity`) STORED COMMENT 'จำนวนคงเหลือ',
  `returned_quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'จำนวนที่คืน',
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_items_tracking_quotation_id_index` (`quotation_id`),
  KEY `order_items_tracking_pricing_request_id_index` (`pricing_request_id`),
  KEY `order_items_tracking_remaining_quantity_index` (`remaining_quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='ตารางติดตามจำนวนคงเหลือสินค้า';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=574 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `polo_tailoring`
--

DROP TABLE IF EXISTS `polo_tailoring`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pricing_request_notes`
--

DROP TABLE IF EXISTS `pricing_request_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pricing_requests`
--

DROP TABLE IF EXISTS `pricing_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  `pr_image` varchar(255) DEFAULT NULL COMMENT 'รูปสินค้า',
  `pr_is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สถานะการลบ',
  `pr_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `pr_created_by` char(36) DEFAULT NULL COMMENT 'คนสร้างข้อมูล',
  `pr_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  `pr_updated_by` char(36) DEFAULT NULL COMMENT 'คนอัปเดตข้อมูล',
  PRIMARY KEY (`pr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางคำขอราคา';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_blocks`
--

DROP TABLE IF EXISTS `production_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2436 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_costs`
--

DROP TABLE IF EXISTS `production_costs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_notes`
--

DROP TABLE IF EXISTS `production_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=1017 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productions`
--

DROP TABLE IF EXISTS `productions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2436 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotation_invoice_sync_jobs`
--

DROP TABLE IF EXISTS `quotation_invoice_sync_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_invoice_sync_jobs` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `quotation_id` char(36) NOT NULL COMMENT 'FK to quotations.id',
  `affected_invoice_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'JSON array of invoice IDs' CHECK (json_valid(`affected_invoice_ids`)),
  `original_quotation_snapshot` longtext DEFAULT NULL COMMENT 'Complete quotation + items snapshot before sync',
  `original_invoices_snapshot` longtext DEFAULT NULL COMMENT 'Affected invoices + items snapshot before sync',
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `progress_current` int(11) NOT NULL DEFAULT 0 COMMENT 'Current progress count',
  `progress_total` int(11) NOT NULL DEFAULT 0 COMMENT 'Total items to process',
  `error_message` text DEFAULT NULL COMMENT 'Error message if failed',
  `started_by` char(36) DEFAULT NULL COMMENT 'User UUID who initiated sync - FK to users.user_uuid',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sync_jobs_quotation` (`quotation_id`),
  KEY `idx_sync_jobs_status` (`status`),
  KEY `idx_sync_jobs_started_by` (`started_by`),
  KEY `idx_sync_jobs_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='Tracking table for quotation-invoice sync operations';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotation_items`
--

DROP TABLE IF EXISTS `quotation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_items` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `quotation_id` char(36) NOT NULL COMMENT 'ref quotations.id',
  `pricing_request_id` char(36) DEFAULT NULL COMMENT 'ref pricing_requests.pr_id',
  `item_name` varchar(255) NOT NULL COMMENT 'ชื่อสินค้า/งาน',
  `item_description` text DEFAULT NULL COMMENT 'รายละเอียดสินค้า',
  `sequence_order` int(11) NOT NULL DEFAULT 1 COMMENT 'ลำดับการแสดงผลต่อใบ',
  `pattern` varchar(255) DEFAULT NULL COMMENT 'แพทเทิร์น',
  `fabric_type` varchar(255) DEFAULT NULL COMMENT 'ประเภทผ้า',
  `color` varchar(255) DEFAULT NULL COMMENT 'สี',
  `size` varchar(255) DEFAULT NULL COMMENT 'ขนาด',
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย',
  `quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'จำนวน',
  `unit` varchar(50) NOT NULL DEFAULT 'ชิ้น' COMMENT 'หน่วยนับ',
  `subtotal` decimal(12,2) GENERATED ALWAYS AS (`unit_price` * `quantity`) STORED COMMENT 'ยอดรวม (auto)',
  `discount_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลด %',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนส่วนลด',
  `final_amount` decimal(12,2) GENERATED ALWAYS AS (`unit_price` * `quantity` - `discount_amount`) STORED COMMENT 'ยอดสุทธิหลังหักส่วนลด',
  `item_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'รูปภาพสินค้า (JSON array)',
  `notes` text DEFAULT NULL COMMENT 'หมายเหตุรายการ',
  `status` enum('draft','confirmed','in_production','completed','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'สถานะของรายการ',
  `created_by` char(36) DEFAULT NULL COMMENT 'ผู้สร้าง (ref users.user_uuid)',
  `updated_by` char(36) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด (ref users.user_uuid)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_qitems_quotation_sequence` (`quotation_id`,`sequence_order`),
  KEY `quotation_items_quotation_id_index` (`quotation_id`),
  KEY `quotation_items_pricing_request_id_index` (`pricing_request_id`),
  KEY `quotation_items_sequence_order_index` (`sequence_order`),
  KEY `quotation_items_status_index` (`status`),
  KEY `fk_qitems_created_by` (`created_by`),
  KEY `fk_qitems_updated_by` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรายละเอียดสินค้าในใบเสนอราคา (LEAN)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `company_id` char(36) DEFAULT NULL,
  `number` varchar(50) NOT NULL COMMENT 'เลขที่ใบเสนอราคา',
  `customer_id` char(36) DEFAULT NULL COMMENT 'ref master_customers.cus_id',
  `primary_pricing_request_id` char(36) DEFAULT NULL COMMENT 'ref pricing_requests.pr_id',
  `primary_pricing_request_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array ของ PR IDs' CHECK (json_valid(`primary_pricing_request_ids`)),
  `customer_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'snapshot ข้อมูลลูกค้า ณ เวลาออกใบ' CHECK (json_valid(`customer_snapshot`)),
  `work_name` varchar(100) DEFAULT NULL COMMENT 'ชื่องาน (หัวใบ)',
  `status` enum('draft','pending_review','approved','rejected','sent','completed') NOT NULL DEFAULT 'draft' COMMENT 'สถานะใบเสนอราคา',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาก่อนภาษี',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนภาษี',
  `special_discount_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลดพิเศษ %',
  `special_discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินส่วนลดพิเศษ',
  `has_withholding_tax` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'มีหักภาษี ณ ที่จ่าย',
  `withholding_tax_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'เปอร์เซ็นต์ภาษีหัก ณ ที่จ่าย',
  `withholding_tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนภาษีหัก ณ ที่จ่าย',
  `final_total_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดสุทธิสุดท้าย (หลังหักส่วนลดพิเศษและภาษี ณ ที่จ่าย)',
  `has_vat` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'เปิด/ปิดการคิดภาษีมูลค่าเพิ่ม (VAT)',
  `vat_percentage` decimal(5,2) NOT NULL DEFAULT 7.00 COMMENT 'เปอร์เซ็นต์ภาษีมูลค่าเพิ่ม (VAT)',
  `pricing_mode` enum('net','vat_included') NOT NULL DEFAULT 'net' COMMENT 'โหมดการคำนวณราคา: net = ราคาสุทธิ + VAT, vat_included = ราคารวม VAT แล้ว',
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคารวม',
  `deposit_percentage` int(11) NOT NULL DEFAULT 0 COMMENT 'เปอร์เซ็นต์เงินมัดจำ',
  `deposit_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนเงินมัดจำ',
  `deposit_mode` varchar(20) DEFAULT NULL COMMENT 'percentage | amount',
  `payment_terms` varchar(50) DEFAULT NULL COMMENT 'เงื่อนไขการชำระเงิน',
  `due_date` date DEFAULT NULL COMMENT 'วันครบกำหนด',
  `notes` text DEFAULT NULL COMMENT 'หมายเหตุ',
  `document_header_type` varchar(50) NOT NULL DEFAULT 'ต้นฉบับ' COMMENT 'ประเภทหัวกระดาษ: ต้นฉบับ, สำเนา, หรือกำหนดเอง',
  `signature_images` longtext DEFAULT NULL COMMENT 'JSON array ของไฟล์หลักฐานการเซ็น',
  `created_by` char(36) DEFAULT NULL COMMENT 'ผู้สร้าง (ref users.user_uuid)',
  `updated_by` char(36) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด (ref users.user_uuid)',
  `approved_by` char(36) DEFAULT NULL COMMENT 'ผู้อนุมัติ (ref users.user_uuid)',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่อนุมัติ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sample_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ข้อมูลรูปภาพตัวอย่างสินค้า/บริการ' CHECK (json_valid(`sample_images`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_quotations_company_number` (`company_id`,`number`),
  KEY `quotations_status_index` (`status`),
  KEY `quotations_customer_id_index` (`customer_id`),
  KEY `quotations_created_at_index` (`created_at`),
  KEY `quotations_due_date_index` (`due_date`),
  KEY `idx_quotations_primary_pricing_request` (`primary_pricing_request_id`),
  KEY `idx_quotations_created_by` (`created_by`),
  KEY `idx_quotations_updated_by` (`updated_by`),
  KEY `idx_quotations_approved_by` (`approved_by`),
  KEY `quotations_company_id_number_index` (`company_id`,`number`),
  KEY `quotations_company_id_index` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางใบเสนอราคา (LEAN)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `relation_customer_users`
--

DROP TABLE IF EXISTS `relation_customer_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `relation_customer_users` (
  `rcs_id` char(36) NOT NULL DEFAULT uuid(),
  `rcs_cus_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง master_customers',
  `rcs_user_id` bigint(20) DEFAULT NULL COMMENT 'ไอดีตาราง users',
  `rcs_is_use` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `rcs_created_date` timestamp NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `rcs_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่อัปเดตข้อมูล',
  PRIMARY KEY (`rcs_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `relation_user_roles`
--

DROP TABLE IF EXISTS `relation_user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `relation_user_roles` (
  `rur_id` char(36) NOT NULL DEFAULT uuid() COMMENT 'ไอดีตาราง relation_user_roles',
  `rur_user_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง users',
  `rur_role_id` char(36) DEFAULT NULL COMMENT 'ไอดีตาราง roles',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`rur_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='relation ระหว่าง users กับ roles';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `relation_worksheets_productions`
--

DROP TABLE IF EXISTS `relation_worksheets_productions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `relation_worksheets_productions` (
  `rwp_id` char(36) NOT NULL,
  `rwp_pd_id` bigint(20) DEFAULT NULL COMMENT 'ไอดีตาราง productions',
  `rwp_ws_id` bigint(20) DEFAULT NULL COMMENT 'ไอดีตารางระบบใบงานเก่า',
  `rwp_new_ws_id` char(36) DEFAULT NULL COMMENT 'ไอดีตารางระบบใบงานใหม่',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`rwp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shirt_patterns`
--

DROP TABLE IF EXISTS `shirt_patterns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `shirt_patterns` (
  `pattern_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pattern_name` char(100) NOT NULL,
  `shirt_category` int(2) NOT NULL COMMENT '1=t-shirt, 2=polo shirt',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`pattern_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tailoring_factory`
--

DROP TABLE IF EXISTS `tailoring_factory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tailoring_factory` (
  `factory_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `factory_no` int(10) NOT NULL,
  `factory_name` char(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`factory_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tailoring_position`
--

DROP TABLE IF EXISTS `tailoring_position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tailoring_position` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_id` varchar(15) NOT NULL,
  `position` set('ปักบนกระเป๋า','ปักเหนือกระเป๋า','ปักอกซ้าย','ปักอกขวา','ปักแขนซ้าย','ปักแขนขวา','ปักหลัง') NOT NULL,
  `position_size` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=582 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_sub_roles`
--

DROP TABLE IF EXISTS `user_sub_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sub_roles` (
  `usr_id` char(36) NOT NULL COMMENT 'Primary key UUID',
  `usr_user_id` bigint(20) unsigned NOT NULL COMMENT 'FK: users.user_id',
  `usr_sub_role_id` char(36) NOT NULL COMMENT 'FK: master_sub_roles.msr_id',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` bigint(20) DEFAULT NULL COMMENT 'ผู้สร้าง',
  PRIMARY KEY (`usr_id`),
  UNIQUE KEY `unique_user_sub_role` (`usr_user_id`,`usr_sub_role_id`),
  KEY `idx_usr_user_id` (`usr_user_id`),
  KEY `idx_usr_sub_role_id` (`usr_sub_role_id`),
  CONSTRAINT `fk_usr_sub_role` FOREIGN KEY (`usr_sub_role_id`) REFERENCES `master_sub_roles` (`msr_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usr_user` FOREIGN KEY (`usr_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_uuid` char(36) NOT NULL DEFAULT uuid() COMMENT 'ไอดีตาราง users ใหม่',
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `role` enum('admin','manager','production','graphic','sale','technician','telesale') NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `worksheets`
--

DROP TABLE IF EXISTS `worksheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `worksheets_confirm`
--

DROP TABLE IF EXISTS `worksheets_confirm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'tnpdb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-12-24 13:37:56
