/**
 * 数据库连接配置文件
 * 这个文件负责连接MySQL数据库
 */

// 引入mysql2模块
const mysql = require('mysql2/promise');
// 如果需要使用.env文件，可以取消下面的注释
// require('dotenv').config();

// 创建数据库连接池（连接池可以提高性能，管理多个数据库连接）
// 注意：由于.env文件可能无法创建，这里直接使用您的数据库配置
const pool = mysql.createPool({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'abcd1234',
  database: 'family_movie',
  waitForConnections: true,
  connectionLimit: 10, // 最大连接数
  queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功！');
    connection.release(); // 释放连接
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 执行SQL查询的通用函数（简化数据库操作）
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

// 导出模块，供其他文件使用
module.exports = {
  pool,
  query,
  testConnection
};
