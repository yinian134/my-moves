// routes/home.js
const express = require('express');
const router  = express.Router();

// 首页
router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// 文档页（之前缺失的 /api 路由）
router.get('/api', (req, res) => {
  res.json({
    message: 'Family Movie API 文档',
    endpoints: {
      'GET /movies': '获取电影列表（支持分页、筛选）',
      'GET /movies/:id': '获取电影详情',
      'GET /movies/genres/list': '获取类型列表',
      'GET /movies/hot/list': '热门电影'
    }
  });
});

module.exports = router;