-- MySQL dump 10.13  Distrib 5.5.47, for debian-linux-gnu (x86_64)
--
-- Host: 0.0.0.0    Database: reddit
-- ------------------------------------------------------
-- Server version	5.5.47-0ubuntu0.14.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` varchar(10000) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `userId` int(11) DEFAULT NULL,
  `postId` int(11) DEFAULT NULL,
  `parentId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `postId` (`postId`),
  KEY `parentId` (`parentId`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`postId`) REFERENCES `posts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parentId`) REFERENCES `comments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (2,'random comment','2016-04-29 18:43:08','2016-04-29 18:43:08',1,3,NULL),(3,'another random comment','2016-04-29 18:44:19','2016-04-29 18:44:19',2,3,2),(4,'this is the first comment on this post','2016-04-29 18:48:02','2016-04-29 18:48:02',2,2,NULL),(5,'not good comment','2016-04-29 19:12:49','2016-04-29 19:12:49',2,2,2),(7,'very good','2016-04-29 19:52:21','2016-04-29 19:52:21',2,3,5),(8,'horrible','2016-04-29 19:57:10','2016-04-29 19:57:10',2,2,4),(9,'horrible','2016-04-29 20:02:06','2016-04-29 20:02:06',1,1,NULL),(10,'horrible','2016-04-29 21:13:46','2016-04-29 21:13:46',1,3,2),(11,'another one','2016-04-29 23:34:43','2016-04-29 23:34:43',2,4,NULL),(12,'reply to another one','2016-04-29 23:35:29','2016-05-02 02:58:27',1,4,11),(13,'reply reply to another one','2016-04-29 23:36:16','2016-05-02 02:59:09',2,4,12),(14,'new one','2016-04-29 23:40:24','2016-04-29 23:40:24',2,2,NULL),(15,'new one','2016-04-29 23:46:29','2016-04-29 23:46:29',2,3,NULL),(16,'first comment','2016-04-29 23:59:46','2016-04-29 23:59:46',1,4,NULL),(17,'reply to first comment','2016-04-30 00:53:09','2016-05-02 03:00:14',2,4,16);
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(300) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subredditId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `subreddits_ibfk_1` (`subredditId`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `subreddits_ibfk_1` FOREIGN KEY (`subredditId`) REFERENCES `subreddits` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,'hi reddit!','https://www.reddit.com',1,'2016-04-28 20:03:38','2016-04-29 16:51:19',1),(2,'bye reddit!','https://www.reddit.com',2,'2016-04-28 20:04:55','2016-04-29 16:51:49',2),(3,'this is a post about something','www.google.com',2,'2016-04-29 16:08:58','2016-04-29 16:52:09',4),(4,'this is a post about something','www.google.com',2,'2016-04-29 16:12:25','2016-04-29 16:12:25',3),(5,'this is the title','www.url.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(6,'another title','www.google.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(7,'oh no','www.yahoo.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(8,'why are you posting this?','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(9,'crazypost 88','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(10,'why are you posting this?','www.doodle.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(11,'oh no','www.pimp.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(12,'unneccesary','www.poop.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(13,'insane post','www.anytime.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(14,'this is the end','www.twitter.com/image.jpg',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(15,'why again','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(16,'dont do it','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(17,'master post','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(18,'best in the world','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(19,'amazing stuff','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1),(20,'no reason','www.crazy.com',1,'2016-05-02 20:45:47','2016-05-02 20:45:47',1);
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subreddits`
--

DROP TABLE IF EXISTS `subreddits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subreddits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subreddits`
--

LOCK TABLES `subreddits` WRITE;
/*!40000 ALTER TABLE `subreddits` DISABLE KEYS */;
INSERT INTO `subreddits` VALUES (1,'funny','a bunch of funny stuff','0000-00-00 00:00:00','2016-04-29 00:43:03'),(2,'montreal','related to montreal events','0000-00-00 00:00:00','2016-04-29 00:43:03'),(3,'crazy','these make no sense','0000-00-00 00:00:00','2016-04-29 00:52:23'),(4,'cats','all about cats','2016-04-29 01:07:50','2016-04-29 01:07:50');
/*!40000 ALTER TABLE `subreddits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(60) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'John Smith','$2a$10$W.2RvctrkC5TU9rLUYKnreEEYztMan8054Smy8bYaEvkrnBnN/6Mq','2016-04-28 20:03:38','2016-05-02 20:37:05'),(2,'big boy','$2a$10$3ZASTvjTS/VDqH8zSL3u6uDq2cb.S6ui7HkKf23GIny.ieHg9bFQ.','2016-04-28 20:04:55','2016-04-28 20:04:55');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-05-02 20:48:16
