# 家庭电影网站 - 使用说明

## 📖 项目简介

这是一个基于Node.js和MySQL开发的家庭电影网站，功能包括：
- 电影展示和搜索
- 用户注册登录
- 电影评分和评论
- 收藏和心愿单
- 后台管理

## 🚀 快速开始

### 第一步：安装Node.js

如果您还没有安装Node.js，请先安装：
- 访问 https://nodejs.org/
- 下载并安装LTS版本（推荐18.x或更高版本）
- 安装完成后，打开命令行输入 `node -v` 检查是否安装成功

### 第二步：安装项目依赖

1. 打开命令行（Windows: 按Win+R，输入cmd；Mac/Linux: 打开终端）
2. 进入项目目录：
   ```bash
   cd /mnt/d/my-movie
   ```
   或者在Windows中：
   ```bash
   cd D:\my-movie
   ```

3. 安装依赖包：
   ```bash
   npm install
   ```

   这个命令会下载项目所需的所有依赖包（express、mysql2等），可能需要几分钟时间。

### 第三步：确认数据库配置

项目已经配置好了您的数据库连接信息：
- 主机：localhost
- 端口：3307
- 用户名：root
- 密码：abcd1234
- 数据库名：family_movie

**请确保：**
1. Docker容器中的MySQL数据库正在运行
2. 数据库 `family_movie` 已创建
3. 五张表已创建：`genre`、`movie`、`rate`、`user`、`wish`

### 第四步：启动服务器

在项目目录下运行：
```bash
node server.js
```

如果看到以下信息，说明启动成功：
```
✅ 数据库连接成功！
==================================================
✅ 服务器启动成功！
📡 服务器地址: http://localhost:3000
📚 API文档: http://localhost:3000/api
==================================================
```

### 第五步：访问网站

打开浏览器，访问：http://localhost:3000

## 📁 项目结构说明

```
my-movie/
├── config/              # 配置文件
│   └── database.js      # 数据库连接配置
├── middleware/          # 中间件
│   └── auth.js          # 用户认证中间件
├── routes/              # API路由
│   ├── movies.js        # 电影相关接口
│   ├── users.js         # 用户相关接口
│   ├── rates.js         # 评分评论接口
│   ├── wishlist.js      # 收藏接口
│   └── admin.js         # 管理后台接口
├── public/              # 前端文件
│   ├── css/             # 样式文件
│   │   └── style.css
│   ├── js/              # JavaScript文件
│   │   ├── api.js       # API调用封装
│   │   ├── auth.js      # 认证相关
│   │   ├── index.js     # 首页逻辑
│   │   ├── movies.js    # 电影列表页
│   │   ├── movie-detail.js  # 电影详情页
│   │   ├── login.js     # 登录注册
│   │   ├── user.js      # 用户中心
│   │   └── admin.js     # 管理后台
│   └── *.html           # HTML页面
├── server.js            # 服务器主文件
├── package.json         # 项目配置文件
└── README.md            # 使用说明
```

## 🎯 功能说明

### 前台功能

1. **电影展示**
   - 浏览所有电影
   - 按类型、地区、年份筛选
   - 搜索电影（支持标题、导演、演员搜索）
   - 查看电影详情

2. **用户功能**
   - 注册/登录（支持用户名、邮箱、手机号登录）
   - 个人中心（修改资料、查看收藏）
   - 收藏电影
   - 评分和评论

3. **电影详情**
   - 查看电影详细信息
   - 观看电影（如果提供了视频URL）
   - 查看评论
   - 发表评论和评分

### 后台功能（需要管理员权限）

1. **数据统计**
   - 查看电影总数、用户总数等统计数据
   - 查看热门电影

2. **电影管理**
   - 添加新电影
   - 查看电影列表
   - 删除电影

3. **类型管理**
   - 添加电影类型
   - 查看类型列表

4. **用户管理**
   - 查看用户列表
   - 查看用户信息

## 👤 创建管理员账号

默认情况下，新注册的用户都是普通用户。要创建管理员账号，您需要：

1. 在数据库中直接修改用户角色：
   ```sql
   UPDATE user SET role = 'admin' WHERE username = '您的用户名';
   ```

2. 或者使用MySQL客户端（如Navicat、DBeaver）连接到数据库，找到user表，将某个用户的role字段改为'admin'

## 📝 数据库表结构

### user表（用户表）
- id: 用户ID
- username: 用户名
- email: 邮箱
- phone: 手机号
- password: 密码（加密存储）
- role: 角色（'user'普通用户, 'admin'管理员）
- avatar: 头像URL
- created_at: 创建时间
- updated_at: 更新时间

### movie表（电影表）
- id: 电影ID
- title: 电影标题
- director: 导演
- actors: 演员
- genre_id: 类型ID
- region: 地区
- year: 年份
- duration: 时长（分钟）
- description: 剧情简介
- poster: 海报URL
- trailer: 预告片URL
- video_url: 视频播放地址
- rating: 平均评分
- views: 观看次数
- status: 状态
- created_at: 创建时间
- updated_at: 更新时间

### genre表（类型表）
- id: 类型ID
- name: 类型名称
- description: 类型描述
- created_at: 创建时间

### rate表（评分表）
- id: 评分ID
- user_id: 用户ID
- movie_id: 电影ID
- rating: 评分（1-5）
- comment: 评论内容
- created_at: 创建时间
- updated_at: 更新时间

### wish表（收藏表）
- id: 收藏ID
- user_id: 用户ID
- movie_id: 电影ID
- status: 状态（'want'想看, 'watched'已看, 'favorite'收藏）
- created_at: 创建时间

## 🔧 常见问题

### 1. 无法连接数据库

**错误信息：** `数据库连接失败`

**解决方法：**
- 检查Docker容器是否运行：`docker ps`
- 检查数据库配置是否正确（host、port、user、password）
- 确认数据库`family_movie`已创建
- 确认表已创建

### 2. 端口被占用

**错误信息：** `Port 3000 is already in use`

**解决方法：**
- 关闭占用3000端口的程序
- 或者修改`server.js`中的端口号（如改为3001）

### 3. 依赖安装失败

**解决方法：**
- 检查网络连接
- 尝试使用淘宝镜像：`npm install --registry=https://registry.npmmirror.com`
- 删除`node_modules`文件夹后重新安装

### 4. 页面显示404

**解决方法：**
- 确认服务器已启动
- 检查访问的URL是否正确
- 查看浏览器控制台错误信息

## 📚 API接口说明

### 电影相关
- `GET /api/movies` - 获取电影列表
- `GET /api/movies/:id` - 获取电影详情
- `GET /api/movies/genres/list` - 获取类型列表
- `GET /api/movies/hot/list` - 获取热门电影

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息（需登录）
- `PUT /api/users/me` - 更新用户信息（需登录）
- `GET /api/users/wishlist` - 获取收藏列表（需登录）

### 评分相关
- `POST /api/rates` - 添加评分和评论（需登录）
- `GET /api/rates/movie/:movieId` - 获取电影评论列表
- `DELETE /api/rates/:id` - 删除评论（需登录）

### 收藏相关
- `POST /api/wishlist` - 添加收藏（需登录）
- `DELETE /api/wishlist/:movieId` - 删除收藏（需登录）
- `GET /api/wishlist/check/:movieId` - 检查是否已收藏（需登录）

### 管理后台（需管理员权限）
- `POST /api/admin/movies` - 添加电影
- `PUT /api/admin/movies/:id` - 更新电影
- `DELETE /api/admin/movies/:id` - 删除电影
- `POST /api/admin/genres` - 添加类型
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/stats` - 获取统计数据

## 🎨 自定义配置

### 修改端口号

编辑`server.js`文件，修改：
```javascript
const PORT = 3000; // 改为您想要的端口号
```

### 修改数据库配置

编辑`config/database.js`文件，修改连接信息。

## 📝 开发建议

1. **添加测试数据**
   - 在数据库中手动添加一些电影数据，方便测试
   - 添加电影类型数据

2. **上传图片**
   - 海报和头像可以使用网络URL
   - 或者搭建文件上传功能（需要额外的配置）

3. **视频播放**
   - 目前视频播放直接跳转到外部链接
   - 如需内嵌播放器，可以使用video.js等库

## 🆘 需要帮助？

如果遇到问题，请检查：
1. 数据库是否正常运行
2. 所有依赖是否已安装
3. 端口是否被占用
4. 浏览器控制台是否有错误信息

## 📄 许可证

本项目仅供学习和个人使用。

---

祝您使用愉快！🎬

