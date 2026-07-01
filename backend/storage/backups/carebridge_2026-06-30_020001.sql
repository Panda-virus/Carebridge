-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: carebridge system
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
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel-cache-carebridge_db_bootstrapped','b:1;',1782784920);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `case_permission_requests`
--

DROP TABLE IF EXISTS `case_permission_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_permission_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `case_report_id` bigint(20) unsigned NOT NULL,
  `request_text` text DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `requested_by` varchar(255) DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `case_permission_requests_case_report_id_foreign` (`case_report_id`),
  CONSTRAINT `case_permission_requests_case_report_id_foreign` FOREIGN KEY (`case_report_id`) REFERENCES `case_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_permission_requests`
--

LOCK TABLES `case_permission_requests` WRITE;
/*!40000 ALTER TABLE `case_permission_requests` DISABLE KEYS */;
INSERT INTO `case_permission_requests` VALUES (1,6,'Dear Registrar,\n\nI am writing on behalf of the Internal Investigating Committee to request permission to investigate the following case:\n\nCase: CR000006\nReporter: Unknown reporter\nDefendant: Not specified\nLocation: Communication department\nDate: 5/19/2026\nTime: Not specified\n\nDescription:\ni was sexually assaulted by Mr. Ngwanguwa in\n\nPlease grant the IIC permission to proceed with an investigation into this matter.\n\nSincerely,\nInternal Investigating Committee','pending','5','2026-06-29 23:34:55',NULL,'2026-06-29 23:34:55','2026-06-29 23:34:55');
/*!40000 ALTER TABLE `case_permission_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `case_reports`
--

DROP TABLE IF EXISTS `case_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `category` varchar(255) NOT NULL DEFAULT 'general',
  `detailed_category` varchar(255) DEFAULT NULL,
  `sub_category` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'submitted',
  `case_status_id` bigint(20) unsigned DEFAULT NULL,
  `handler` varchar(255) DEFAULT NULL,
  `workflow_stage` varchar(255) DEFAULT NULL,
  `assigned_role` varchar(255) DEFAULT NULL,
  `urgency_level` varchar(255) NOT NULL DEFAULT 'medium',
  `requires_location_sharing` tinyint(1) NOT NULL DEFAULT 0,
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`location`)),
  `matched_keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`matched_keywords`)),
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `reported_by_type` varchar(255) DEFAULT NULL,
  `incident_date` date DEFAULT NULL,
  `incident_time` time DEFAULT NULL,
  `incident_location` varchar(255) DEFAULT NULL,
  `evidence_files` longtext DEFAULT NULL,
  `student_id` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `year_of_study` varchar(255) DEFAULT NULL,
  `student_id_fk` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `response_notes` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` varchar(255) DEFAULT NULL,
  `permission_request` text DEFAULT NULL,
  `permission_approved_at` timestamp NULL DEFAULT NULL,
  `findings_report` text DEFAULT NULL,
  `meeting_notice` text DEFAULT NULL,
  `meeting_date` date DEFAULT NULL,
  `verdict` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `case_reports_ticket_number_unique` (`ticket_number`),
  KEY `case_reports_student_id_fk_foreign` (`student_id_fk`),
  KEY `case_reports_case_status_id_foreign` (`case_status_id`),
  KEY `case_reports_user_id_foreign` (`user_id`),
  CONSTRAINT `case_reports_case_status_id_foreign` FOREIGN KEY (`case_status_id`) REFERENCES `case_statuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `case_reports_student_id_fk_foreign` FOREIGN KEY (`student_id_fk`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `case_reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_reports`
--

LOCK TABLES `case_reports` WRITE;
/*!40000 ALTER TABLE `case_reports` DISABLE KEYS */;
INSERT INTO `case_reports` VALUES (1,NULL,'i was sexually assaulted by my lecturer Mr','sexual_harassment_gbv','gbv','gbv','i was sexually assaulted by my lecturer Mr. makungwweha in his office on the 27th of may','submitted',NULL,NULL,'at_iic','iic','high',1,NULL,'[\"assaulted\",\"sexually assaulted\",\"assault\"]',0,NULL,NULL,NULL,NULL,NULL,'6',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-29 18:32:42','2026-06-29 18:32:42'),(2,'CR000002','my friend, Grace Mwasuko was assaulted by Mr Hakungowa on 27 june','sexual_harassment_gbv','gbv','gbv','my friend, Grace Mwasuko was assaulted by Mr Hakungowa on 27 june','submitted',NULL,NULL,'at_iic','iic','high',1,NULL,'[\"assaulted\",\"assault\"]',0,'friend',NULL,NULL,NULL,NULL,'6',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-29 20:01:06','2026-06-29 20:01:06'),(3,'CR000003','Assault in Dormitory','sexual_harassment_gbv','gbv','gbv','I was assaulted in the dormitory last night. Need help and investigation.','submitted',NULL,NULL,'at_iic','iic','medium',1,NULL,'[\"dormitory\",\"assaulted\",\"assault\"]',0,NULL,NULL,NULL,NULL,NULL,'6',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-29 21:43:00','2026-06-29 21:43:00'),(4,'CR000004','Assault in Dormitory','sexual_harassment_gbv','gbv','gbv','I was assaulted in the dormitory last night. Need help and investigation.','submitted',NULL,NULL,'at_iic','iic','high',0,NULL,'[\"assaulted\",\"assault\"]',0,'victim',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(5,'CR000005','Assault in Dormitory','sexual_harassment_gbv','gbv','gbv','I was assaulted in the dormitory last night. Need help and investigation.','verdict_served',NULL,NULL,'closed','iic','high',0,NULL,'[\"assaulted\",\"assault\"]',0,'victim',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Forwarding to disciplinary',NULL,NULL,'Requesting permission to proceed with investigation.','2026-06-29 23:54:23','Investigation completed','Notice: disciplinary hearing scheduled','2026-07-05','Guilty - misconduct proven','2026-06-29 21:48:38','2026-06-29 21:57:48'),(6,'CR000006','i was sexually assaulted by Mr','sexual_assault','sexual_assault','sexual_assault','i was sexually assaulted by Mr. Ngwanguwa in','ongoing_investigation',NULL,NULL,'investigation','iic','medium',1,NULL,'[\"sexually assaulted\",\"assaulted\",\"assault\"]',0,'victim','2026-05-19',NULL,'Communication department',NULL,'6',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Dear Registrar,\n\nI am writing on behalf of the Internal Investigating Committee to request permission to investigate the following case:\n\nCase: CR000006\nReporter: Unknown reporter\nDefendant: Not specified\nLocation: Communication department\nDate: 5/19/2026\nTime: Not specified\n\nDescription:\ni was sexually assaulted by Mr. Ngwanguwa in\n\nPlease grant the IIC permission to proceed with an investigation into this matter.\n\nSincerely,\nInternal Investigating Committee','2026-06-29 23:45:43',NULL,NULL,NULL,NULL,'2026-06-29 23:01:11','2026-06-29 23:45:43');
/*!40000 ALTER TABLE `case_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `case_statuses`
--

DROP TABLE IF EXISTS `case_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_statuses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  `handler` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `case_statuses_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_statuses`
--

LOCK TABLES `case_statuses` WRITE;
/*!40000 ALTER TABLE `case_statuses` DISABLE KEYS */;
INSERT INTO `case_statuses` VALUES (1,'submitted','Submitted','investigator',1,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(2,'acknowledged','Acknowledged','investigator',2,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(3,'preliminary_review','Preliminary Review','registrar',3,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(4,'ongoing_investigation','Ongoing Investigation','investigator',4,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(5,'investigation_complete','Investigation Complete','registrar',5,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(6,'findings_under_review','Findings Under Review','registrar',6,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(7,'referred_to_disciplinary_hearing','Referred to Disciplinary Hearing','disciplinary_committee',7,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(8,'awaiting_disciplinary_hearing','Awaiting Disciplinary Hearing','disciplinary_committee',8,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(9,'under_review','Under Review','registrar',9,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(10,'verdict_served','Verdict Served','registrar',10,'2026-06-29 09:14:27','2026-06-29 09:14:27'),(11,'appealed','Appealed','registrar',11,'2026-06-29 09:14:27','2026-06-29 09:14:27');
/*!40000 ALTER TABLE `case_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `case_timelines`
--

DROP TABLE IF EXISTS `case_timelines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_timelines` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `case_report_id` bigint(20) unsigned NOT NULL,
  `stage` varchar(255) NOT NULL,
  `stage_label` varchar(255) DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `assigned_role` varchar(255) DEFAULT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notes`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `case_timelines_case_report_id_foreign` (`case_report_id`),
  CONSTRAINT `case_timelines_case_report_id_foreign` FOREIGN KEY (`case_report_id`) REFERENCES `case_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_timelines`
--

LOCK TABLES `case_timelines` WRITE;
/*!40000 ALTER TABLE `case_timelines` DISABLE KEYS */;
INSERT INTO `case_timelines` VALUES (1,4,'case_report_submission','Case Report Submission','2026-06-29 21:45:12','2026-06-29 21:45:12','2026-06-29 21:45:12',NULL,NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(2,4,'acknowledgement','Acknowledgement of Report','2026-06-29 21:45:12','2026-07-02 21:45:12',NULL,'iic',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(3,4,'preliminary_review','Preliminary Review & Assignment to IIC','2026-07-02 21:45:12','2026-07-09 21:45:12',NULL,'iic',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(4,4,'formal_investigation','Formal Investigation','2026-07-09 21:45:12','2026-07-30 21:45:12',NULL,'iic',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(5,4,'investigation_report_submission','Investigation Report Submission','2026-07-30 21:45:12','2026-08-06 21:45:12',NULL,'iic',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(6,4,'disciplinary_hearing','Disciplinary Committee Hearing','2026-08-06 21:45:12','2026-08-13 21:45:12',NULL,'disciplinary_committee',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(7,4,'disciplinary_decision','Disciplinary Committee Decision','2026-08-13 21:45:12','2026-08-27 21:45:12',NULL,'disciplinary_committee',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(8,4,'communication_of_verdict','Communication of Verdict to Parties','2026-08-27 21:45:12','2026-09-03 21:45:12',NULL,'disciplinary_committee',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(9,4,'appeal_submission','Appeal Submission (if allowed)','2026-09-03 21:45:12','2026-09-17 21:45:12',NULL,'student',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(10,4,'appeal_determination','Appeal Determination','2026-09-17 21:45:12','2026-10-17 21:45:12',NULL,'registrar',NULL,'2026-06-29 21:45:12','2026-06-29 21:45:12'),(11,5,'case_report_submission','Case Report Submission','2026-06-29 21:48:38','2026-06-29 21:48:38','2026-06-29 21:48:38',NULL,NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(12,5,'acknowledgement','Acknowledgement of Report','2026-06-29 21:48:38','2026-07-02 21:48:38',NULL,'iic',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(13,5,'preliminary_review','Preliminary Review & Assignment to IIC','2026-07-02 21:48:38','2026-07-09 21:48:38',NULL,'iic',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(14,5,'formal_investigation','Formal Investigation','2026-07-09 21:48:38','2026-07-30 21:48:38',NULL,'iic',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(15,5,'investigation_report_submission','Investigation Report Submission','2026-07-30 21:48:38','2026-08-06 21:48:38',NULL,'iic',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(16,5,'disciplinary_hearing','Disciplinary Committee Hearing','2026-08-06 21:48:38','2026-08-13 21:48:38',NULL,'disciplinary_committee',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(17,5,'disciplinary_decision','Disciplinary Committee Decision','2026-08-13 21:48:38','2026-08-27 21:48:38',NULL,'disciplinary_committee',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(18,5,'communication_of_verdict','Communication of Verdict to Parties','2026-08-27 21:48:38','2026-09-03 21:48:38',NULL,'disciplinary_committee',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(19,5,'appeal_submission','Appeal Submission (if allowed)','2026-09-03 21:48:38','2026-09-17 21:48:38',NULL,'student',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(20,5,'appeal_determination','Appeal Determination','2026-09-17 21:48:38','2026-10-17 21:48:38',NULL,'registrar',NULL,'2026-06-29 21:48:38','2026-06-29 21:48:38'),(21,6,'case_report_submission','Case Report Submission','2026-06-29 23:01:11','2026-06-29 23:01:11','2026-06-29 23:01:11',NULL,NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(22,6,'acknowledgement','Acknowledgement of Report','2026-06-29 23:01:11','2026-07-02 23:01:11',NULL,'iic',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(23,6,'preliminary_review','Preliminary Review & Assignment to IIC','2026-07-02 23:01:11','2026-07-09 23:01:11',NULL,'iic',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(24,6,'formal_investigation','Formal Investigation','2026-07-09 23:01:11','2026-07-30 23:01:11',NULL,'iic',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(25,6,'investigation_report_submission','Investigation Report Submission','2026-07-30 23:01:11','2026-08-06 23:01:11',NULL,'iic',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(26,6,'disciplinary_hearing','Disciplinary Committee Hearing','2026-08-06 23:01:11','2026-08-13 23:01:11',NULL,'disciplinary_committee',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(27,6,'disciplinary_decision','Disciplinary Committee Decision','2026-08-13 23:01:11','2026-08-27 23:01:11',NULL,'disciplinary_committee',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(28,6,'communication_of_verdict','Communication of Verdict to Parties','2026-08-27 23:01:11','2026-09-03 23:01:11',NULL,'disciplinary_committee',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(29,6,'appeal_submission','Appeal Submission (if allowed)','2026-09-03 23:01:11','2026-09-17 23:01:11',NULL,'student',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11'),(30,6,'appeal_determination','Appeal Determination','2026-09-17 23:01:11','2026-10-17 23:01:11',NULL,'registrar',NULL,'2026-06-29 23:01:11','2026-06-29 23:01:11');
/*!40000 ALTER TABLE `case_timelines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_conversations`
--

DROP TABLE IF EXISTS `chat_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_conversations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_token` varchar(64) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `stage` varchar(255) NOT NULL DEFAULT 'welcome',
  `collected_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`collected_data`)),
  `messages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`messages`)),
  `service_type` varchar(255) DEFAULT NULL,
  `submitted` tinyint(1) NOT NULL DEFAULT 0,
  `follow_up_sent` tinyint(1) NOT NULL DEFAULT 0,
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `follow_up_due_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chat_conversations_session_token_unique` (`session_token`),
  KEY `chat_conversations_user_id_foreign` (`user_id`),
  CONSTRAINT `chat_conversations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversations`
--

LOCK TABLES `chat_conversations` WRITE;
/*!40000 ALTER TABLE `chat_conversations` DISABLE KEYS */;
INSERT INTO `chat_conversations` VALUES (1,'e19a7c63bede486191ea5c414811f29c',6,'case_describe','{\"serviceType\":\"case_report\",\"selectedCategory\":\"sexual_harassment\"}','[{\"sender\":\"bot\",\"text\":\"Hey Praise \\ud83d\\udc4b\",\"timestamp\":\"2026-06-30T00:02:31.577Z\"},{\"sender\":\"bot\",\"text\":\"I\'m here whenever you need to vent, ask for help, or just think through something. Whatever you share stays between us.\\n\\nWhat\'s on your mind right now?\",\"timestamp\":\"2026-06-30T00:02:31.577Z\"},{\"sender\":\"user\",\"text\":\"I want to report a situation\",\"timestamp\":\"2026-06-30T00:02:44.292Z\"},{\"sender\":\"bot\",\"text\":\"I appreciate you trusting me with this. Reporting something can feel daunting, so I\\u2019ll keep things simple and guide you through each step.\",\"timestamp\":\"2026-06-30T00:02:44.292Z\"},{\"sender\":\"bot\",\"text\":\"What kind of situation would you like to report?\",\"timestamp\":\"2026-06-30T00:02:44.292Z\"},{\"sender\":\"user\",\"text\":\"Sexual Harassment\",\"timestamp\":\"2026-06-30T00:02:50.038Z\"},{\"sender\":\"bot\",\"text\":\"Thanks for sharing that.\",\"timestamp\":\"2026-06-30T00:02:50.038Z\"},{\"sender\":\"bot\",\"text\":\"Whenever you feel ready, tell me in your own words what happened. There\\u2019s no pressure \\u2014 just what you\\u2019re comfortable with.\",\"timestamp\":\"2026-06-30T00:02:50.038Z\"}]','case_report',0,0,'2026-06-29 22:08:47','2026-06-30 22:02:31','2026-06-29 22:02:31','2026-06-29 22:08:47'),(2,'41bd9eabc552460e88d9eea55862e901',6,'case_describe','{\"serviceType\":\"case_report\",\"selectedCategory\":\"sexual_harassment\"}','[{\"sender\":\"bot\",\"text\":\"Hey Praise \\ud83d\\udc4b\",\"timestamp\":\"2026-06-30T00:17:59.174Z\"},{\"sender\":\"bot\",\"text\":\"I\'m here whenever you need to vent, ask for help, or just think through something. Whatever you share stays between us.\\n\\nWhat\'s on your mind right now?\",\"timestamp\":\"2026-06-30T00:17:59.174Z\"},{\"sender\":\"user\",\"text\":\"I want to report a situation\",\"timestamp\":\"2026-06-30T00:18:02.610Z\"},{\"sender\":\"bot\",\"text\":\"I appreciate you trusting me with this. Reporting something can feel daunting, so I\\u2019ll keep things simple and guide you through each step.\",\"timestamp\":\"2026-06-30T00:18:02.610Z\"},{\"sender\":\"bot\",\"text\":\"What kind of situation would you like to report?\",\"timestamp\":\"2026-06-30T00:18:02.610Z\"},{\"sender\":\"user\",\"text\":\"Sexual Harassment\",\"timestamp\":\"2026-06-30T00:18:05.836Z\"},{\"sender\":\"bot\",\"text\":\"Thanks for sharing that.\",\"timestamp\":\"2026-06-30T00:18:05.836Z\"},{\"sender\":\"bot\",\"text\":\"Whenever you feel ready, tell me in your own words what happened. There\\u2019s no pressure \\u2014 just what you\\u2019re comfortable with.\",\"timestamp\":\"2026-06-30T00:18:05.836Z\"}]','case_report',0,0,'2026-06-29 22:21:05','2026-06-30 22:08:49','2026-06-29 22:08:49','2026-06-29 22:21:05');
/*!40000 ALTER TABLE `chat_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counseling_requests`
--

DROP TABLE IF EXISTS `counseling_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `counseling_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) unsigned DEFAULT NULL,
  `concern` text NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `urgency_level` varchar(255) NOT NULL,
  `preferred_time` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending_review',
  `requires_immediate_attention` tinyint(1) NOT NULL DEFAULT 0,
  `matched_keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`matched_keywords`)),
  `proposed_date` date DEFAULT NULL,
  `proposed_time` time DEFAULT NULL,
  `student_approved` tinyint(1) DEFAULT NULL,
  `student_rejected_at` timestamp NULL DEFAULT NULL,
  `counselor_rejected_at` timestamp NULL DEFAULT NULL,
  `counselor_approved` tinyint(1) DEFAULT NULL,
  `counselor_id` bigint(20) unsigned DEFAULT NULL,
  `scheduled_date` date DEFAULT NULL,
  `scheduled_time` time DEFAULT NULL,
  `total_sessions` tinyint(3) unsigned DEFAULT NULL,
  `completed_sessions` tinyint(3) unsigned DEFAULT NULL,
  `session_notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`session_notes`)),
  `session_scores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`session_scores`)),
  `overall_score` decimal(5,2) DEFAULT NULL,
  `external_session_records` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`external_session_records`)),
  `recommendations` text DEFAULT NULL,
  `referral_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `external_counselor_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `counseling_requests_student_id_foreign` (`student_id`),
  KEY `counseling_requests_counselor_id_foreign` (`counselor_id`),
  KEY `counseling_requests_external_counselor_id_foreign` (`external_counselor_id`),
  CONSTRAINT `counseling_requests_counselor_id_foreign` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `counseling_requests_external_counselor_id_foreign` FOREIGN KEY (`external_counselor_id`) REFERENCES `external_counselors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `counseling_requests_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counseling_requests`
--

LOCK TABLES `counseling_requests` WRITE;
/*!40000 ALTER TABLE `counseling_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `counseling_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counseling_sessions`
--

DROP TABLE IF EXISTS `counseling_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `counseling_sessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_id` bigint(20) unsigned NOT NULL,
  `session_number` tinyint(3) unsigned NOT NULL,
  `date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `score` tinyint(3) unsigned DEFAULT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `counseling_sessions_request_id_foreign` (`request_id`),
  CONSTRAINT `counseling_sessions_request_id_foreign` FOREIGN KEY (`request_id`) REFERENCES `counseling_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counseling_sessions`
--

LOCK TABLES `counseling_sessions` WRITE;
/*!40000 ALTER TABLE `counseling_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `counseling_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counselor_schedules`
--

DROP TABLE IF EXISTS `counselor_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `counselor_schedules` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `counselor_id` bigint(20) unsigned NOT NULL,
  `week_start_date` date NOT NULL,
  `week_end_date` date NOT NULL,
  `available_slots` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`available_slots`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `counselor_schedules_counselor_id_foreign` (`counselor_id`),
  CONSTRAINT `counselor_schedules_counselor_id_foreign` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counselor_schedules`
--

LOCK TABLES `counselor_schedules` WRITE;
/*!40000 ALTER TABLE `counselor_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `counselor_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `external_counselors`
--

DROP TABLE IF EXISTS `external_counselors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `external_counselors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `added_by` bigint(20) unsigned DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `external_counselors_user_id_unique` (`user_id`),
  KEY `external_counselors_added_by_foreign` (`added_by`),
  CONSTRAINT `external_counselors_added_by_foreign` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `external_counselors_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `external_counselors`
--

LOCK TABLES `external_counselors` WRITE;
/*!40000 ALTER TABLE `external_counselors` DISABLE KEYS */;
INSERT INTO `external_counselors` VALUES (1,8,'Dr. Jane External','external@mzuni.ac.mw','0999000007','St John Of God',NULL,NULL,'2026-06-29 09:14:31','2026-06-29 09:14:31');
/*!40000 ALTER TABLE `external_counselors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_06_16_190000_create_case_reports_table',1),(5,'2026_06_16_193952_add_role_phone_location_to_users_table',1),(6,'2026_06_16_193952_create_counseling_requests_table',1),(7,'2026_06_16_193953_create_counseling_sessions_table',1),(8,'2026_06_16_193953_create_counselor_schedules_table',1),(9,'2026_06_16_193954_create_counselor_availability_slots_table',1),(10,'2026_06_16_195955_create_personal_access_tokens_table',1),(11,'2026_06_16_200000_add_is_external_to_users_table',1),(12,'2026_06_16_200500_add_approval_rejection_timestamps_to_counseling_requests_table',1),(13,'2026_06_16_201000_create_external_counselors_table_and_link_counseling_requests_table',1),(14,'2026_06_18_100000_normalize_carebridge_schema',1),(15,'2026_06_19_110000_add_counseling_workflow_fields',1),(16,'2026_06_19_120000_make_assigned_role_nullable_on_case_reports',1),(17,'2026_06_20_100000_create_chat_conversations_table',1),(18,'2026_06_25_120000_add_subject_and_evidence_to_case_reports',1),(19,'2026_06_25_121000_add_ticket_number_to_case_reports',1),(20,'2026_06_26_000000_add_student_profile_fields_to_users_table',1),(21,'2026_06_29_084758_add_reported_by_type_to_case_reports_table',1),(22,'2026_06_29_090820_create_case_statuses_table_and_link_case_reports',1),(23,'2026_07_01_000000_create_case_timelines_table',2),(24,'2026_06_30_120000_add_user_id_to_case_reports',3),(25,'2026_06_30_150000_create_case_permission_requests_table',4);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (7,'App\\Models\\User',6,'api-token','a587f699132aa597a1ae0cc4b51fd3948a348c96ea929baa23181e97ddcbc22a','[\"*\"]','2026-06-29 23:49:19',NULL,'2026-06-29 21:41:50','2026-06-29 23:49:19'),(8,'App\\Models\\User',5,'api-token','c36fee21e825768c6a4994780489636b453a9a3c4dca94b194ce1c2ff0098afb','[\"*\"]','2026-06-29 21:57:57',NULL,'2026-06-29 21:49:39','2026-06-29 21:57:57'),(9,'App\\Models\\User',1,'api-token','bf630865303a5710f4f409c6d218437080b8123d305319f5628d03949d71a7b4','[\"*\"]','2026-06-29 21:57:27',NULL,'2026-06-29 21:53:19','2026-06-29 21:57:27'),(10,'App\\Models\\User',2,'api-token','9e3f87fbea4e50d8da0a9b33bb9bb5ff4a5d04b96258e08bfb14d80f3403bf2d','[\"*\"]','2026-06-29 21:57:48',NULL,'2026-06-29 21:57:33','2026-06-29 21:57:48'),(11,'App\\Models\\User',9,'api-token','cae94fe56af25e4be924a7fe80fa265f0b9289b3e49fc29215a587097e5daf53','[\"*\"]','2026-06-29 23:31:46',NULL,'2026-06-29 22:45:07','2026-06-29 23:31:46'),(16,'App\\Models\\User',5,'api-token','524feb72577157a8ee547e4ce317f239d78dc2fa0648fb115f6854fa8431f3d2','[\"*\"]','2026-06-29 23:49:21',NULL,'2026-06-29 23:46:00','2026-06-29 23:49:21');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('NxBUVaz9EYIoP47LrA46V5mK9DlKy9YcTZlV5n4o',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZzN5dlpMTmVLV085WjVMSmFiWU5YTExRZW1NSXlsQWg0N29RMHhSZCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1782783000),('ShIvIQUrK0oFPvWmEFTCiaRmUZQsD36FYiFxi4Cc',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.126.0 Chrome/148.0.7778.97 Electron/42.2.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTEVBdzAxWjJTZXdEMG9lQTJqallMeDF1T1BJMmt4RUlOTGdORXpHeiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1782780868);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'student',
  `phone` varchar(255) DEFAULT NULL,
  `location` enum('oncampus','offcampus') DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `program` varchar(255) DEFAULT NULL,
  `level` varchar(255) DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `has_ongoing_case` tinyint(1) NOT NULL DEFAULT 0,
  `is_external` tinyint(1) NOT NULL DEFAULT 0,
  `schedule_setup_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_unique` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Registrar','registrar@mzuni.ac.mw','registrar','0999000001','oncampus',NULL,NULL,NULL,NULL,0,0,NULL,'2026-06-29 09:14:27','$2y$12$Xu5B5q53qln8Pf0qBW7GyOiJCI4nyenvmkvDHmvl0VG35y7zApYHq','eXBF9nwgwe','2026-06-29 09:14:28','2026-06-29 09:14:28'),(2,'Disciplinary Committee','disciplinary@mzuni.ac.mw','disciplinary_committee','0999000002','oncampus',NULL,NULL,NULL,NULL,0,0,NULL,'2026-06-29 09:14:28','$2y$12$FERF1VHIvx2zlMnekcRLg.4j9Sp9RQyQoFUMVn/WeDhaD3xN0Duia','MpuNvt4qxN','2026-06-29 09:14:28','2026-06-29 09:14:28'),(3,'University Counselor','universitycounsellor@mzuni.ac.mw','counselor','0999000003','oncampus',NULL,NULL,NULL,NULL,0,0,NULL,'2026-06-29 09:14:29','$2y$12$EaVNv0gpOoSmTWaQACc8PeR5WmatnVOO1r8PCSooxObqfKaqvdbI2','JAMQBbfpzO','2026-06-29 09:14:29','2026-06-29 09:14:29'),(4,'Dean of Students','deanofstudents@mzuni.ac.mw','dean','0999000004','oncampus',NULL,NULL,NULL,NULL,0,0,NULL,'2026-06-29 09:14:29','$2y$12$UAOhkaGvDlbb2EK/wZSNKu1iZwi7I19XHwLOP.IZkTJAGQ3IslVq2','Ga0c5jinot','2026-06-29 09:14:29','2026-06-29 09:14:29'),(5,'IIC Officer','iic@mzuni.ac.mw','iic','0999000005','oncampus',NULL,NULL,NULL,NULL,0,0,NULL,'2026-06-29 09:14:29','$2y$12$tvQSpgeg/pUFYKkZLiypnO6ac8060rsM/enTMVcQkPSIUsmZMZBMi','4GeNGXDyFg','2026-06-29 09:14:30','2026-06-29 09:14:30'),(6,'Praise Saina','student@mzuni.ac.mw','student','0999000006','oncampus','male','Bachelor of science in Education Science','2',NULL,0,0,NULL,'2026-06-29 09:14:30','$2y$12$MpHbrgQ49YX7PH.Js9rMZ.jcP26WLS4yGvsxQjRqEFEOPjYxCFc0a','0JsWu0Rpn8','2026-06-29 09:14:30','2026-06-29 09:14:30'),(7,'System administrator','carebridgeadmin@mzuni.ac.mw','admin','0998745644','oncampus',NULL,NULL,NULL,NULL,0,0,NULL,'2026-06-29 09:14:30','$2y$12$qMYmW.YB7fK.NezuTle.g.0lcsk.bEslHCdyM7MVVl1dGLOPNOME6','Yu9ZZ3CaCc','2026-06-29 09:14:31','2026-06-29 09:14:31'),(8,'Dr. Jane External','external@mzuni.ac.mw','external_counselor','0999000007','offcampus',NULL,NULL,NULL,NULL,0,1,NULL,'2026-06-29 09:14:31','$2y$12$UMjX0eaqGFGFPZgQjY4i3uwh5EEAxtCVv4ItfCcsvoi32/W.mG9Jq','vWJ94yUBjx','2026-06-29 09:14:31','2026-06-29 09:14:31'),(9,'Chisomo Masuku','bict0126@mzuni.ac.mw','student','0987414840','oncampus','female','BICT','3',NULL,0,0,NULL,NULL,'$2y$12$WrfyExwejOrn5/KlNIoJa.xOtQr46iqvRUFrAVFWiekVxBX8/NTuu',NULL,'2026-06-29 22:45:07','2026-06-29 22:45:07');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'carebridge system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-30  4:00:02
