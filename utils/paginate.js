// utils/paginate.js
/**
 * 统一给 SQL 追加分页语句
 * @param {string} sql     - 已经拼好 WHERE/ORDER 的 SQL
 * @param {Array}  params  - 已经对应的占位符参数
 * @param {number} page    - 前端传来的页码（1 起始）
 * @param {number} limit   - 每页条数
 * @returns {{sql: string, params: Array}} 拼接后的 sql 和参数
 */
function paginate(sql, params = [], page = 1, limit = 20) {
  const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 20);
  const offset   = (pageNum - 1) * pageSize;

  const finalSql = `${sql} LIMIT ${pageSize} OFFSET ${offset}`;
  const finalParams = Array.isArray(params) ? [...params] : [];

  return { sql: finalSql, params: finalParams };
}

module.exports = { paginate };