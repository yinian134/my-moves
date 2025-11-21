/**
 * 安全中间件
 * 包含登录限制、CSRF保护、请求限流等
 */

const rateLimit = require('express-rate-limit');
const { isAccountLocked } = require('../config/security');
const { logHelper } = require('../config/logger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * 登录请求限流
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次请求
  message: { 
    success: false, 
    error: { 
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
      message: '登录尝试过于频繁，请15分钟后再试' 
    } 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API请求限流
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: { 
    success: false, 
    error: { 
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
      message: '请求过于频繁，请稍后再试' 
    } 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 检查账户锁定状态
 */
async function checkAccountLock(req, res, next) {
  try {
    if (req.user && req.user.userId) {
      const locked = await isAccountLocked(req.user.userId);
      if (locked) {
        logHelper.logSecurity('Locked account access attempt', {
          userId: req.user.userId,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          error: ERROR_CODES.ACCOUNT_LOCKED
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 记录操作日志
 */
function logOperation(action, resource = null) {
  return async (req, res, next) => {
    // 在响应后记录日志
    res.on('finish', () => {
      if (res.statusCode < 400) {
        // 这里可以记录到数据库
        logHelper.logRequest(req, res, Date.now() - req.startTime);
      }
    });
    
    req.startTime = Date.now();
    req.operation = { action, resource };
    next();
  };
}

/**
 * 验证请求来源
 */
function validateOrigin(req, res, next) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (origin && !allowedOrigins.includes(origin)) {
    logHelper.logSecurity('Invalid origin', { origin, ip: req.ip });
    return res.status(403).json({
      success: false,
      error: ERROR_CODES.FORBIDDEN
    });
  }
  
  next();
}

module.exports = {
  loginLimiter,
  apiLimiter,
  checkAccountLock,
  logOperation,
  validateOrigin
};

