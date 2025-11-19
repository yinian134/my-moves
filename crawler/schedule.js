// crawler/schedule.js
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// 每天 03:00 执行
cron.schedule('0 3 * * *', () => {
  console.log('⏰ 开始每日 TMDB 抓取任务');
  exec(`node ${path.join(__dirname, 'tmdbDaily.js')}`, (err, stdout, stderr) => {
    if (err) console.error('抓取脚本出错：', err);
    if (stderr) console.error(stderr);
    console.log(stdout);
  });
});

console.log('📅 定时任务已启动，每天 03:00 自动抓取');

require('./crawler/schedule');   // 每日抓取
require('./crawler/tmdbDaily');  // 首次启动立即抓一次