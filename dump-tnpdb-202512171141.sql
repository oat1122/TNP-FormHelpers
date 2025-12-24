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
-- Dumping data for table `master_sub_roles`
--

LOCK TABLES `master_sub_roles` WRITE;
/*!40000 ALTER TABLE `master_sub_roles` DISABLE KEYS */;
INSERT INTO `master_sub_roles` VALUES
('0e5ed285-3832-4fcc-bc91-9ea559727c19','SALES_ONLINE','ลูกน้อง Online','Admin ตอบแชท',1,3,'2025-12-16 07:08:25','2025-12-16 07:08:25',NULL,NULL),
('8683469d-6cfa-4e82-ab35-2723187ab870','TEST','test','test',1,0,'2025-12-15 09:07:53','2025-12-15 09:07:53',NULL,NULL),
('87bcd832-5af2-4e3f-bcad-40e46efaffd5','SALES_OFFLINE','ลูกน้อง Offline','Sales ออกนอกพื้นที่ไปหาลูกค้า',1,4,'2025-12-16 07:09:29','2025-12-16 07:09:29',NULL,NULL),
('b6cfd000-2f18-4055-a9cd-05523d7aa20e','HEAD_OFFLINE','หัวหน้าฝ่ายออฟไลน์','หัวหน้าทีมขายช่องทางออฟไลน์',1,2,'2025-12-15 07:47:25','2025-12-15 07:47:25',NULL,NULL),
('c31db03d-cf6c-4403-95c4-16b515511b3a','HEAD_ONLINE','หัวหน้าฝ่ายออนไลน์','หัวหน้าทีมขายช่องทางออนไลน์',1,1,'2025-12-15 07:47:25','2025-12-15 07:47:25',NULL,NULL);
/*!40000 ALTER TABLE `master_sub_roles` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'1c914879-ffff-11ef-afa3-38ca84abdf0a','admin','c93ccd78b2076528346216b3b2f701e6','admin',NULL,'Nutthawut','Phosrithong',NULL,'admin',NULL,'Y',1,0,0,NULL,'2025-10-23 03:01:12','$2y$10$RK0YayWAaOaBpK/PdrMNSeTXWwVuISrutvmEmaIp/kgD4DhGP.6Ju',1,'2025-03-13 10:33:23',NULL,'2025-10-23 03:01:12','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(2,'1c91491e-ffff-11ef-afa3-38ca84abdf0a','Ying','342e9fe99275d61f0efa8d21a4f2f605','manager','TNP01001','Phitta','Sungkaew','0944460864','Ying','ผู้จัดการหลัก','Y',1,0,0,NULL,'2025-10-24 11:44:12','$2y$10$JNzYH4qkBrcrOd5FDR/sGexBCi.S1U2vXgPsdPmHgDRxfLfTnwbyW',1,'2025-03-13 10:34:23',NULL,'2025-10-24 11:44:12','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(3,'1c914941-ffff-11ef-afa3-38ca84abdf0a','Thung','563bb030c897125f91b0638f389ccdf8','graphic',NULL,NULL,NULL,NULL,'Thung',NULL,'Y',1,0,0,NULL,NULL,'$2y$10$Y3tpSUUKk.Sxo4PET06e/.fc7O19ADxVoJSyZQiPG2TgXhyQ/E2Be',1,'2025-03-13 11:00:23',NULL,'2025-05-26 05:14:33',NULL),
(4,'1c91495b-ffff-11ef-afa3-38ca84abdf0a','balloon','ae066568a3a6ce8257a4a61de0be2a47','sale',NULL,NULL,NULL,NULL,'balloon',NULL,'N',0,1,1,'0000-00-00 00:00:00',NULL,'$2y$10$oF7LcXVuA.TLZ/MPz045ieg1ndY11tHfZGR5mTqw8Fd/b6ansOhbe',1,'2025-03-13 11:01:23',NULL,'2025-05-26 05:14:33',NULL),
(5,'1c914977-ffff-11ef-afa3-38ca84abdf0a','Aoao','d87ba32b4e49d431bec8a92f16b3b7b3','sale','TNP03001','Atitaya','Saechua','0902019121','Ao','หัวหน้าทีมแอดมิน','Y',1,0,0,NULL,'2025-12-16 07:59:07','$2y$10$4Gn81YdqafmXy7EuKl/yiuWMk8vgL4FVlLv/y/6.RU9GV3C7Rl.eG',1,'2025-03-13 11:02:23',NULL,'2025-12-16 07:59:07','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(6,'1c91498b-ffff-11ef-afa3-38ca84abdf0a','Zee','32e5640c0d6780c615cfc4955bcf2a3d','sale','TNP03002','Thitisan','Chanlamoon','0971255181','Zee','แอดมิน','Y',1,0,0,NULL,'2025-12-17 04:20:53','$2y$10$HLUx0JGa9Ld1NrgKXDSehem94CrkAqKaq8o0XkA9WnSEDEKcEC1Nu',1,'2025-03-13 11:03:23',NULL,'2025-12-17 04:20:53','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(7,'1c9149a4-ffff-11ef-afa3-38ca84abdf0a','Aomsin','afbf860151028503c46f991300914dbd','sale',NULL,'Phitchapa','Phungsin','0952281996','Aomsin','คนขาย','Y',1,0,0,NULL,'2025-10-24 11:45:06','$2y$10$1bzcQQ2ddNazDTP5LlMCpuYYKTeZPyxl/pVIdXiiYN4PVQlDZNnzm',1,'2025-03-13 11:04:23',NULL,'2025-10-24 11:45:06','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(8,'1c9149b7-ffff-11ef-afa3-38ca84abdf0a','Ice','73a71ab1db847cf4862605d50d7fa1c4','sale',NULL,NULL,NULL,NULL,'Ice',NULL,'Y',1,0,0,NULL,NULL,'$2y$10$kCLoRFBLbIlD9ehD4unCT.MPnLwx7LzFkG5mJV2VoQzslBEN7fuUq',1,'2025-03-13 11:05:23',NULL,'2025-05-26 05:14:33',NULL),
(9,'1c9149cd-ffff-11ef-afa3-38ca84abdf0a','Nij','0db40d898d6a820cdb7eabb7ae02d007','sale',NULL,'Phakwalan','Pitisubapha','0969366311','Nij',NULL,'Y',1,0,0,NULL,'2025-10-24 11:45:40','$2y$10$I3IMr4QNR.x.rz8SLnO/FO4W8dnmm6Q7EbuOZI0z7Xhm3UJcGxhuq',1,'2025-03-13 11:06:23',NULL,'2025-10-24 11:45:40','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(10,'1c9149e0-ffff-11ef-afa3-38ca84abdf0a','Kluay','e9f3064cbb388e1cb730d718ccb586be','sale',NULL,NULL,NULL,NULL,'Kluay',NULL,'Y',1,0,0,NULL,'2024-07-01 04:54:43','$2y$10$AvmeyC2JHBaoIzqUPK/bgOzONoWIoi590IwpFkDIGKyToZMvCgcq.',1,'2025-03-13 11:07:23',NULL,'2025-05-26 05:14:33',NULL),
(11,'1c9149f3-ffff-11ef-afa3-38ca84abdf0a','paint','e9f3064cbb388e1cb730d718ccb586be','sale',NULL,NULL,NULL,NULL,'paint',NULL,'N',0,1,1,NULL,NULL,'$2y$10$AvmeyC2JHBaoIzqUPK/bgOzONoWIoi590IwpFkDIGKyToZMvCgcq.',1,'2025-03-13 11:08:23',NULL,'2025-05-26 05:14:33',NULL),
(12,'1c914a04-ffff-11ef-afa3-38ca84abdf0a','Na','cfb3b964371194b98381c2ff54fb42f3','sale',NULL,NULL,NULL,NULL,'Na',NULL,'Y',1,0,0,NULL,NULL,'$2y$10$ADIwKMaaBe6idq90ibZk/OCAqdAeweW2WvE.xQ2iA0iBca4q4jg8.',1,'2025-03-13 11:09:23',NULL,'2025-05-26 05:14:33',NULL),
(13,'1c914a15-ffff-11ef-afa3-38ca84abdf0a','Pear','90e1eac35915a07b064bfad2986b8e9a','graphic',NULL,'Sirada','Sangariyavanish','0909869154','Pear',NULL,'Y',1,0,0,NULL,'2025-10-24 11:46:28','$2y$10$oY1lqDroHZFkIov.orD19eFI8/ybKrhUMmCEjvGFNXZcZa/cs8n1.',1,'2025-03-13 11:10:23',NULL,'2025-10-24 11:46:28','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(14,'1c914a26-ffff-11ef-afa3-38ca84abdf0a','Jo','f8acb3a3009900998899c42fc077159b','technician',NULL,NULL,NULL,NULL,'Jo',NULL,'Y',1,0,0,NULL,'2025-03-28 03:40:47','$2y$10$NTLul0sG5QRxAeaU8kUXsuwC9DbN1is4YyIfFH2x/yhbfjKVm/H2i',1,'2025-03-13 11:11:23',NULL,'2025-05-26 05:14:33',NULL),
(15,'1c914a38-ffff-11ef-afa3-38ca84abdf0a','ball','6ebea7e78099417cc393bb0bbc79923e','sale',NULL,NULL,NULL,NULL,'ball',NULL,'Y',1,0,0,NULL,'2025-05-22 12:57:41','$2y$10$fu0Rc2.9jETH/k14Oc4V/eEeU7voBJv8EHCCI69Oxw9Uo3ASlh5L6',1,'2025-03-13 11:12:23',NULL,'2025-05-26 05:14:33',NULL),
(16,'1c914a4a-ffff-11ef-afa3-38ca84abdf0a','Admin_m','bad4da2a60041994f02c47f676416fce','manager',NULL,NULL,NULL,NULL,'Admin_m',NULL,'Y',1,0,0,NULL,'2025-03-10 08:29:25','$2y$10$Hyg00ICf6ilBloHoQ5cb3.39oEh2gBPfCFMJvItcW.6y9QpfbJ1HG',1,'2025-03-13 11:13:23',NULL,'2025-05-26 05:14:33',NULL),
(17,'1c914a5e-ffff-11ef-afa3-38ca84abdf0a','Admin_s','9907496ef5924a1fec0a0443d76df219','sale',NULL,NULL,NULL,NULL,'Admin_s',NULL,'Y',1,0,0,NULL,'2025-04-25 02:34:45','$2y$10$CiVLyMF5pr9KC99uhMXVP.BXKAsLbjNzwYxOF86O4ZW3ed0UJEBOm',1,'2025-03-13 11:14:23',NULL,'2025-05-26 05:14:34',NULL),
(18,'1c914a70-ffff-11ef-afa3-38ca84abdf0a','Admin_g','7b57296a0a36abee1608aa9edd509799','graphic',NULL,NULL,NULL,NULL,'Admin_g',NULL,'Y',1,0,0,NULL,'2025-05-02 09:38:52','$2y$10$Lqktc6V.hoYw9akkb5lT2eX74MZ9luf03c2jMGrthvpGL1cDQEWni',1,'2025-03-13 11:15:23',NULL,'2025-05-26 05:14:34',NULL),
(26,'1c914a80-ffff-11ef-afa3-38ca84abdf0a','Focus','e9f3064cbb388e1cb730d718ccb586be','sale',NULL,NULL,NULL,NULL,'Focus',NULL,'N',0,1,1,NULL,NULL,'$2y$10$po1wl0nwQ1wIPoUB7IHvG.gO5axAQNtE.oeggC6ohOtho2g3b/lwO',1,'2025-03-13 11:16:23',NULL,'2025-05-26 05:14:34',NULL),
(27,'1c914a90-ffff-11ef-afa3-38ca84abdf0a','Ink','e9f3064cbb388e1cb730d718ccb586be','sale',NULL,NULL,NULL,NULL,'Ink',NULL,'Y',0,0,0,NULL,'2025-06-20 07:17:08','$2y$10$fzyEENGQsU9ATw7uNYfJx.9MCQwjaQR6sfuvls62vnpfXYzVoH2gu',1,'2025-03-13 11:17:23',NULL,'2025-06-20 07:17:08','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(28,'1c914aa1-ffff-11ef-afa3-38ca84abdf0a','kluay-p','e9f3064cbb388e1cb730d718ccb586be','production',NULL,NULL,NULL,NULL,'kluay',NULL,'N',0,0,0,NULL,'2024-06-29 02:37:22','$2y$10$fzyEENGQsU9ATw7uNYfJx.9MCQwjaQR6sfuvls62vnpfXYzVoH2gu',1,'2025-03-13 11:18:23',NULL,'2025-05-26 05:14:34',NULL),
(29,'1c914ab4-ffff-11ef-afa3-38ca84abdf0a','kluay-m','e9f3064cbb388e1cb730d718ccb586be','manager',NULL,NULL,NULL,NULL,'kluay',NULL,'N',0,0,0,'2023-05-15 03:03:45','2024-06-29 02:40:02','$2y$10$fzyEENGQsU9ATw7uNYfJx.9MCQwjaQR6sfuvls62vnpfXYzVoH2gu',1,'2025-03-13 11:19:23',NULL,'2025-05-26 05:14:34',NULL),
(30,'1c914ac6-ffff-11ef-afa3-38ca84abdf0a','nemo','ab1474bbedbfc4e397c24033e6f01e71','sale',NULL,NULL,NULL,NULL,'nemo',NULL,'Y',0,0,0,'2023-07-03 07:42:03','2025-06-20 07:14:51','$2y$10$Yrey3Lxy/vP1Aw6jlhMOxO8IHi65Zu/i/XnNzOgyTG4K5YhBoGJZ6',1,'2025-03-13 11:20:23',NULL,'2025-06-20 07:14:51','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(31,'1c914ad9-ffff-11ef-afa3-38ca84abdf0a','toon','b78d503bf3ba13da877b3fcce72e1dde','sale','TNP02002','Kornnika','Auten','0839497799','toon','พนักงานขาย','Y',1,0,0,'2023-08-15 04:14:31','2025-12-17 04:20:19','$2y$10$i1Q4uW0A8G9rsznlXSx8DezPkIwLwRH82hrlDiuYOjg4bebQ9Vsti',1,'2025-03-13 11:21:23',NULL,'2025-12-17 04:20:19','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(32,'1c914aed-ffff-11ef-afa3-38ca84abdf0a','ice-p','bb49867bd87d34640232e2e7014d3cc1','production','TNP01004',NULL,NULL,NULL,'ice','ผู้ช่วยผู้จัดการ','Y',1,0,0,'2024-02-04 04:49:47','2025-06-20 07:11:56','$2y$10$q1xrrOa2KHQedP1Pn/uwxepNHPTJQoEjiIoStuX/.I1eRxCvlJNFy',1,'2025-03-13 11:22:23',NULL,'2025-06-20 07:11:56','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(33,'1c914b00-ffff-11ef-afa3-38ca84abdf0a','salely','e9f3064cbb388e1cb730d718ccb586be','sale',NULL,NULL,NULL,NULL,'salely',NULL,'N',0,0,0,'2024-02-21 10:49:43','2024-05-10 09:15:50','$2y$10$fzyEENGQsU9ATw7uNYfJx.9MCQwjaQR6sfuvls62vnpfXYzVoH2gu',1,'2025-03-13 11:23:23',NULL,'2025-05-26 05:14:34',NULL),
(34,'1c914b12-ffff-11ef-afa3-38ca84abdf0a','sale-a','05676894fb836b7238428d345053e75a','sale','TNP02001','Pattiya','Mekasawaswong','0838199449','sale-a','หัวหน้าทีมขาย','Y',1,0,0,'2024-05-10 09:04:59','2025-12-16 07:58:39','$2y$10$tdKt9NamAWORV2bnYb7Apui1bfWbyYJAZ2ZC2EdnbjC.mX2TtuON2',1,'2025-03-13 11:24:23',NULL,'2025-12-16 07:58:39','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(35,'1c914b27-ffff-11ef-afa3-38ca84abdf0a','lek','7d953cb22d891b6534cd2d36df24bdc3','sale',NULL,NULL,NULL,NULL,'lek',NULL,'Y',0,0,0,'2024-05-10 09:16:16','2025-06-20 07:11:16','$2y$10$I8nK0Yap8/AFioMjRZd0PO5G6APCVsSEs8P7cvp8Rux1jL6xXCQha',1,'2025-03-13 11:25:23',NULL,'2025-06-20 07:11:16','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(36,'1c914b38-ffff-11ef-afa3-38ca84abdf0a','aoom','eb62195937bfd97de586b92dc088cee7','sale','TNP02003','Rattharin','Sawatdiwong','0641369993','aoom','พนักงานขาย','Y',1,0,0,'2024-07-16 07:45:49','2025-12-17 04:20:07','$2y$10$SzE1/TJxjBrGE6k0.OaAXOZKQU.4/mVdy07QdjoKmR63cMczsPtHi',1,'2025-03-13 11:26:23',NULL,'2025-12-17 04:20:07','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(37,'1c914b49-ffff-11ef-afa3-38ca84abdf0a','mon-p','986699a2b648b423077f17a296f24e40','production',NULL,NULL,NULL,NULL,'mon',NULL,'Y',0,0,0,'2024-08-22 04:14:33','2025-06-20 07:10:04','$2y$10$yWrM0OzF5GB36SSn0qvE9OzH2JfxILNgwT851TcLruxpVXgx1JZ3m',1,'2025-03-13 11:27:23',NULL,'2025-06-20 07:10:04','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(38,'1c914b5a-ffff-11ef-afa3-38ca84abdf0a','sales-o','f7590e1ad7502f1d4c0539367ddf86e9','sale','TNP02004','Paphatchaya','Charonesuk','0838249565','sales-o','พนักงานขาย','Y',1,0,0,'2024-10-08 14:09:40','2025-12-17 04:19:55','$2y$10$y4cDUMibBhH2ECcDtRpgTOb8Nd7amf6bB8GHyyCL4QpX4ZyXx4bxm',1,'2025-03-13 11:28:23',NULL,'2025-12-17 04:19:55','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(39,'1c914b6b-ffff-11ef-afa3-38ca84abdf0a','Admin_sun','091524520cb443e94c5943610b148bc9','sale',NULL,NULL,NULL,NULL,'Admin_sun',NULL,'Y',0,0,0,'2024-11-22 11:28:58','2025-06-20 07:05:47','$2y$10$Hkn8aYqxOX3JYHbOwPjs4ubrS./5otjA85ULpxtWKitrn2KTjN/dq',1,'2025-03-13 11:29:23',NULL,'2025-06-20 07:05:47','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(40,'1c914b84-ffff-11ef-afa3-38ca84abdf0a','too','7cbb7a2ee042df2f846d3629872290c3','technician',NULL,NULL,NULL,NULL,'too',NULL,'Y',1,0,0,'2025-02-19 06:47:21','2025-02-19 06:47:21','$2y$10$vJSRjlzSZrB2dGDM1PbfBOL1Q5KuL/4q3xs05ITpRA.8MIWW2P/Za',1,'2025-03-13 11:30:23',NULL,'2025-05-26 05:14:34',NULL),
(41,'1c914b96-ffff-11ef-afa3-38ca84abdf0a','P-Aomsin','95d2b46a474d1a8270024cc3742eed0e','production','TNP01003','Phitchapa','Phungsin','0952281996','Aomsin','QC','Y',1,0,0,'2025-02-25 08:05:21','2025-10-24 11:44:40','$2y$10$QgBymBieEElvRPO00g4I4OZPdTRLKE2sA9IfqmnbkTRDiPlIDs4aK',1,'2025-03-13 11:31:23',NULL,'2025-10-24 11:44:40','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(42,'1c914ba7-ffff-11ef-afa3-38ca84abdf0a','nice','7772ddb6d887fa9932ec20afd1ac5d55','sale','TNP03003','Patcharanan','Hirunampai','0654265062','nice','แอดมิน','Y',1,0,0,'2025-03-12 13:07:05','2025-12-17 04:19:28','$2y$10$1gA2njxw2BOv14d/WoHlv.GMMcJPCy0iIHy.vKcUIuzogTNzznmSq',1,'2025-03-13 11:32:23',NULL,'2025-12-17 04:19:28','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(45,'689a05a7-0b25-11f0-9ed9-b8ca3aecfe48','min','dddb0cb7621440c59f08d20b87bb379f','production','TNP01005',NULL,NULL,NULL,'Min','ผู้ช่วยผู้จัดการ','Y',1,0,0,'2025-03-27 16:06:14','2025-06-20 07:12:47','$2y$10$O/DclkFSdmclfTwfO4xPe.5PveuhhGgXK7pd5QzflRUXz41mNS5Ti',1,'2025-03-27 16:06:14',NULL,'2025-06-20 07:12:47','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(46,'3dca82e9-62d3-465c-bdd9-1d54713dd3be','admin_p','a712139ba147db89dcb65b2e5f6be80a','production',NULL,NULL,NULL,NULL,'Admin Production',NULL,'Y',1,0,0,'2025-05-26 05:19:59','2025-05-26 07:28:53','$2y$10$IwencSfrIySk7OfND.6kHOpxShxzjBhiLnkeuItFWhclrVXs8syHu',1,'2025-05-26 05:19:59','1c914879-ffff-11ef-afa3-38ca84abdf0a','2025-05-26 07:28:53','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(47,'ec786e60-d9bf-4f19-adf7-f083664b44d8','Nutty','f6f69f0befdd9133891266adb83e7247','production','TNP01002','ฐานิตา','ภักดีจอหอ','0614135992','นัตตี้','จัดซื้อ','Y',1,0,0,'2025-06-20 07:08:17','2025-06-20 07:13:05','$2y$10$KCkhu0wnnN.Z5VJtWqXI7.Pu4MxLM5dtrCj0w0yHlvnJgDwqrkwzC',1,'2025-06-20 07:08:17','1c914879-ffff-11ef-afa3-38ca84abdf0a','2025-06-20 07:13:05','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(48,'e979c7f6-e538-4dfc-8b34-a32203ee728e','oat','417dbda136b1f4d05b028e8476ea5fb4','sale','1234','Nutthawut','Phosrithong','0624977952','5555','1234','Y',1,0,0,'2025-06-25 14:06:13','2025-06-25 14:06:13','$2y$10$4cixPkuuC.j5dqL6ITFPgepswKNCHwvarhvcsGmv/YVDBVglzcqwi',1,'2025-06-25 14:06:13','1c914879-ffff-11ef-afa3-38ca84abdf0a','2025-06-25 14:06:13','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(49,'eda20886-f3b8-49d4-8eb0-edbc3b5091a1','Mintra','10c4022ad8dfacbeda2f3abe3dd62439','production',NULL,NULL,NULL,NULL,'มิน','ผู้ช่วยผู้จัดการ','Y',1,0,0,'2025-07-10 10:41:25','2025-07-10 10:41:25','$2y$10$PujpV6LkPEKKECMZy3M.rumOa8mqtXC8amOkbLF678XIga9T9Owfm',1,'2025-07-10 10:41:25','1c914879-ffff-11ef-afa3-38ca84abdf0a','2025-07-10 10:41:25','1c914879-ffff-11ef-afa3-38ca84abdf0a'),
(50,'a4d25dbf-dfdc-49ea-b8c2-949dd1ed888f','nice02','7772ddb6d887fa9932ec20afd1ac5d55','sale',NULL,'nice','nice','0624977952','nice',NULL,'N',0,1,1,'2025-09-23 08:30:09','2025-12-16 03:10:17','$2y$10$houaRHS.MmzSjDTUajXGN.A4v37hUbHq4GpWw.Z77DgZ.QT6qE5Ne',1,'2025-09-23 08:30:09','1c914879-ffff-11ef-afa3-38ca84abdf0a','2025-12-16 03:10:17','a4d25dbf-dfdc-49ea-b8c2-949dd1ed888f'),
(51,'cffa38fe-5193-45dc-a8bf-b50c2fb1a9a2','Account_nij','162adb8c6baf19d03fa440452842fe2e','manager',NULL,NULL,NULL,NULL,'Nij',NULL,'Y',1,0,0,'2025-11-06 07:31:01','2025-12-15 09:14:43','$2y$10$SZH6/REifWEkBjJyQ9dD.eFm.UWwkWYitiXPN2ZsQGv5IQAP4NEUm',1,'2025-11-06 07:31:01','1c914879-ffff-11ef-afa3-38ca84abdf0a','2025-12-15 09:14:43','1c914879-ffff-11ef-afa3-38ca84abdf0a');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `user_sub_roles`
--

LOCK TABLES `user_sub_roles` WRITE;
/*!40000 ALTER TABLE `user_sub_roles` DISABLE KEYS */;
INSERT INTO `user_sub_roles` VALUES
('06ffe511-7c83-4f95-8c85-21c638e7829d',34,'b6cfd000-2f18-4055-a9cd-05523d7aa20e','2025-12-16 07:58:40',34),
('201ac6c4-9da0-4f0a-9b6e-4cc498480959',42,'0e5ed285-3832-4fcc-bc91-9ea559727c19','2025-12-17 04:19:31',42),
('23e82478-674e-4a68-a91a-f95ae6009795',5,'c31db03d-cf6c-4403-95c4-16b515511b3a','2025-12-16 07:59:07',5),
('25fd13f7-daff-40a8-8c29-3e1e17161073',51,'c31db03d-cf6c-4403-95c4-16b515511b3a','2025-12-15 09:14:43',51),
('3bab2c12-3238-4e58-8ece-2776600f3f80',50,'c31db03d-cf6c-4403-95c4-16b515511b3a','2025-12-16 03:10:04',50),
('425709d7-3aa6-4c21-9f04-89159347a489',31,'87bcd832-5af2-4e3f-bcad-40e46efaffd5','2025-12-17 04:20:19',31),
('9e4a6584-1228-46ef-86d1-243501e22f38',6,'0e5ed285-3832-4fcc-bc91-9ea559727c19','2025-12-17 04:20:53',6),
('d6d051b7-e75c-47b1-abcb-8c9afc50c09e',36,'87bcd832-5af2-4e3f-bcad-40e46efaffd5','2025-12-17 04:20:07',36),
('db46eb9c-5d3f-4eb4-b1ac-5ecf044d0e06',38,'87bcd832-5af2-4e3f-bcad-40e46efaffd5','2025-12-17 04:19:55',38),
('f50149bc-f49a-4b31-97ce-996d041f9c18',51,'b6cfd000-2f18-4055-a9cd-05523d7aa20e','2025-12-15 09:14:43',51);
/*!40000 ALTER TABLE `user_sub_roles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-12-17 11:41:22
