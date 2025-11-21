-- ============================================
-- 数据库迁移脚本 - 初始Schema
-- 版本: 1.0.0
-- 描述: 统一数据库表结构，补足缺失字段
-- ============================================

-- 1. 用户表 (user)
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `role` ENUM('user', 'admin') DEFAULT 'user' COMMENT '角色',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `login_attempts` INT DEFAULT 0 COMMENT '登录失败次数',
  `locked_until` DATETIME DEFAULT NULL COMMENT '账户锁定到期时间',
  `last_login` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 电影类型表 (genre)
CREATE TABLE IF NOT EXISTS `genre` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '类型名称',
  `description` TEXT DEFAULT NULL COMMENT '类型描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电影类型表';

-- 3. 电影表 (movie)
CREATE TABLE IF NOT EXISTS `movie` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL COMMENT '电影标题',
  `director` VARCHAR(255) DEFAULT NULL COMMENT '导演',
  `actors` VARCHAR(500) DEFAULT NULL COMMENT '演员（逗号分隔）',
  `genre_id` INT DEFAULT NULL COMMENT '类型ID',
  `region` VARCHAR(100) DEFAULT NULL COMMENT '地区',
  `year` INT DEFAULT NULL COMMENT '年份',
  `duration` INT DEFAULT NULL COMMENT '时长（分钟）',
  `description` TEXT DEFAULT NULL COMMENT '剧情简介',
  `poster` VARCHAR(255) DEFAULT NULL COMMENT '海报URL',
  `trailer` VARCHAR(255) DEFAULT NULL COMMENT '预告片URL（YouTube等）',
  `video_url` VARCHAR(255) DEFAULT NULL COMMENT '正片视频URL（本地或OSS）',
  `video_type` ENUM('local', 'oss', 'external', 'hls') DEFAULT 'local' COMMENT '视频类型',
  `file_size` BIGINT DEFAULT NULL COMMENT '文件大小（字节）',
  `file_path` VARCHAR(500) DEFAULT NULL COMMENT '本地文件路径',
  `rating` DECIMAL(3,1) DEFAULT 0 COMMENT '平均评分',
  `views` INT DEFAULT 0 COMMENT '观看次数',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态（active/inactive）',
  `imdb_id` VARCHAR(20) DEFAULT NULL COMMENT 'IMDB ID',
  `douban_rating` DECIMAL(3,1) DEFAULT NULL COMMENT '豆瓣评分',
  `imdb_rating` DECIMAL(3,1) DEFAULT NULL COMMENT 'IMDB评分',
  `plot` TEXT DEFAULT NULL COMMENT '剧情',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_imdb_id` (`imdb_id`),
  INDEX `idx_genre` (`genre_id`),
  INDEX `idx_year` (`year`),
  INDEX `idx_rating` (`rating`),
  INDEX `idx_views` (`views`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`genre_id`) REFERENCES `genre`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电影表';

-- 4. 评分评论表 (rate)
CREATE TABLE IF NOT EXISTS `rate` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL COMMENT '用户ID',
  `movieId` INT NOT NULL COMMENT '电影ID',
  `score` TINYINT NOT NULL CHECK (`score` BETWEEN 1 AND 5) COMMENT '评分（1-5）',
  `shortComment` VARCHAR(200) DEFAULT NULL COMMENT '短评',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_movie` (`userId`, `movieId`),
  INDEX `idx_movie` (`movieId`),
  INDEX `idx_user` (`userId`),
  INDEX `idx_score` (`score`),
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`movieId`) REFERENCES `movie`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评分评论表';

-- 5. 收藏表 (wish)
CREATE TABLE IF NOT EXISTS `wish` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL COMMENT '用户ID',
  `movieId` INT NOT NULL COMMENT '电影ID',
  `status` ENUM('want', 'watched', 'favorite') DEFAULT 'want' COMMENT '状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_movie` (`userId`, `movieId`),
  INDEX `idx_user` (`userId`),
  INDEX `idx_movie` (`movieId`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`movieId`) REFERENCES `movie`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- 6. 操作日志表 (operation_log)
CREATE TABLE IF NOT EXISTS `operation_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL COMMENT '用户ID',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `resource` VARCHAR(100) DEFAULT NULL COMMENT '资源类型',
  `resource_id` INT DEFAULT NULL COMMENT '资源ID',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  `details` JSON DEFAULT NULL COMMENT '详细信息',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_resource` (`resource`),
  INDEX `idx_created` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

