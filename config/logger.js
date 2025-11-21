/**
 * 日志系统配置
 * 使用Winston进行日志管理
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// 创建Logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'family-movie' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// 日志工具函数
const logHelper = {
  // 记录API请求
  logRequest: (req, res, responseTime) => {
    logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });
  },

  // 记录错误
  logError: (error, context = {}) => {
    logger.error('Error occurred', {
      message: error.message,
      stack: error.stack,
      ...context
    });
  },

  // 记录数据库操作
  logDatabase: (operation, table, details = {}) => {
    logger.debug('Database operation', {
      operation,
      table,
      ...details
    });
  },

  // 记录安全事件
  logSecurity: (event, details = {}) => {
    logger.warn('Security event', {
      event,
      ...details
    });
  }
};

module.exports = { logger, logHelper };

