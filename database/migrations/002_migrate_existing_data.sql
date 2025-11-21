-- ============================================
-- 数据迁移脚本 - 迁移现有数据
-- 版本: 1.0.1
-- 描述: 将现有表结构迁移到新schema
-- ============================================

-- 注意：执行前请备份数据库！

-- 1. 为user表添加缺失字段（如果不存在）
ALTER TABLE `user` 
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱' AFTER `username`,
  ADD COLUMN IF NOT EXISTS `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号' AFTER `email`,
  ADD COLUMN IF NOT EXISTS `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL' AFTER `role`,
  ADD COLUMN IF NOT EXISTS `login_attempts` INT DEFAULT 0 COMMENT '登录失败次数' AFTER `avatar`,
  ADD COLUMN IF NOT EXISTS `locked_until` DATETIME DEFAULT NULL COMMENT '账户锁定到期时间' AFTER `login_attempts`,
  ADD COLUMN IF NOT EXISTS `last_login` DATETIME DEFAULT NULL COMMENT '最后登录时间' AFTER `locked_until`;

-- 2. 为movie表添加缺失字段
ALTER TABLE `movie`
  ADD COLUMN IF NOT EXISTS `video_type` ENUM('local', 'oss', 'external', 'hls') DEFAULT 'local' COMMENT '视频类型' AFTER `video_url`,
  ADD COLUMN IF NOT EXISTS `file_size` BIGINT DEFAULT NULL COMMENT '文件大小（字节）' AFTER `video_type`,
  ADD COLUMN IF NOT EXISTS `file_path` VARCHAR(500) DEFAULT NULL COMMENT '本地文件路径' AFTER `file_size`;

-- 3. 为rate表添加created_at和updated_at（如果不存在）
ALTER TABLE `rate`
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间' AFTER `shortComment`,
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- 4. 更新movie表的video_type字段
-- 将YouTube链接标记为external
UPDATE `movie` 
SET `video_type` = 'external' 
WHERE `video_url` LIKE '%youtube.com%' OR `video_url` LIKE '%youtu.be%';

-- 将HLS链接标记为hls
UPDATE `movie` 
SET `video_type` = 'hls' 
WHERE `video_url` LIKE '%.m3u8%';

-- 5. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS `idx_username` ON `user`(`username`);
CREATE INDEX IF NOT EXISTS `idx_email` ON `user`(`email`);
CREATE INDEX IF NOT EXISTS `idx_role` ON `user`(`role`);
CREATE INDEX IF NOT EXISTS `idx_genre` ON `movie`(`genre_id`);
CREATE INDEX IF NOT EXISTS `idx_year` ON `movie`(`year`);
CREATE INDEX IF NOT EXISTS `idx_rating` ON `movie`(`rating`);
CREATE INDEX IF NOT EXISTS `idx_views` ON `movie`(`views`);

