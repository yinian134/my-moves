/**
 * 用户服务层
 * 封装用户相关的业务逻辑
 */

const { query } = require('../config/database');
const {
  hashPassword,
  comparePassword,
  generateToken,
  isAccountLocked,
  incrementLoginAttempts,
  resetLoginAttempts,
  updateLastLogin
} = require('../config/security');
const { AppError, ERROR_CODES } = require('../utils/errors');
const { logHelper } = require('../config/logger');

class UserService {
  /**
   * 用户注册
   */
  async register(userData) {
    const { username, email, phone, password } = userData;

    if (!username || !password) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, { field: 'username/password' }, 400);
    }

    // 检查用户名是否已存在
    const existingUsers = await query(
      'SELECT id FROM user WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      throw new AppError(ERROR_CODES.DUPLICATE_RESOURCE, { resource: 'user' }, 400);
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 插入新用户
    const result = await query(
      'INSERT INTO user (username, email, phone, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [username, email || null, phone || null, hashedPassword, 'user']
    );

    logHelper.logDatabase('INSERT', 'user', { userId: result.insertId, username });

    return { userId: result.insertId };
  }

  /**
   * 用户登录
   */
  async login(credentials) {
    const { username, password } = credentials;

    if (!username || !password) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, { field: 'username/password' }, 400);
    }

    // 查找用户（支持用户名、邮箱、手机号登录）
    const users = await query(
      'SELECT * FROM user WHERE username = ? OR email = ? OR phone = ?',
      [username, username, username]
    );

    if (users.length === 0) {
      throw new AppError(ERROR_CODES.LOGIN_FAILED, null, 401);
    }

    const user = users[0];

    // 检查账户是否被锁定
    const locked = await isAccountLocked(user.id);
    if (locked) {
      throw new AppError(ERROR_CODES.ACCOUNT_LOCKED, null, 403);
    }

    // 验证密码
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      await incrementLoginAttempts(user.id);
      logHelper.logSecurity('Login failed', { userId: user.id, username });
      throw new AppError(ERROR_CODES.LOGIN_FAILED, null, 401);
    }

    // 登录成功，重置失败次数并更新最后登录时间
    await resetLoginAttempts(user.id);
    await updateLastLogin(user.id);

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // 不返回密码
    delete user.password;

    logHelper.logSecurity('Login success', { userId: user.id, username });

    return {
      user,
      token
    };
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId) {
    const users = await query(
      'SELECT id, username, email, phone, role, avatar, created_at, last_login FROM user WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, null, 404);
    }

    return users[0];
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, userData) {
    const { email, phone, avatar } = userData;
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
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, { message: '没有要更新的字段' }, 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(userId);

    await query(
      `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    logHelper.logDatabase('UPDATE', 'user', { userId });

    return { success: true };
  }

  /**
   * 获取用户收藏列表
   */
  async getWishlist(userId, status = null) {
    let sql = `SELECT w.*, m.title, m.poster, m.rating, m.year, m.director 
               FROM wish w 
               LEFT JOIN movie m ON w.movieId = m.id 
               WHERE w.userId = ?`;
    const params = [userId];

    if (status) {
      sql += ' AND w.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY w.created_at DESC';

    const wishlist = await query(sql, params);
    return wishlist;
  }
}

module.exports = new UserService();

