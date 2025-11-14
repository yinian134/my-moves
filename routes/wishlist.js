/**
 * 收藏/心愿单相关API路由
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 1. 添加收藏（需要登录）
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { movieId, status = 'want' } = req.body; // status: 'want'想看, 'watched'已看, 'favorite'收藏
    const userId = req.user.userId;

    if (!movieId) {
      return res.status(400).json({ 
        success: false, 
        message: '电影ID不能为空' 
      });
    }

    // 检查是否已经收藏
    const existingWishes = await query(
      'SELECT id FROM wish WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    if (existingWishes.length > 0) {
      // 更新状态
      await query(
        'UPDATE wish SET status = ?, created_at = NOW() WHERE user_id = ? AND movie_id = ?',
        [status, userId, movieId]
      );
    } else {
      // 插入新收藏
      await query(
        'INSERT INTO wish (user_id, movie_id, status, created_at) VALUES (?, ?, ?, NOW())',
        [userId, movieId, status]
      );
    }

    res.json({
      success: true,
      message: '收藏成功'
    });
  } catch (error) {
    console.error('添加收藏错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 2. 删除收藏
router.delete('/:movieId', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.userId;

    await query('DELETE FROM wish WHERE user_id = ? AND movie_id = ?', [userId, movieId]);

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('删除收藏错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 3. 检查是否已收藏
router.get('/check/:movieId', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.userId;

    const wishes = await query(
      'SELECT * FROM wish WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    res.json({
      success: true,
      data: {
        isWished: wishes.length > 0,
        status: wishes.length > 0 ? wishes[0].status : null
      }
    });
  } catch (error) {
    console.error('检查收藏状态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;

