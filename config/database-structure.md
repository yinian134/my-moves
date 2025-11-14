# 数据库表结构说明

## 数据库：family_movie

### 1. user 表（用户表）
存储用户信息

**字段说明：**
- `id`: 用户ID（主键，自增）
- `username`: 用户名（唯一）
- `email`: 邮箱
- `phone`: 手机号
- `password`: 密码（加密存储）
- `role`: 用户角色（'user'普通用户, 'admin'管理员, 'editor'编辑）
- `avatar`: 头像URL
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. movie 表（电影表）
存储电影信息

**字段说明：**
- `id`: 电影ID（主键，自增）
- `title`: 电影标题
- `director`: 导演
- `actors`: 演员（JSON格式或逗号分隔）
- `genre_id`: 类型ID（外键关联genre表）
- `region`: 地区（如：中国、美国）
- `year`: 年份
- `duration`: 时长（分钟）
- `description`: 剧情简介
- `poster`: 海报URL
- `trailer`: 预告片URL
- `video_url`: 视频播放地址
- `rating`: 平均评分
- `views`: 观看次数
- `status`: 状态（'active'正常, 'vip'VIP专享, 'paid'付费）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 3. genre 表（类型表）
存储电影类型

**字段说明：**
- `id`: 类型ID（主键，自增）
- `name`: 类型名称（如：动作、喜剧、爱情）
- `description`: 类型描述
- `created_at`: 创建时间

### 4. rate 表（评分表）
存储用户对电影的评分和评论

**字段说明：**
- `id`: 评分ID（主键，自增）
- `user_id`: 用户ID（外键关联user表）
- `movie_id`: 电影ID（外键关联movie表）
- `rating`: 评分（1-5星）
- `comment`: 评论内容
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 5. wish 表（收藏/心愿单表）
存储用户收藏的电影

**字段说明：**
- `id`: 收藏ID（主键，自增）
- `user_id`: 用户ID（外键关联user表）
- `movie_id`: 电影ID（外键关联movie表）
- `status`: 状态（'want'想看, 'watched'已看, 'favorite'收藏）
- `created_at`: 创建时间

## 注意事项

1. 如果您的数据库表结构与上述不同，请告诉我，我会相应调整代码
2. 确保所有外键关系正确设置
3. 建议为常用查询字段（如movie.title, movie.year）创建索引以提高查询速度

