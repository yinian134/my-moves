/**
 * 用户认证中间件
 * 用于验证用户是否已登录
 */

const { verifyToken } = require('../config/security');
const { AppError, ERROR_CODES } = require('../utils/errors');
const { checkAccountLock } = require('./security');

// 验证用户登录状态
function authenticateToken(req, res, next) {
  // 从请求头获取token（前端需要在header中传递：Authorization: Bearer <token>）
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 格式: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: ERROR_CODES.UNAUTHORIZED
    });
  }

  // 验证token
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: ERROR_CODES.TOKEN_INVALID
    });
  }

  // 将用户信息存储到请求对象中，供后续路由使用
  req.user = user;
  next();
}

// 验证管理员权限
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      error: ERROR_CODES.ADMIN_REQUIRED
    });
  }
}

// 组合中间件：认证 + 账户锁定检查
const authenticate = [authenticateToken, checkAccountLock];

module.exports = {
  authenticateToken,
  requireAdmin,
  authenticate
};
