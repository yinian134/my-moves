-- 家庭电影网站数据库初始化脚本
-- 这个文件包含一些示例数据，您可以根据需要修改

-- 注意：执行前请确保数据库和表已经创建

-- 1. 添加电影类型示例数据
INSERT INTO genre (name, description, created_at) VALUES
('动作', '动作片，包含大量打斗和特技场景', NOW()),
('喜剧', '喜剧片，轻松幽默的剧情', NOW()),
('爱情', '爱情片，以爱情故事为主线', NOW()),
('科幻', '科幻片，未来科技和想象场景', NOW()),
('恐怖', '恐怖片，惊悚悬疑的剧情', NOW()),
('剧情', '剧情片，以人物和情节为主', NOW()),
('动画', '动画片，适合全年龄段观看', NOW());

-- 2. 添加示例电影数据（可选）
-- 注意：poster和video_url字段需要真实的URL，这里使用占位符
INSERT INTO movie (title, director, actors, genre_id, region, year, duration, description, poster, video_url, status, rating, views, created_at, updated_at) VALUES
('示例电影1', '导演A', '演员1,演员2,演员3', 1, '中国', 2023, 120, '这是一部精彩的电影，讲述了...', 'https://via.placeholder.com/300x450', NULL, 'active', 0, 0, NOW(), NOW()),
('示例电影2', '导演B', '演员4,演员5', 2, '美国', 2022, 90, '这是一部有趣的喜剧电影...', 'https://via.placeholder.com/300x450', NULL, 'active', 0, 0, NOW(), NOW());

-- 3. 创建管理员账号（可选）
-- 注意：密码需要使用bcrypt加密，这里只是示例，实际应该通过注册功能创建
-- 默认密码: admin123（实际使用时请修改）
-- 密码hash: $2a$10$rOzJwX8KqP7qP7qP7qP7qu (这是示例，实际需要使用bcrypt生成)

-- 如果您想创建管理员账号，建议：
-- 1. 先通过网站注册一个普通账号
-- 2. 然后在数据库中执行以下SQL将其升级为管理员：
-- UPDATE user SET role = 'admin' WHERE username = '您的用户名';

-- 查看所有数据
-- SELECT * FROM genre;
-- SELECT * FROM movie;
-- SELECT * FROM user;

