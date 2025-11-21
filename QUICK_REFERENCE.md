# 快速参考指南

本文档提供项目的快速参考信息，包括常用命令、API端点、配置说明等。

---

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env` 文件：
```env
# 数据库
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=family_movie

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d

# 存储
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./public/videos

# 日志
LOG_LEVEL=info
NODE_ENV=development
```

### 3. 初始化数据库
```bash
# 执行迁移脚本
mysql -u root -p family_movie < database/migrations/001_initial_schema.sql
mysql -u root -p family_movie < database/migrations/002_migrate_existing_data.sql
```

### 4. 启动服务器
```bash
npm start
# 或开发模式
npm run dev
```

---

## 📡 API端点

### 电影相关
- `GET /api/movies` - 获取电影列表
  - 参数: `page`, `limit`, `genre`, `region`, `year`, `keyword`, `sort`, `order`
- `GET /api/movies/:id` - 获取电影详情
- `GET /api/movies/genres/list` - 获取类型列表
- `GET /api/movies/hot/list` - 获取热门电影

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息（需登录）
- `PUT /api/users/me` - 更新用户信息（需登录）
- `GET /api/users/wishlist` - 获取收藏列表（需登录）

### 评分评论
- `POST /api/rates` - 添加评分和评论（需登录）
- `GET /api/rates/movie/:movieId` - 获取电影评论列表
- `DELETE /api/rates/:id` - 删除评论（需登录）

### 收藏管理
- `POST /api/wishlist` - 添加收藏（需登录）
- `DELETE /api/wishlist/:movieId` - 删除收藏（需登录）
- `GET /api/wishlist/check/:movieId` - 检查是否已收藏（需登录）

### 管理员功能（需管理员权限）
- `POST /api/admin/movies` - 添加电影
- `PUT /api/admin/movies/:id` - 更新电影
- `DELETE /api/admin/movies/:id` - 删除电影
- `POST /api/admin/genres` - 添加类型
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/stats` - 获取统计数据

---

## 🔐 认证

### JWT Token
- **获取**: 登录成功后返回
- **使用**: 在请求头中添加 `Authorization: Bearer <token>`
- **有效期**: 7天（可配置）

### 创建管理员
```sql
UPDATE user SET role = 'admin' WHERE username = 'your_username';
```

---

## 📊 数据库表结构

### user表
- `id`: 用户ID
- `username`: 用户名（唯一）
- `email`: 邮箱
- `phone`: 手机号
- `password`: 密码（bcrypt加密）
- `role`: 角色（user/admin）
- `avatar`: 头像URL
- `login_attempts`: 登录失败次数
- `locked_until`: 账户锁定到期时间
- `last_login`: 最后登录时间

### movie表
- `id`: 电影ID
- `title`: 电影标题
- `director`: 导演
- `actors`: 演员
- `genre_id`: 类型ID
- `region`: 地区
- `year`: 年份
- `duration`: 时长（分钟）
- `description`: 剧情简介
- `poster`: 海报URL
- `trailer`: 预告片URL（YouTube等）
- `video_url`: 正片视频URL
- `video_type`: 视频类型（local/oss/external/hls）
- `file_path`: 本地文件路径
- `file_size`: 文件大小
- `rating`: 平均评分
- `views`: 观看次数

### rate表
- `id`: 评分ID
- `userId`: 用户ID
- `movieId`: 电影ID
- `score`: 评分（1-5）
- `shortComment`: 短评
- `created_at`: 创建时间
- `updated_at`: 更新时间

### wish表
- `id`: 收藏ID
- `userId`: 用户ID
- `movieId`: 电影ID
- `status`: 状态（want/watched/favorite）
- `created_at`: 创建时间

---

## 🎬 视频存储

### 存储方式
- **本地存储**: `public/videos/` 目录
- **OSS存储**: 阿里云OSS（需配置）
- **外部链接**: YouTube等（仅用于预告片）

### 视频类型
- `local`: 本地文件（MP4等）
- `oss`: 对象存储服务
- `external`: 外部链接（YouTube）
- `hls`: HLS流媒体（.m3u8）

### 上传视频
1. 管理员登录后台
2. 选择电影，上传视频文件
3. 系统自动识别视频类型
4. 保存文件路径到数据库

---

## 🐛 错误码

### 通用错误 (1000-1999)
- `1000`: 未知错误
- `1001`: 参数验证失败
- `1002`: 数据库操作失败

### 认证错误 (2000-2999)
- `2000`: 未登录
- `2001`: 登录已过期
- `2002`: 无效的登录凭证
- `2003`: 用户名或密码错误
- `2004`: 账户已被锁定
- `2005`: 密码强度不足

### 权限错误 (3000-3999)
- `3000`: 权限不足
- `3001`: 需要管理员权限

### 资源错误 (4000-4999)
- `4000`: 资源不存在
- `4001`: 电影不存在
- `4002`: 用户不存在
- `4003`: 文件不存在
- `4004`: 资源已存在

### 业务错误 (5000-5999)
- `5000`: 请求过于频繁
- `5001`: 无效的操作
- `5002`: 文件过大
- `5003`: 不支持的文件类型

---

## 📝 日志

### 日志文件
- `logs/error.log`: 错误日志
- `logs/combined.log`: 所有日志

### 日志级别
- `error`: 错误日志
- `warn`: 警告日志
- `info`: 信息日志
- `debug`: 调试日志

### 查看日志
```bash
# 查看错误日志
tail -f logs/error.log

# 查看所有日志
tail -f logs/combined.log
```

---

## 🔧 常用命令

### 数据库操作
```bash
# 备份数据库
mysqldump -u root -p family_movie > backup.sql

# 恢复数据库
mysql -u root -p family_movie < backup.sql

# 执行迁移脚本
mysql -u root -p family_movie < database/migrations/001_initial_schema.sql
```

### 爬虫任务
```bash
# 手动执行爬虫
node crawler/tmdbDaily.js

# 配置定时任务（cron）
# 编辑 crontab: crontab -e
# 添加: 0 2 * * * cd /path/to/my-movie && node crawler/tmdbDaily.js
```

### 服务器管理
```bash
# 启动服务器
npm start

# 开发模式（自动重启）
npm run dev

# 查看运行中的进程
lsof -i :3000

# 停止服务器
kill <PID>
```

---

## 🛠️ 开发工具

### 代码结构
- **路由层**: `/routes` - 处理HTTP请求
- **服务层**: `/services` - 业务逻辑
- **工具层**: `/utils` - 通用工具
- **中间件**: `/middleware` - Express中间件
- **配置**: `/config` - 配置文件

### 添加新功能
1. 在`services/`中创建服务类
2. 在`routes/`中创建路由
3. 在`middleware/`中添加必要的中间件
4. 在`server.js`中注册路由

---

## 📚 相关文档

- `README.md`: 项目说明
- `ARCHITECTURE.md`: 架构设计文档
- `PROJECT_STRUCTURE.md`: 项目结构详细说明

---

**最后更新**: 2024-11-20

