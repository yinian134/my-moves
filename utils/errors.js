/**
 * 统一错误处理
 * 定义错误码和错误响应格式
 */

// 错误码定义
const ERROR_CODES = {
  // 通用错误 (1000-1999)
  UNKNOWN_ERROR: { code: 1000, message: '未知错误' },
  VALIDATION_ERROR: { code: 1001, message: '参数验证失败' },
  DATABASE_ERROR: { code: 1002, message: '数据库操作失败' },
  
  // 认证错误 (2000-2999)
  UNAUTHORIZED: { code: 2000, message: '未登录，请先登录' },
  TOKEN_EXPIRED: { code: 2001, message: '登录已过期，请重新登录' },
  TOKEN_INVALID: { code: 2002, message: '无效的登录凭证' },
  LOGIN_FAILED: { code: 2003, message: '用户名或密码错误' },
  ACCOUNT_LOCKED: { code: 2004, message: '账户已被锁定，请稍后再试' },
  PASSWORD_WEAK: { code: 2005, message: '密码强度不足' },
  
  // 权限错误 (3000-3999)
  FORBIDDEN: { code: 3000, message: '权限不足' },
  ADMIN_REQUIRED: { code: 3001, message: '需要管理员权限' },
  
  // 资源错误 (4000-4999)
  NOT_FOUND: { code: 4000, message: '资源不存在' },
  MOVIE_NOT_FOUND: { code: 4001, message: '电影不存在' },
  USER_NOT_FOUND: { code: 4002, message: '用户不存在' },
  FILE_NOT_FOUND: { code: 4003, message: '文件不存在' },
  DUPLICATE_RESOURCE: { code: 4004, message: '资源已存在' },
  
  // 业务错误 (5000-5999)
  RATE_LIMIT_EXCEEDED: { code: 5000, message: '请求过于频繁，请稍后再试' },
  INVALID_OPERATION: { code: 5001, message: '无效的操作' },
  FILE_TOO_LARGE: { code: 5002, message: '文件过大' },
  UNSUPPORTED_FILE_TYPE: { code: 5003, message: '不支持的文件类型' }
};

/**
 * 自定义应用错误类
 */
class AppError extends Error {
  constructor(errorCode, details = null, statusCode = 500) {
    super(errorCode.message);
    this.name = 'AppError';
    this.code = errorCode.code;
    this.message = errorCode.message;
    this.details = details;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/**
 * 创建错误响应
 */
function createErrorResponse(error, includeStack = false) {
  const response = {
    success: false,
    error: {
      code: error.code || ERROR_CODES.UNKNOWN_ERROR.code,
      message: error.message || ERROR_CODES.UNKNOWN_ERROR.message
    }
  };
  
  // 开发环境包含详细信息
  if (includeStack && process.env.NODE_ENV !== 'production') {
    response.error.details = error.details;
    if (error.stack) {
      response.error.stack = error.stack;
    }
  }
  
  return response;
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 如果是自定义错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(createErrorResponse(err));
  }
  
  // 数据库错误
  if (err.code && err.code.startsWith('ER_')) {
    const dbError = new AppError(
      ERROR_CODES.DATABASE_ERROR,
      { sqlMessage: err.sqlMessage },
      500
    );
    return res.status(500).json(createErrorResponse(dbError));
  }
  
  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    const tokenError = new AppError(ERROR_CODES.TOKEN_INVALID, null, 401);
    return res.status(401).json(createErrorResponse(tokenError));
  }
  
  if (err.name === 'TokenExpiredError') {
    const tokenError = new AppError(ERROR_CODES.TOKEN_EXPIRED, null, 401);
    return res.status(401).json(createErrorResponse(tokenError));
  }
  
  // 默认错误
  const unknownError = new AppError(ERROR_CODES.UNKNOWN_ERROR, null, 500);
  return res.status(500).json(createErrorResponse(unknownError));
}

module.exports = {
  ERROR_CODES,
  AppError,
  createErrorResponse,
  errorHandler
};

