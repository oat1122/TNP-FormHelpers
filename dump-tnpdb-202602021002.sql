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
-- Dumping data for table `master_customer_groups`
--

LOCK TABLES `master_customer_groups` WRITE;
/*!40000 ALTER TABLE `master_customer_groups` DISABLE KEYS */;
INSERT INTO `master_customer_groups` VALUES
('89a0e42d-0f01-4863-a92b-699185aaf75e','Grade C','Grade C Customer','60 day',3,1,'2025-06-17 14:49:19','2025-06-17 14:49:32'),
('def79ce5-e2a4-11ef-b385-38ca84abdf0a','Grade A','ลูกค้าเคยสั่งผลิตกับเราแล้ว','30 day',1,1,'2025-02-04 03:05:21','2025-02-04 03:05:21'),
('def9491d-e2a4-11ef-b385-38ca84abdf0a','Grade B','พบลูกค้า ได้เสนอราคา','60 day',2,1,'2025-02-04 03:05:21','2025-02-19 08:01:36'),
('f01bb91f-0d1b-4ba2-8c25-8b3b1c3909a9','Grade D','Grade D Customer','60 day',4,1,'2025-06-17 14:49:19','2025-06-17 14:49:32');
/*!40000 ALTER TABLE `master_customer_groups` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-02-02 10:02:43
