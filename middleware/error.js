// middleware/error.js
const { errorHandler, AppError, ERROR_CODES } = require('../utils/errors');
const { logHelper } = require('../config/logger');

module.exports = function (app) {
  // 404 捕获
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      error: {
        code: 404,
        message: '接口不存在'
      }
    });
  });

  // 全局错误处理
  app.use((err, req, res, next) => {
    // 记录错误日志
    logHelper.logError(err, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.userId
    });
    
    // 使用统一错误处理
    errorHandler(err, req, res, next);
  });
};