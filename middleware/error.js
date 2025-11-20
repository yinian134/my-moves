// middleware/error.js
module.exports = function (app) {
  // 404 捕获
  app.use((req, res) => {
    res.status(404).json({ success: false, message: '接口不存在' });
  });

  // 全局错误处理
  app.use((err, req, res, next) => {
    console.error('全局错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  });
};