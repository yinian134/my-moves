require('dotenv').config();   // 如果以后用 .env 就留着
const express = require('express');
const { testConnection } = require('./config/database');

const app = express();
const PORT = 3000;

/* ------------ 通用中间件 ------------ */
require('./middleware/common')(app);

/* ------------ 业务路由 ------------ */
app.use('/api/movies',  require('./routes/movies'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/rates',   require('./routes/rates'));
app.use('/api/wishlist',require('./routes/wishlist'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/',            require('./routes/home'));   // 首页 + /api 文档

/* ------------ 错误处理 ------------ */
require('./middleware/error')(app);

/* ------------ 启动 ------------ */
(async () => {
  if (!(await testConnection())) {
    console.error('❌ 数据库连接失败');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('✅ 服务器启动成功！');
    console.log(`📡 地址: http://localhost:${PORT}`);
    console.log(`📚 文档: http://localhost:${PORT}/api`);
    console.log('='.repeat(50));
  });
})();