/**
 * 评分和评论相关API路由
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 1. 添加评分和评论（需要登录）
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { movieId, rating, comment } = req.body;
    const userId = req.user.userId;

    if (!movieId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: '电影ID和评分不能为空' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: '评分必须在1-5之间' 
      });
    }

    // 检查是否已经评过分
    const existingRates = await query(
      'SELECT id FROM rate WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    if (existingRates.length > 0) {
      // 更新现有评分
      await query(
        'UPDATE rate SET rating = ?, comment = ?, updated_at = NOW() WHERE user_id = ? AND movie_id = ?',
        [rating, comment || null, userId, movieId]
      );
    } else {
      // 插入新评分
      await query(
        'INSERT INTO rate (user_id, movie_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [userId, movieId, rating, comment || null]
      );
    }

    // 更新电影的平均评分
    const ratingStats = await query(
      'SELECT AVG(rating) as avg_rating FROM rate WHERE movie_id = ?',
      [movieId]
    );
    await query(
      'UPDATE movie SET rating = ? WHERE id = ?',
      [ratingStats[0].avg_rating || 0, movieId]
    );

    res.json({
      success: true,
      message: '评分成功'
    });
  } catch (error) {
    console.error('添加评分错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 2. 获取电影的评分和评论列表
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const rates = await query(
      `SELECT r.*, u.username, u.avatar 
       FROM rate r 
       LEFT JOIN user u ON r.user_id = u.id 
       WHERE r.movie_id = ? 
       ORDER BY r.created_at DESC 
       LIMIT ? OFFSET ?`,
      [movieId, parseInt(limit), parseInt(offset)]
    );

    // 获取总数
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM rate WHERE movie_id = ?',
      [movieId]
    );

    res.json({
      success: true,
      data: {
        rates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取评分列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 3. 删除自己的评论
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查评论是否属于当前用户
    const rates = await query('SELECT * FROM rate WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (rates.length === 0) {
      return res.status(404).json({ success: false, message: '评论不存在或无权限删除' });
    }

    await query('DELETE FROM rate WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;

