/**
 * 用户认证中间件
 * 用于验证用户是否已登录
 */

const jwt = require('jsonwebtoken');

// 验证用户登录状态
function authenticateToken(req, res, next) {
  // 从请求头获取token（前端需要在header中传递：Authorization: Bearer <token>）
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 格式: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '未登录，请先登录' 
    });
  }

  // 验证token
  jwt.verify(token, 'your-secret-key-change-this-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: '登录已过期，请重新登录' 
      });
    }
    // 将用户信息存储到请求对象中，供后续路由使用
    req.user = user;
    next();
  });
}

// 验证管理员权限
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: '需要管理员权限' 
    });
  }
}

module.exports = {
  authenticateToken,
  requireAdmin
};
