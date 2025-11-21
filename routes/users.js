/**
 * 用户相关API路由
 * 处理用户注册、登录、个人信息等
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 1. 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    // 检查用户名是否已存在
    const existingUsers = await query('SELECT id FROM user WHERE username = ? OR email = ?', [username, email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或邮箱已存在' 
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const result = await query(
      'INSERT INTO user (username, email, phone, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [username, email || null, phone || null, hashedPassword, 'user']
    );

    res.json({
      success: true,
      message: '注册成功',
      data: { userId: result.insertId }
    });
  } catch (error) {
    console.error('用户注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 2. 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    // 查找用户（支持用户名、邮箱、手机号登录）
    const users = await query(
      'SELECT * FROM user WHERE username = ? OR email = ? OR phone = ?',
      [username, username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const user = users[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // 不返回密码
    delete user.password;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('用户登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 3. 获取当前用户信息（需要登录）
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await query('SELECT id, username, email, phone, role, avatar, created_at FROM user WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 4. 更新用户信息
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { email, phone, avatar } = req.body;
    const updateFields = [];
    const params = [];

    if (email !== undefined) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      params.push(avatar);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    updateFields.push('updated_at = NOW()');
    params.push(req.user.userId);

    await query(
      `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 5. 获取用户收藏列表
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT w.*, m.title, m.poster, m.rating, m.year, m.director 
               FROM wish w 
               LEFT JOIN movie m ON w.movie_id = m.id 
               WHERE w.user_id = ?`;
    const params = [req.user.userId];

    if (status) {
      sql += ' AND w.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY w.created_at DESC';

    const wishlist = await query(sql, params);

    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
 