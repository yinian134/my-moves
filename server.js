/**
 * 服务器主文件
 * 这是应用的入口文件，启动服务器并配置所有路由
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
// require('dotenv').config(); // 如果.env文件不存在，可以注释掉这行

// 导入数据库配置
const { testConnection } = require('./config/database');

// 导入路由
const moviesRouter = require('./routes/movies');
const usersRouter = require('./routes/users');
const ratesRouter = require('./routes/rates');
const wishlistRouter = require('./routes/wishlist');
const adminRouter = require('./routes/admin');

// 创建Express应用
const app = express();
const PORT = 3000; // 服务器端口号

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 静态文件服务（前端页面）
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api/movies', moviesRouter);
app.use('/api/users', usersRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/admin', adminRouter);

// 根路径
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 启动服务器
async function startServer() {
  // 测试数据库连接
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ 无法连接数据库，请检查配置');
    console.log('请确认：');
    console.log('1. MySQL数据库已启动');
    console.log('2. 数据库配置正确（host, port, user, password, database）');
    console.log('3. 数据库和表已创建');
    process.exit(1);
  }

  // 启动HTTP服务器
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('✅ 服务器启动成功！');
    console.log(`📡 服务器地址: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api`);
    console.log('='.repeat(50));
  });
}

// 启动应用
startServer();
