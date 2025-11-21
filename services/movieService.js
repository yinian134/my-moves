/**
 * 电影服务层
 * 封装电影相关的业务逻辑
 */

const { query } = require('../config/database');
const { paginate } = require('../utils/paginate');
const { AppError, ERROR_CODES } = require('../utils/errors');
const { logHelper } = require('../config/logger');

class MovieService {
  /**
   * 获取电影列表
   */
  async getMovies(params = {}) {
    const {
      page = 1,
      limit = 12,
      genre,
      region,
      year,
      sort = 'created_at',
      order = 'DESC',
      keyword
    } = params;

    let sql = 'SELECT m.*, g.name as genre_name FROM movie m LEFT JOIN genre g ON m.genre_id = g.id WHERE 1=1';
    const sqlParams = [];

    // 筛选条件
    if (genre) {
      sql += ' AND m.genre_id = ?';
      sqlParams.push(genre);
    }
    if (region) {
      sql += ' AND m.region = ?';
      sqlParams.push(region);
    }
    if (year) {
      sql += ' AND m.year = ?';
      sqlParams.push(year);
    }
    if (keyword) {
      sql += ' AND (m.title LIKE ? OR m.director LIKE ? OR m.actors LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      sqlParams.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 排序
    const validSorts = ['created_at', 'year', 'rating', 'views', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY m.${sortField} ${sortOrder}`;

    // 分页
    const { sql: finalSql, params: finalParams } = paginate(sql, sqlParams, page, limit);
    const movies = await query(finalSql, finalParams);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM movie m WHERE 1=1';
    const countParams = [];
    if (genre) countParams.push(genre);
    if (region) countParams.push(region);
    if (year) countParams.push(year);
    if (keyword) {
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern, keywordPattern);
    }

    const [countResult] = await query(countSql, countParams);
    const total = countResult.total;

    return {
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 获取电影详情
   */
  async getMovieById(id) {
    const sql = 'SELECT m.*, g.name as genre_name FROM movie m LEFT JOIN genre g ON m.genre_id = g.id WHERE m.id = ?';
    const movies = await query(sql, [id]);

    if (movies.length === 0) {
      throw new AppError(ERROR_CODES.MOVIE_NOT_FOUND, null, 404);
    }

    const movie = movies[0];

    // 增加观看次数
    await query('UPDATE movie SET views = views + 1 WHERE id = ?', [id]);

    // 获取评分统计
    const ratingStats = await query(
      'SELECT AVG(score) as avg_rating, COUNT(*) as rating_count FROM rate WHERE movieId = ?',
      [id]
    );

    // 获取评论
    const comments = await query(
      `SELECT 
         r.id,
         r.shortComment AS comment,
         r.score AS rating,
         r.created_at,
         u.username
       FROM rate r 
       LEFT JOIN user u ON r.userId = u.id 
       WHERE r.movieId = ? AND r.shortComment IS NOT NULL 
       ORDER BY r.id DESC 
       LIMIT 10`,
      [id]
    );

    // 获取推荐电影
    const recommendations = await query(
      `SELECT m.* FROM movie m 
       WHERE (m.genre_id = ? OR m.director = ?) AND m.id != ? 
       ORDER BY m.rating DESC, m.views DESC 
       LIMIT 6`,
      [movie.genre_id, movie.director, id]
    );

    return {
      ...movie,
      rating: ratingStats[0].avg_rating || 0,
      ratingCount: ratingStats[0].rating_count || 0,
      comments,
      recommendations
    };
  }

  /**
   * 创建电影
   */
  async createMovie(movieData) {
    const {
      title,
      director,
      actors,
      genreId,
      region,
      year,
      duration,
      description,
      poster,
      trailer,
      videoUrl,
      videoType = 'local',
      status = 'active'
    } = movieData;

    if (!title) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, { field: 'title' }, 400);
    }

    const result = await query(
      `INSERT INTO movie (
        title, director, actors, genre_id, region, year, duration,
        description, poster, trailer, video_url, video_type, status,
        rating, views, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
      [title, director || null, actors || null, genreId || null, region || null,
       year || null, duration || null, description || null, poster || null,
       trailer || null, videoUrl || null, videoType, status]
    );

    logHelper.logDatabase('INSERT', 'movie', { movieId: result.insertId, title });

    return { movieId: result.insertId };
  }

  /**
   * 更新电影
   */
  async updateMovie(id, movieData) {
    // 检查电影是否存在
    const existing = await query('SELECT id FROM movie WHERE id = ?', [id]);
    if (existing.length === 0) {
      throw new AppError(ERROR_CODES.MOVIE_NOT_FOUND, null, 404);
    }

    const updateFields = [];
    const params = [];

    const allowedFields = ['title', 'director', 'actors', 'genre_id', 'region',
                          'year', 'duration', 'description', 'poster', 'trailer',
                          'video_url', 'video_type', 'file_size', 'file_path', 'status'];

    for (const field of allowedFields) {
      if (movieData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(movieData[field]);
      }
    }

    if (updateFields.length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, { message: '没有要更新的字段' }, 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE movie SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    logHelper.logDatabase('UPDATE', 'movie', { movieId: id });

    return { success: true };
  }

  /**
   * 删除电影
   */
  async deleteMovie(id) {
    const existing = await query('SELECT id FROM movie WHERE id = ?', [id]);
    if (existing.length === 0) {
      throw new AppError(ERROR_CODES.MOVIE_NOT_FOUND, null, 404);
    }

    await query('DELETE FROM movie WHERE id = ?', [id]);

    logHelper.logDatabase('DELETE', 'movie', { movieId: id });

    return { success: true };
  }

  /**
   * 获取热门电影
   */
  async getHotMovies(limit = 10) {
    const movies = await query(
      'SELECT m.*, g.name as genre_name FROM movie m LEFT JOIN genre g ON m.genre_id = g.id ORDER BY m.views DESC, m.rating DESC LIMIT ?',
      [limit]
    );
    return movies;
  }

  /**
   * 获取电影类型列表
   */
  async getGenres() {
    const genres = await query('SELECT * FROM genre ORDER BY name');
    return genres;
  }
}

module.exports = new MovieService();

