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
-- Table structure for table `case_reports`
--

DROP TABLE IF EXISTS `case_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(255) NOT NULL,
  `sub_category` varchar(255) DEFAULT NULL,
  `detailed_category` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'submitted',
  `workflow_stage` varchar(255) NOT NULL DEFAULT 'at_iic',
  `assigned_role` varchar(255) DEFAULT NULL,
  `permission_request` text DEFAULT NULL,
  `permission_approved_at` timestamp NULL DEFAULT NULL,
  `findings_report` text DEFAULT NULL,
  `meeting_notice` text DEFAULT NULL,
  `meeting_date` timestamp NULL DEFAULT NULL,
  `verdict` text DEFAULT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `urgency_level` varchar(255) DEFAULT NULL,
  `requires_location_sharing` tinyint(1) NOT NULL DEFAULT 0,
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`location`)),
  `matched_keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`matched_keywords`)),
  `response_notes` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` varchar(255) DEFAULT NULL,
  `student_id` bigint(20) unsigned DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `year_of_study` varchar(255) DEFAULT NULL,
  `incident_date` date DEFAULT NULL,
  `incident_location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `case_reports_student_id_foreign` (`student_id`),
  CONSTRAINT `case_reports_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_reports`
--

LOCK TABLES `case_reports` WRITE;
/*!40000 ALTER TABLE `case_reports` DISABLE KEYS */;
INSERT INTO `case_reports` VALUES (1,'sexual_harassment_gbv',NULL,'sexual_harassment','Someone sexually harassed me in the hostel last week. I am scared to report in person.','under_review','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,1,'high',0,NULL,'[\"sexually harassed\",\"hostel\"]','Your report has been received and is under confidential review by the IIC. A trained officer will contact you through secure channels within 48 hours. Your safety is our priority.','2026-06-18 07:34:38','5',NULL,NULL,NULL,'2026-06-11','Hostel Block C','2026-06-18 07:34:38','2026-06-18 07:34:38'),(2,'general',NULL,'housing','My hostel room has a broken lock and I do not feel safe. I reported it weeks ago.','resolved','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,'medium',0,NULL,NULL,'We have escalated your housing safety concern to facilities management. A new lock will be installed within 24 hours.','2026-06-18 07:34:39','4',6,'Computer Science','3',NULL,'Hostel Block A','2026-06-18 07:34:39','2026-06-18 07:34:39'),(3,'general','fees_support','financial_aid','I cannot afford tuition this semester and need a payment plan or bursary support.','resolved','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,'high',0,NULL,NULL,'Approved a 3-month payment plan. Visit the Registrar office by Friday.','2026-06-18 07:39:36','1',6,'Business Administration','2',NULL,NULL,'2026-06-18 07:39:35','2026-06-18 07:39:36'),(4,'general',NULL,'academic_misconduct','A classmate copied my exam answers and submitted them as their own work.','under_review','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,'medium',0,NULL,NULL,'Investigation opened. Both parties will be contacted for a hearing next week.','2026-06-18 07:39:37','2',6,'Computer Science','3',NULL,NULL,'2026-06-18 07:39:36','2026-06-18 07:39:37'),(5,'general','fees_support','financial_aid','I cannot afford tuition this semester and need a payment plan or bursary support.','resolved','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,'high',0,NULL,NULL,'Approved a 3-month payment plan. Visit the Registrar office by Friday.','2026-06-18 07:41:59','1',6,'Business Administration','2',NULL,NULL,'2026-06-18 07:41:58','2026-06-18 07:41:59'),(6,'general',NULL,'academic_misconduct','A classmate copied my exam answers and submitted them as their own work.','under_review','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,'medium',0,NULL,NULL,'Investigation opened. Both parties will be contacted for a hearing next week.','2026-06-18 07:41:59','2',6,'Computer Science','3',NULL,NULL,'2026-06-18 07:41:58','2026-06-18 07:41:59'),(7,'general','fees_support','financial_aid','I cannot afford tuition this semester and need a payment plan or bursary support.','resolved','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,'high',0,NULL,NULL,'Approved a 3-month payment plan. Visit the Registrar office by Friday.','2026-06-18 07:43:08','1',6,'Business Administration','2',NULL,NULL,'2026-06-18 07:43:07','2026-06-18 07:43:08'),(8,'general',NULL,'academic_misconduct','A classmate copied my exam answers and submitted them as their own work.','under_review','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,'medium',0,NULL,NULL,'Investigation opened. Both parties will be contacted for a hearing next week.','2026-06-18 07:43:08','2',6,'Computer Science','3',NULL,NULL,'2026-06-18 07:43:07','2026-06-18 07:43:08'),(9,'general',NULL,NULL,'API test anonymous report','submitted','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-19 20:08:36','2026-06-19 20:08:36'),(10,'gbv',NULL,NULL,'API test case for workflow','submitted','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,'2026-06-19 20:08:40','2026-06-19 20:08:40'),(11,'general',NULL,NULL,'API test anonymous report','submitted','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-19 20:09:12','2026-06-19 20:09:12'),(12,'gbv',NULL,NULL,'API test case for workflow','under_review','meeting_notice_sent','disciplinary_committee','Request permission to investigate this case','2026-06-19 20:09:16','Test investigation findings','Disciplinary committee meeting scheduled','2026-06-26 22:00:00',NULL,0,NULL,0,NULL,NULL,NULL,'2026-06-19 20:09:17','1',6,NULL,NULL,NULL,NULL,'2026-06-19 20:09:16','2026-06-19 20:09:17'),(13,'general',NULL,NULL,'API test anonymous report','submitted','at_iic','iic',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-19 20:10:35','2026-06-19 20:10:35'),(14,'gbv',NULL,NULL,'API test case for workflow','closed','closed',NULL,'Request permission to investigate this case','2026-06-19 20:10:39','Test investigation findings','Disciplinary committee meeting scheduled','2026-06-26 22:00:00','warning',0,NULL,0,NULL,NULL,NULL,'2026-06-19 20:10:40','2',6,NULL,NULL,NULL,NULL,'2026-06-19 20:10:39','2026-06-19 20:10:40'),(15,'general',NULL,NULL,'I was sexually assaulted on campus and need help immediately','submitted','at_iic','dean',NULL,NULL,NULL,NULL,NULL,NULL,1,'immediate',1,NULL,'[\"need help immediately\"]',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-19 20:21:31','2026-06-19 20:21:31');
/*!40000 ALTER TABLE `case_reports` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversations`
--

LOCK TABLES `chat_conversations` WRITE;
/*!40000 ALTER TABLE `chat_conversations` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counseling_requests`
--

LOCK TABLES `counseling_requests` WRITE;
/*!40000 ALTER TABLE `counseling_requests` DISABLE KEYS */;
INSERT INTO `counseling_requests` VALUES (1,6,'I have been feeling very anxious and depressed about my exams. I cannot sleep and I need someone to talk to.\n\nAdditional context: It has been going on for a few weeks.','depression','high','afternoon','scheduled',0,'[\"anxiety\",\"depressed\",\"exams\"]',NULL,NULL,NULL,NULL,NULL,NULL,3,'2026-06-20','14:00:00',6,0,NULL,NULL,NULL,NULL,'We have reviewed your case. A counseling session is scheduled for June 20 at 2:00 PM. Please attend the University Counselling office. You are not alone.',NULL,'2026-06-18 07:34:16','2026-06-18 07:34:17',NULL),(2,6,'I have been feeling very anxious and depressed about my exams. I cannot sleep and I need someone to talk to.\n\nAdditional context: It has been going on for a few weeks.','depression','high','afternoon','scheduled',0,'[\"anxiety\",\"depressed\",\"exams\"]',NULL,NULL,NULL,NULL,NULL,NULL,3,'2026-06-20','14:00:00',6,0,NULL,NULL,NULL,NULL,'We have reviewed your case. A counseling session is scheduled for June 20 at 2:00 PM. Please attend the University Counselling office. You are not alone.',NULL,'2026-06-18 07:34:36','2026-06-18 07:34:37',NULL),(3,6,'API test concern','academic','medium',NULL,'scheduled',0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-06-23','10:00:00',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-19 20:08:39','2026-06-19 20:08:40',NULL),(4,6,'API test concern','academic','medium',NULL,'in_progress',0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-06-23','10:00:00',NULL,1,'[\"[Score: 80\\/100] Test session notes\"]','[80]',80.00,NULL,NULL,NULL,'2026-06-19 20:09:14','2026-06-19 20:09:16',NULL),(5,6,'API test concern','academic','medium',NULL,'in_progress',0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-06-23','10:00:00',NULL,1,'[\"[Score: 80\\/100] Test session notes\"]','[80]',80.00,NULL,NULL,NULL,'2026-06-19 20:10:37','2026-06-19 20:10:39',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counseling_sessions`
--

LOCK TABLES `counseling_sessions` WRITE;
/*!40000 ALTER TABLE `counseling_sessions` DISABLE KEYS */;
INSERT INTO `counseling_sessions` VALUES (1,4,1,'2026-06-19','Test session notes',80,1,'2026-06-19 20:09:16','2026-06-19 20:09:16'),(2,5,1,'2026-06-19','Test session notes',80,1,'2026-06-19 20:10:39','2026-06-19 20:10:39');
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
INSERT INTO `external_counselors` VALUES (1,7,'Dr. Jane External','external@mzuni.ac.mw','0999000007','Mind Wellness Clinic',NULL,'Specializes in trauma and addiction counseling.','2026-06-18 07:32:13','2026-06-18 07:32:13');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'default','{\"uuid\":\"2bf687db-5fe2-4100-befc-a876eda4303d\",\"displayName\":\"App\\\\Mail\\\\CareBridgeNotificationMail\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:35:\\\"App\\\\Mail\\\\CareBridgeNotificationMail\\\":7:{s:8:\\\"headline\\\";s:15:\\\"New Case Report\\\";s:4:\\\"body\\\";s:303:\\\"New case report submitted — review on your dashboard\\n\\nCase ID: #15\\nCategory: general\\nReporter: Anonymous\\nWorkflow Stage: at_iic\\nUrgency: immediate\\nAssigned Role: dean\\n\\nDescription:\\nI was sexually assaulted on campus and need help immediately\\n\\nPlease log in to your CareBridge dashboard to take action.\\\";s:9:\\\"actionUrl\\\";s:21:\\\"http:\\/\\/127.0.0.1:5173\\\";s:11:\\\"actionLabel\\\";N;s:8:\\\"priority\\\";s:6:\\\"urgent\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:26:\\\"deanofstudents@mzuni.ac.mw\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\",\"batchId\":null},\"createdAt\":1781907691,\"delay\":null}',0,NULL,1781907691,1781907691),(2,'default','{\"uuid\":\"fd86be9d-bc7a-4300-9d78-58232af10477\",\"displayName\":\"App\\\\Mail\\\\CareBridgeNotificationMail\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:35:\\\"App\\\\Mail\\\\CareBridgeNotificationMail\\\":7:{s:8:\\\"headline\\\";s:19:\\\"Urgent GBV\\/SH Alert\\\";s:4:\\\"body\\\";s:301:\\\"Anonymous GBV\\/SH report — priority triage required\\n\\nCase ID: #15\\nCategory: general\\nReporter: Anonymous\\nWorkflow Stage: at_iic\\nUrgency: immediate\\nAssigned Role: dean\\n\\nDescription:\\nI was sexually assaulted on campus and need help immediately\\n\\nPlease log in to your CareBridge dashboard to take action.\\\";s:9:\\\"actionUrl\\\";s:21:\\\"http:\\/\\/127.0.0.1:5173\\\";s:11:\\\"actionLabel\\\";N;s:8:\\\"priority\\\";s:6:\\\"urgent\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:15:\\\"iic@mzuni.ac.mw\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\",\"batchId\":null},\"createdAt\":1781907691,\"delay\":null}',0,NULL,1781907691,1781907691),(3,'default','{\"uuid\":\"a25f2e8c-c526-4074-8a9c-2ec09a519e63\",\"displayName\":\"App\\\\Mail\\\\CareBridgeNotificationMail\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:35:\\\"App\\\\Mail\\\\CareBridgeNotificationMail\\\":7:{s:8:\\\"headline\\\";s:19:\\\"Urgent GBV\\/SH Alert\\\";s:4:\\\"body\\\";s:301:\\\"Anonymous GBV\\/SH report — priority triage required\\n\\nCase ID: #15\\nCategory: general\\nReporter: Anonymous\\nWorkflow Stage: at_iic\\nUrgency: immediate\\nAssigned Role: dean\\n\\nDescription:\\nI was sexually assaulted on campus and need help immediately\\n\\nPlease log in to your CareBridge dashboard to take action.\\\";s:9:\\\"actionUrl\\\";s:21:\\\"http:\\/\\/127.0.0.1:5173\\\";s:11:\\\"actionLabel\\\";N;s:8:\\\"priority\\\";s:6:\\\"urgent\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:26:\\\"deanofstudents@mzuni.ac.mw\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\",\"batchId\":null},\"createdAt\":1781907691,\"delay\":null}',0,NULL,1781907691,1781907691);
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_06_16_193952_add_role_phone_location_to_users_table',1),(5,'2026_06_16_193952_create_counseling_requests_table',1),(6,'2026_06_16_193953_create_case_reports_table',1),(7,'2026_06_16_193953_create_counseling_sessions_table',1),(8,'2026_06_16_193953_create_counselor_schedules_table',1),(9,'2026_06_16_193954_create_counselor_availability_slots_table',1),(10,'2026_06_16_195955_create_personal_access_tokens_table',1),(11,'2026_06_16_200000_add_is_external_to_users_table',1),(12,'2026_06_16_200500_add_approval_rejection_timestamps_to_counseling_requests_table',1),(13,'2026_06_16_201000_create_external_counselors_table_and_link_counseling_requests_table',1),(14,'2026_06_18_100000_normalize_carebridge_schema',1),(15,'2026_06_19_100000_add_case_workflow_fields',2),(16,'2026_06_19_110000_add_counseling_workflow_fields',3),(17,'2026_06_19_120000_make_assigned_role_nullable_on_case_reports',4),(18,'2026_06_20_100000_create_chat_conversations_table',5);
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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',6,'api-token','1c785be2fa15848f8579d63ddd4d738797188486df8b0cead8602952bc629d52','[\"*\"]','2026-06-18 07:34:16',NULL,'2026-06-18 07:34:16','2026-06-18 07:34:16'),(2,'App\\Models\\User',3,'api-token','288b85835fbd923e48efed7c521f3b87907a00f398a5fb90b7e3032781f6c35c','[\"*\"]','2026-06-18 07:34:17',NULL,'2026-06-18 07:34:17','2026-06-18 07:34:17'),(3,'App\\Models\\User',6,'api-token','e4243307e7a4fb102327fc88fda45cf466faac181ad70afd1b08fead415d0916','[\"*\"]','2026-06-18 07:34:39',NULL,'2026-06-18 07:34:36','2026-06-18 07:34:39'),(4,'App\\Models\\User',3,'api-token','21001406518254e74f607c608352fc98ea1fcc3734bf30f4df12f7d0d1ce469a','[\"*\"]','2026-06-18 07:34:37',NULL,'2026-06-18 07:34:37','2026-06-18 07:34:37'),(5,'App\\Models\\User',5,'api-token','692673bf0c962436df88c29e45680c98b13a7cd24979cd4617077e24b0695de2','[\"*\"]','2026-06-18 07:34:38',NULL,'2026-06-18 07:34:38','2026-06-18 07:34:38'),(6,'App\\Models\\User',4,'api-token','1a7ef8e580d7d4601353a2dc672c6dc2d3d35d5e5412515d3d56050eac616e98','[\"*\"]','2026-06-18 07:34:39',NULL,'2026-06-18 07:34:39','2026-06-18 07:34:39'),(7,'App\\Models\\User',1,'api-token','994fbf98ee767cb46349de6646030262203a0240bf90fbad74d91a5e8e082137','[\"*\"]','2026-06-18 07:39:36',NULL,'2026-06-18 07:39:34','2026-06-18 07:39:36'),(8,'App\\Models\\User',2,'api-token','52cfec82da5395c5ac12ee3fe0e98557842843787ce828bcb98bc23dd474829f','[\"*\"]','2026-06-18 07:39:37',NULL,'2026-06-18 07:39:35','2026-06-18 07:39:37'),(9,'App\\Models\\User',6,'api-token','8aad6746394078d0583b437b683f46deb8d0c8e0bfc2a33c83159ebac0777e08','[\"*\"]',NULL,NULL,'2026-06-18 07:39:35','2026-06-18 07:39:35'),(10,'App\\Models\\User',1,'api-token','b8e69a5d6e3571855ad1971c0db6a9c8058314f2dc9b3f1ce7401c16998d0837','[\"*\"]','2026-06-18 07:41:59',NULL,'2026-06-18 07:41:57','2026-06-18 07:41:59'),(11,'App\\Models\\User',2,'api-token','79a677b007dbb501e626942f57809c305c19e4b4ab1797322bc77558703527f0','[\"*\"]','2026-06-18 07:41:59',NULL,'2026-06-18 07:41:57','2026-06-18 07:41:59'),(12,'App\\Models\\User',6,'api-token','426164e236c3814d3f619a55a7c8729c73e79910de9bf447160328ea42ed8794','[\"*\"]',NULL,NULL,'2026-06-18 07:41:58','2026-06-18 07:41:58'),(13,'App\\Models\\User',1,'api-token','fb3beefd6185c9063ba9e519bc99358ba68cbfe91e4df6caf1ff32ca3e201294','[\"*\"]','2026-06-18 07:43:08',NULL,'2026-06-18 07:43:06','2026-06-18 07:43:08'),(14,'App\\Models\\User',2,'api-token','8afe1546debfa7116186ea2b12286dd9611eac2c77ac273710e33e1385d3d2e6','[\"*\"]','2026-06-18 07:43:08',NULL,'2026-06-18 07:43:06','2026-06-18 07:43:08'),(15,'App\\Models\\User',6,'api-token','dc67ae07b7138cb81eaef38d08ca2a48573d270412513f23e97777df0ffb3b33','[\"*\"]',NULL,NULL,'2026-06-18 07:43:07','2026-06-18 07:43:07'),(18,'App\\Models\\User',6,'api-token','4e95e2cc373298adee893f3a6e81cbf6bf5cf807221413a6acecc7cfd047ec2e','[\"*\"]','2026-06-18 08:47:16',NULL,'2026-06-18 08:47:15','2026-06-18 08:47:16'),(19,'App\\Models\\User',6,'api-token','45c7e73e95301a8c766bd520bac7ba0adb1e4a62a53e08c44dbe350032388c20','[\"*\"]','2026-06-18 09:06:01',NULL,'2026-06-18 08:51:58','2026-06-18 09:06:01'),(20,'App\\Models\\User',6,'api-token','4f1d70997371a30fdf19a7430274423a940fac7c5c8566ebe3bc69270cae933c','[\"*\"]','2026-06-18 09:19:10',NULL,'2026-06-18 09:19:07','2026-06-18 09:19:10'),(21,'App\\Models\\User',6,'api-token','b9b7526a9bff810e9ffba7578c4bc3a9a8eb583343a40a9e8d08600318d6117a','[\"*\"]',NULL,NULL,'2026-06-19 20:07:51','2026-06-19 20:07:51'),(22,'App\\Models\\User',6,'api-token','00074ddc364c7de5287245be3fdb9cafc3444a8c006a8f916c510df3bb24f6c7','[\"*\"]',NULL,NULL,'2026-06-19 20:08:34','2026-06-19 20:08:34'),(23,'App\\Models\\User',3,'api-token','7e77356704d22defd839ea1cf50c2de2a00b2558278b037d1239e0da7d248417','[\"*\"]','2026-06-19 20:08:40',NULL,'2026-06-19 20:08:34','2026-06-19 20:08:40'),(25,'App\\Models\\User',5,'api-token','88cc8e79f283bc11f5d3e1176583a1fcb9f4998d3271116aaa92e52d2b813330','[\"*\"]','2026-06-19 20:08:41',NULL,'2026-06-19 20:08:35','2026-06-19 20:08:41'),(26,'App\\Models\\User',1,'api-token','fb4f64e5cde77d036cce13473aadb668b68a32ee769156f8d3692f3b4b9258a2','[\"*\"]','2026-06-19 20:08:41',NULL,'2026-06-19 20:08:36','2026-06-19 20:08:41'),(27,'App\\Models\\User',2,'api-token','24e6993d5de1f8cd23be9d66c5a649c169a5e9d149c5e79064cd26457c0a61bc','[\"*\"]','2026-06-19 20:08:42',NULL,'2026-06-19 20:08:36','2026-06-19 20:08:42'),(28,'App\\Models\\User',6,'api-token','cba0b253496d49b920e1da57883391d1a94d6a2b6a2b45e322508aafc3ee6b1f','[\"*\"]',NULL,NULL,'2026-06-19 20:09:10','2026-06-19 20:09:10'),(29,'App\\Models\\User',3,'api-token','98a7e4e9d41708c230dbf8cf5a1aa308f1855e8c880bf148c9bb3212a86e9e70','[\"*\"]','2026-06-19 20:09:16',NULL,'2026-06-19 20:09:11','2026-06-19 20:09:16'),(31,'App\\Models\\User',5,'api-token','abb658313fe34c29c27b3efc004a6227a742458ffbd66affbb4cf3a00c952756','[\"*\"]','2026-06-19 20:09:17',NULL,'2026-06-19 20:09:11','2026-06-19 20:09:17'),(32,'App\\Models\\User',1,'api-token','da7cf02bb0a8b013eb2346f2ccd207e5c34b97254e6903b785a03f2e789c8f58','[\"*\"]','2026-06-19 20:09:17',NULL,'2026-06-19 20:09:12','2026-06-19 20:09:17'),(33,'App\\Models\\User',2,'api-token','98960293ecc849c50acf73094fa5c0d13c0e66a13bbe6cee7ee89ecaf19b6ec9','[\"*\"]','2026-06-19 20:09:17',NULL,'2026-06-19 20:09:12','2026-06-19 20:09:17'),(34,'App\\Models\\User',2,'api-token','6a047d31d7b7fa31d72212f635ccf3044ed29ed0a47ed240b66a11fd71c92ffe','[\"*\"]',NULL,NULL,'2026-06-19 20:09:33','2026-06-19 20:09:33'),(35,'App\\Models\\User',6,'api-token','d0f1cb12e1afceba0ecfded25f0a34e50aecce9256cd5e7bc29bd10d49618f48','[\"*\"]',NULL,NULL,'2026-06-19 20:10:32','2026-06-19 20:10:32'),(36,'App\\Models\\User',3,'api-token','8654b9d6fb2d763df5e0ed5de338316f0b01f17762c82369cacd7d9f62490e17','[\"*\"]','2026-06-19 20:10:39',NULL,'2026-06-19 20:10:33','2026-06-19 20:10:39'),(38,'App\\Models\\User',5,'api-token','7250710b5945a0eab4443d7b72102a324f79a6fa9a23fc3297cbd021657c1c85','[\"*\"]','2026-06-19 20:10:40',NULL,'2026-06-19 20:10:34','2026-06-19 20:10:40'),(39,'App\\Models\\User',1,'api-token','0cdc5970ad85ab8b5c98ae0c4bd17dd3934668cb351e4dd5e91b89bc96fc3474','[\"*\"]','2026-06-19 20:10:40',NULL,'2026-06-19 20:10:34','2026-06-19 20:10:40'),(40,'App\\Models\\User',2,'api-token','9837409ae527a859ea8463789655964bfcecaab790158c6ab12daeb4ca8a9fee','[\"*\"]','2026-06-19 20:10:40',NULL,'2026-06-19 20:10:35','2026-06-19 20:10:40'),(41,'App\\Models\\User',6,'api-token','3fc8784a6900d2941a47d806665fe46a6a868f1e6d30915c98af65a0c005b5bd','[\"*\"]',NULL,NULL,'2026-06-19 20:10:52','2026-06-19 20:10:52');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Registrar','registrar@university.edu','registrar','0999000001','oncampus',0,0,NULL,'2026-06-18 07:32:11','$2y$12$u3HQxtXfymBUdiKg8.sIPOWQgLOgUDj8NQ0q9YlHt2SU4UgaYAv1K','JWL6ZsXjwI','2026-06-18 07:32:12','2026-06-18 07:32:12'),(2,'Disciplinary Committee','disciplinary@university.edu','disciplinary_committee','0999000002','oncampus',0,0,NULL,'2026-06-18 07:32:12','$2y$12$3Bb789Cre22BKsNPbI1mXOl/GjJ.HayjgwAADXTlCFbn1ToZ4E6xq','FKKDPqykgd','2026-06-18 07:32:12','2026-06-18 07:32:12'),(3,'University Counselor','universitycounsellor@mzuni.ac.mw','counselor','0999000003','oncampus',0,0,NULL,'2026-06-18 07:32:12','$2y$12$OkcS5RuI/R7sugIHylVHhuqgc9L1VAuclM7PpRGxR1g4EHH3IpSNu','n2rGxAGPGi','2026-06-18 07:32:12','2026-06-18 07:32:12'),(4,'Dean of Students','deanofstudents@mzuni.ac.mw','dean','0999000004','oncampus',0,0,NULL,'2026-06-18 07:32:12','$2y$12$D8HKuOPRAnL7TRtC5B114.nyuYXMbsELNtmcv7OQAicskkvDV4t.G','pZCNROzwvn','2026-06-18 07:32:12','2026-06-18 07:32:12'),(5,'IIC Officer','iic@mzuni.ac.mw','iic','0999000005','oncampus',0,0,NULL,'2026-06-18 07:32:12','$2y$12$Vq2Ib9MoD1LxLMo4WKqkhOnofaDjCVIvS53D.vUr.pa0wVtZa4qJO','xo0YAgWNoc','2026-06-18 07:32:12','2026-06-18 07:32:12'),(6,'Student Example','student@mzuni.ac.mw','student','0999000006','oncampus',0,0,NULL,'2026-06-18 07:32:12','$2y$12$aRBslKo/QMY1Z1BCd/7lwu879ydEcG8K4LrytFIX6eGgUvNtqYFDC','lwLx9nj7GP','2026-06-18 07:32:13','2026-06-18 07:32:13'),(7,'Dr. Jane External','external@mzuni.ac.mw','external_counselor','0999000007','offcampus',0,1,NULL,'2026-06-18 07:32:13','$2y$12$zjPQXrU/SWEI.cHzchBg0e5Ph.wtQWS2UhBwbLDfpcy1L01oyb8h6','5DFi0HeAfP','2026-06-18 07:32:13','2026-06-18 07:32:13');
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

-- Dump completed on 2026-06-20  0:21:31
