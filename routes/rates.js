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
      'SELECT id FROM rate WHERE userId = ? AND movieId = ?',
      [userId, movieId]
    );

    if (existingRates.length > 0) {
      // 更新现有评分
      await query(
        'UPDATE rate SET score = ?, shortComment = ? WHERE userId = ? AND movieId = ?',
        [rating, comment || null, userId, movieId]
      );
    } else {
      // 插入新评分
      await query(
        'INSERT INTO rate (userId, movieId, score, shortComment) VALUES (?, ?, ?, ?)',
        [userId, movieId, rating, comment || null]
      );
    }

    // 更新电影的平均评分
    const ratingStats = await query(
      'SELECT AVG(score) as avg_rating FROM rate WHERE movieId = ?',
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
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * pageSize;

    const rateListSql = `
      SELECT 
        r.id,
        r.userId,
        r.movieId,
        r.score AS rating,
        r.shortComment AS comment,
        NULL AS created_at,
        u.username
      FROM rate r 
      LEFT JOIN user u ON r.userId = u.id 
      WHERE r.movieId = ? 
      ORDER BY r.id DESC 
      LIMIT ${pageSize} OFFSET ${offset}`;
    const rates = await query(rateListSql, [movieId]);

    // 获取总数
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM rate WHERE movieId = ?',
      [movieId]
    );

    res.json({
      success: true,
      data: {
        rates,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
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
    const rates = await query('SELECT * FROM rate WHERE id = ? AND userId = ?', [id, userId]);
    
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

