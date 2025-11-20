const { paginate } = require('../utils/paginate');
/**
 * 电影相关API路由
 * 处理所有电影相关的请求
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// 1. 获取电影列表（支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      genre, 
      region, 
      year, 
      sort = 'created_at', 
      order = 'DESC',
      keyword 
    } = req.query;

    const offset = (page - 1) * limit;
    let sql = 'SELECT m.*, g.name as genre_name FROM movie m LEFT JOIN genre g ON m.genre_id = g.id WHERE 1=1';
    const params = [];

    // 按类型筛选
    if (genre) {
      sql += ' AND m.genre_id = ?';
      params.push(genre);
    }

    // 按地区筛选
    if (region) {
      sql += ' AND m.region = ?';
      params.push(region);
    }

    // 按年份筛选
    if (year) {
      sql += ' AND m.year = ?';
      params.push(year);
    }

    // 关键词搜索（标题、导演、演员）
    if (keyword) {
      sql += ' AND (m.title LIKE ? OR director LIKE ? OR actors LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 排序
    const validSorts = ['created_at', 'year', 'rating', 'views', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY m.${sortField} ${sortOrder}`;

    // ===== 统一分页 =====
console.log('SQL :', sql);
console.log('Params before limit:', params, '| length:', params.length);

const { sql: finalSql, params: finalParams } = paginate(sql, params, page, limit);

console.log('最终SQL :', finalSql);
console.log('最终参数:', finalParams);

    console.log('Params after limit :', params, '| length:', params.length);

    const movies = await query(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM movie m WHERE 1=1';
    const countParams = [];
    if (genre) {
      countSql += ' AND m.genre_id = ?';
      countParams.push(genre);
    }
    if (region) {
      countSql += ' AND m.region = ?';
      countParams.push(region);
    }
    if (year) {
      countSql += ' AND m.year = ?';
      countParams.push(year);
    }
    if (keyword) {
      countSql += ' AND (m.title LIKE ? OR director LIKE ? OR actors LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern, keywordPattern);
    }

    const [countResult] = await query(countSql, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: {
        movies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取电影列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 2. 获取电影详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = 'SELECT m.*, g.name as genre_name FROM movie m LEFT JOIN genre g ON m.genre_id = g.id WHERE m.id = ?';
    const movies = await query(sql, [id]);

    if (movies.length === 0) {
      return res.status(404).json({ success: false, message: '电影不存在' });
    }

    const movie = movies[0];

    // 增加观看次数
    await query('UPDATE movie SET views = views + 1 WHERE id = ?', [id]);

    const ratingStats = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count FROM rate WHERE movie_id = ?',
      [id]
    );

    const comments = await query(
      `SELECT r.*, u.username, u.avatar 
       FROM rate r 
       LEFT JOIN user u ON r.user_id = u.id 
       WHERE r.movie_id = ? AND r.comment IS NOT NULL 
       ORDER BY r.created_at DESC 
       LIMIT 10`,
      [id]
    );

    const recommendations = await query(
      `SELECT m.* FROM movie m 
       WHERE (m.genre_id = ? OR director = ?) AND m.id != ? 
       ORDER BY m.rating DESC, m.views DESC 
       LIMIT 6`,
      [movie.genre_id, movie.director, id]
    );

    res.json({
      success: true,
      data: {
        ...movie,
        rating: ratingStats[0].avg_rating || 0,
        ratingCount: ratingStats[0].rating_count || 0,
        comments,
        recommendations
      }
    });
  } catch (error) {
    console.error('获取电影详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 3. 获取电影类型列表
router.get('/genres/list', async (req, res) => {
  try {
    const genres = await query('SELECT * FROM genre ORDER BY name');
    res.json({ success: true, data: genres });
  } catch (error) {
    console.error('获取类型列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 4. 获取热门电影
router.get('/hot/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const movies = await query(
      'SELECT m.*, g.name as genre_name FROM movie m LEFT JOIN genre g ON m.genre_id = g.id ORDER BY m.views DESC, m.rating DESC LIMIT ?',
      [limit]
    );
    res.json({ success: true, data: movies });
  } catch (error) {
    console.error('获取热门电影错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;