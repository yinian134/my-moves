/**
 * 安全配置
 * 包含密码加密、登录限制、JWT配置等
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./database');
const { logHelper } = require('./logger');

// JWT密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 登录限制配置
const LOGIN_CONFIG = {
  MAX_ATTEMPTS: 5,           // 最大尝试次数
  LOCK_DURATION: 30 * 60 * 1000, // 锁定30分钟（毫秒）
  RESET_ATTEMPTS_AFTER: 15 * 60 * 1000 // 15分钟后重置尝试次数
};

/**
 * 密码加密
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 生成JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证JWT Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 检查账户是否被锁定
 */
async function isAccountLocked(userId) {
  const users = await query(
    'SELECT locked_until FROM user WHERE id = ?',
    [userId]
  );
  
  if (users.length === 0) return false;
  
  const lockedUntil = users[0].locked_until;
  if (!lockedUntil) return false;
  
  return new Date(lockedUntil) > new Date();
}

/**
 * 增加登录失败次数
 */
async function incrementLoginAttempts(userId) {
  const users = await query(
    'SELECT login_attempts FROM user WHERE id = ?',
    [userId]
  );
  
  if (users.length === 0) return;
  
  let attempts = users[0].login_attempts + 1;
  let lockedUntil = null;
  
  // 如果达到最大尝试次数，锁定账户
  if (attempts >= LOGIN_CONFIG.MAX_ATTEMPTS) {
    lockedUntil = new Date(Date.now() + LOGIN_CONFIG.LOCK_DURATION);
    logHelper.logSecurity('Account locked', { userId, attempts });
  }
  
  await query(
    'UPDATE user SET login_attempts = ?, locked_until = ? WHERE id = ?',
    [attempts, lockedUntil, userId]
  );
}

/**
 * 重置登录失败次数
 */
async function resetLoginAttempts(userId) {
  await query(
    'UPDATE user SET login_attempts = 0, locked_until = NULL WHERE id = ?',
    [userId]
  );
}

/**
 * 更新最后登录时间
 */
async function updateLastLogin(userId) {
  await query(
    'UPDATE user SET last_login = NOW() WHERE id = ?',
    [userId]
  );
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  isAccountLocked,
  incrementLoginAttempts,
  resetLoginAttempts,
  updateLastLogin,
  LOGIN_CONFIG,
  JWT_SECRET
};

