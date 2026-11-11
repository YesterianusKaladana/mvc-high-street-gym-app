CREATE DATABASE  IF NOT EXISTS `gym_database` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `gym_database`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: gym_database
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` text NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
INSERT INTO `activity` VALUES (14,'Yoga','Training for body and mental wellness',0),(15,'Boxing','To improve agility, strength, and stamina',0),(16,'HIIT ','Training for fat burning and endurance improvement',0),(17,'Pilates           ','Improves posture, flexibility, and control',0),(18,'Indoor cycling ','To improve leg strength, and heart health fitness',0),(19,'Abs               ','Core stability, and overall body control',0),(20,'Zumba','Training for full-body movement',0);
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `created` datetime NOT NULL,
  `user_id` int NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_user_booking_idx` (`user_id`),
  KEY `fk_session_booking_idx` (`session_id`),
  CONSTRAINT `fk_session_booking` FOREIGN KEY (`session_id`) REFERENCES `session` (`id`),
  CONSTRAINT `fk_user_booking` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking`
--

LOCK TABLES `booking` WRITE;
/*!40000 ALTER TABLE `booking` DISABLE KEYS */;
INSERT INTO `booking` VALUES (42,54,'2026-06-17 05:31:43',10,1),(43,56,'2026-06-19 04:26:55',5,1),(44,57,'2026-06-23 22:41:05',5,1),(46,61,'2026-08-17 12:21:54',5,1),(47,61,'2026-08-17 12:22:15',5,1),(48,61,'2026-08-17 12:26:06',5,1),(49,62,'2026-08-17 12:28:03',5,1),(50,61,'2026-08-17 12:32:06',5,1),(51,61,'2026-08-17 12:34:28',5,1),(52,63,'2026-08-18 12:43:54',5,1),(53,63,'2026-08-19 12:03:17',5,1),(54,63,'2026-08-19 12:08:47',5,1),(55,63,'2026-08-19 12:18:30',5,1),(56,63,'2026-08-19 12:22:48',5,1),(57,63,'2026-08-19 12:23:28',5,1),(58,63,'2026-08-19 12:25:18',5,1),(59,63,'2026-08-20 02:47:42',5,1),(60,63,'2026-08-20 02:48:52',5,1),(61,63,'2026-08-20 02:53:02',5,1),(62,63,'2026-08-20 03:11:52',5,1),(63,63,'2026-08-20 03:25:26',5,1),(64,63,'2026-08-20 03:30:07',5,1),(65,63,'2026-08-20 03:43:11',5,1),(66,63,'2026-08-20 03:43:48',5,1),(67,63,'2026-08-20 03:44:24',5,1),(68,63,'2026-08-20 03:44:47',5,1),(69,63,'2026-08-20 03:45:22',5,1),(70,63,'2026-08-20 03:46:11',5,1),(71,63,'2026-08-21 09:06:57',5,1),(72,63,'2026-08-23 11:34:56',5,1),(73,63,'2026-08-23 11:42:37',5,1),(74,63,'2026-08-23 11:47:50',5,1),(75,63,'2026-08-23 11:53:10',5,1),(76,63,'2026-09-14 02:30:28',14,1),(77,63,'2026-10-08 04:01:43',5,1),(78,63,'2026-10-08 04:12:54',5,1),(79,63,'2026-10-08 04:16:06',5,1),(80,64,'2026-10-15 08:16:03',5,0),(83,66,'2026-11-03 14:55:08',5,0),(84,69,'2026-11-04 00:59:21',5,1),(85,67,'2026-11-04 01:23:34',5,1);
/*!40000 ALTER TABLE `booking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` text NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location`
--

LOCK TABLES `location` WRITE;
/*!40000 ALTER TABLE `location` DISABLE KEYS */;
INSERT INTO `location` VALUES (10,'Brisbane city','Level A Fitness centre',0),(11,'Westlake','Riverside Training Hub',0),(12,'Chermside','Northside Active Zone',0),(13,'Ashgrove','Wellness Centre',0),(14,'Graceville','Urban Strength Studio',0);
/*!40000 ALTER TABLE `location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post`
--

DROP TABLE IF EXISTS `post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `title` varchar(60) NOT NULL,
  `content` varchar(255) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_user_post_idx` (`user_id`),
  CONSTRAINT `fk_user_post` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post`
--

LOCK TABLES `post` WRITE;
/*!40000 ALTER TABLE `post` DISABLE KEYS */;
INSERT INTO `post` VALUES (38,5,'2026-08-21 20:11:04','Frontend Test','This is member test from client side.',0),(40,16,'2026-11-04 09:44:51','Admin Post','This is an admin post from backend',0),(41,15,'2026-11-04 09:46:15','Second Doe\'s Post','This is a post from frontend.',0),(42,5,'2026-11-04 10:56:15','Observation','This is my first obvervation.',0),(46,15,'2026-11-11 00:27:08','Test','This is a test validation',0),(47,5,'2026-11-11 13:36:37','Cors','Test post Cors',0);
/*!40000 ALTER TABLE `post` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `location_id` int NOT NULL,
  `activity_id` int NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `capacity` int NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_session_user_idx` (`user_id`),
  KEY `fk_session_location_idx` (`location_id`),
  KEY `fk_session_activity_idx` (`activity_id`),
  CONSTRAINT `fk_session_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`),
  CONSTRAINT `fk_session_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` VALUES (50,7,12,18,'2026-06-18','09:58:00','11:58:00',2,1),(51,9,10,17,'2026-06-19','10:15:00','11:15:00',4,1),(53,9,11,16,'2026-06-19','16:00:00','18:00:00',2,1),(54,9,11,17,'2026-06-19','15:31:00','18:31:00',2,1),(55,7,12,15,'2026-06-19','17:02:00','18:02:00',3,1),(56,7,10,14,'2026-06-20','16:05:00','18:05:00',4,1),(57,7,13,17,'2026-06-29','11:42:00','13:42:00',3,1),(61,7,12,15,'2026-07-31','13:48:00','15:48:00',3,1),(62,9,10,20,'2026-08-01','15:49:00','17:49:00',2,1),(63,7,13,15,'2026-08-24','10:45:00','13:45:00',4,1),(64,9,10,17,'2026-10-18','10:55:00','13:55:00',4,0),(65,7,12,18,'2026-10-22','10:48:00','11:48:00',2,1),(66,7,13,18,'2026-11-04','10:07:00','12:07:00',5,0),(67,7,14,20,'2026-11-04','10:18:00','13:18:00',3,0),(68,15,12,19,'2026-11-08','18:53:00','20:53:00',3,1),(69,15,10,14,'2026-11-11','09:00:00','10:00:00',5,1),(70,15,14,14,'2026-11-12','15:56:00','17:55:00',3,0),(71,15,11,17,'2026-11-13','12:56:00','13:56:00',4,0);
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(45) NOT NULL,
  `last_name` varchar(45) NOT NULL,
  `role` enum('admin','member','trainer') NOT NULL,
  `email` varchar(70) NOT NULL,
  `password` varchar(70) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `authentication_key` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `username_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (5,'Jhon','wick','member','wick@gmail.com','$2b$10$rOeRxcgCheDYqxc/GKYfzO/yaaMHAJBYIq2qtgVp7aI8lZU4wOTPy',0,NULL),(7,'Sam','Smith','trainer','smith@gmail.com.au','$2b$10$rCOkppQs3Uh0JInj5Ks5D.tYhOiSPR2zZ9UtSu8gDEorMxcYJKTYO',0,NULL),(9,'Jhon','Rambo','trainer','rambo@hsg.com.au','$2b$10$NbqF73N6APxrFGA9fNvVUuez8xl51YZiscpRr/HNDvBs7v2.IUYb6',0,NULL),(10,'Dessy','Dessy','member','dessy@gmail.com','$2b$10$E/5PqQvHHu61GJeslv4i0OPHQGYB7rELuSsaKOvVNPlMpedm68.Kq',0,NULL),(12,'Tafe','Queensland','member','qld@gmail.com.au','$2b$10$.9ON3vY8OcwhYyYHFA4cguZTsGxZ143HY1vot9CFUub9UWGwAkgvi',0,NULL),(13,'Yesyes','Kalkal','member','kalkal@gmail.com','$2b$10$oalJAtWrfTj1IUc7xTR1Fei50PdmdSVTbGYjeN6B9nO8TniY7U9ZC',0,NULL),(14,'Sepo','Sepokal','admin','sepokal@gmail.com','$2b$10$VI69Zdknb6xvfEI1..98xePviUAXA8W692ARRHvTltMNTTrBbelQG',0,NULL),(15,'Jhon','Doe','trainer','doe@gmail.com','$2b$10$a4WenTGtA.PUpqcO2lpiOurHoa.bja/IId9RUaPGKh6XFEnVN5etm',0,NULL),(16,'Yesterianus','Kaladana','admin','kyesterianus@gmail.com','$2b$10$dMVAoEQHE2iUzd3PuK6fWu4q8mBIk.PcmW6JK/VtG5c6e8NznD/4C',0,'fd7c7ab8-75d6-4391-af8c-195d87fd29b3'),(17,'Observation','Obs','member','obs@gmail.com','$2b$10$oeC1MAPT/iy58T0ghQ3BY.FS95dOqm.01BaQuRw4.GgcfS8ZAepRm',0,NULL),(18,'Website','Website','member','website@gmail.com.au','$2b$10$Kqo9Rh/HisXiZ1vOSQI/FO/Re42mSPKjgcU8e6Xwx1kMdMRdnR6My',0,NULL),(19,'Webtwo','Webtwo','member','web2@gmail.com.au','$2b$10$sGHEXKrk6HE9bsVCjR/VLeRj/ZfeqKR9Tf3UVRCR2MBx60YmgHMs6',0,NULL),(27,'Second','Second','member','second@gmail.com','$2b$10$ua8fDP6TB9nFEcZB27mE7eDhe1reWSUtTPNlyphmQa7/IBhky8w3S',0,NULL),(28,'Cors','Test Cors','member','cors@gmail.com','$2b$10$vme1gm.7mycAZ4eY6cbLoOcUw5y8wjyFf8585bbs.xvoYNi/1WdWu',0,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'gym_database'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-11 22:19:05
