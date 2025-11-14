/**
 * 后台管理API路由
 * 需要管理员权限才能访问
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 所有路由都需要管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 1. 添加电影
router.post('/movies', async (req, res) => {
  try {
    const {
      title,
      director,
      actors,
      genreId,
      region,
      year,
      duration,
      description,
      poster,
      trailer,
      videoUrl,
      status = 'active'
    } = req.body;

    if (!title || !director) {
      return res.status(400).json({ 
        success: false, 
        message: '标题和导演不能为空' 
      });
    }

    const result = await query(
      `INSERT INTO movie (
        title, director, actors, genre_id, region, year, duration, 
        description, poster, trailer, video_url, status, 
        rating, views, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
      [title, director, actors || null, genreId || null, region || null, year || null, 
       duration || null, description || null, poster || null, trailer || null, 
       videoUrl || null, status]
    );

    res.json({
      success: true,
      message: '添加电影成功',
      data: { movieId: result.insertId }
    });
  } catch (error) {
    console.error('添加电影错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 2. 更新电影
router.put('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = [];
    const params = [];

    const allowedFields = ['title', 'director', 'actors', 'genre_id', 'region', 
                          'year', 'duration', 'description', 'poster', 'trailer', 
                          'video_url', 'status'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE movie SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: '更新电影成功'
    });
  } catch (error) {
    console.error('更新电影错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 3. 删除电影
router.delete('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM movie WHERE id = ?', [id]);
    res.json({ success: true, message: '删除电影成功' });
  } catch (error) {
    console.error('删除电影错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 4. 添加电影类型
router.post('/genres', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: '类型名称不能为空' });
    }

    const result = await query(
      'INSERT INTO genre (name, description, created_at) VALUES (?, ?, NOW())',
      [name, description || null]
    );

    res.json({
      success: true,
      message: '添加类型成功',
      data: { genreId: result.insertId }
    });
  } catch (error) {
    console.error('添加类型错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 5. 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, username, email, phone, role, created_at FROM user WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await query(sql, params);

    const [countResult] = await query('SELECT COUNT(*) as total FROM user');
    const total = countResult.total;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 6. 统计数据
router.get('/stats', async (req, res) => {
  try {
    const [movieCount] = await query('SELECT COUNT(*) as total FROM movie');
    const [userCount] = await query('SELECT COUNT(*) as total FROM user');
    const [rateCount] = await query('SELECT COUNT(*) as total FROM rate');
    const [wishCount] = await query('SELECT COUNT(*) as total FROM wish');

    const [popularMovies] = await query(
      'SELECT title, views, rating FROM movie ORDER BY views DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: {
        movies: movieCount.total,
        users: userCount.total,
        rates: rateCount.total,
        wishes: wishCount.total,
        popularMovies
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;

