// crawler/tmdbDaily.js
require('dotenv').config();
const axios = require('axios');
const { pool } = require('../config/database');

const PAGE_SIZE = 20;           // 每天抓几部
const TMDB_BASE = 'https://api.themoviedb.org/3';

(async () => {
  const conn = await pool.getConnection();
  try {
    // 1. 热门电影
    const { data } = await axios.get(`${TMDB_BASE}/movie/popular`, {
      params: {
        api_key: process.env.TMDB_KEY,
        language: process.env.TMDB_LANG,
        region: process.env.TMDB_REGION,
        page: 1
      }
    });

    for (const m of data.results.slice(0, PAGE_SIZE)) {
      // 2. 详情 + 视频
      const detail = await axios.get(`${TMDB_BASE}/movie/${m.id}`, {
        params: { api_key: process.env.TMDB_KEY, language: process.env.TMDB_LANG }
      });
      const videos = await axios.get(`${TMDB_BASE}/movie/${m.id}/videos`, {
        params: { api_key: process.env.TMDB_KEY }
      });
      const yt = videos.data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      const poster = m.poster_path
        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
        : null;
      const trailer = yt ? `https://www.youtube.com/embed/${yt.key}` : null;

      // 3. 写库（ON DUPLICATE KEY UPDATE 防重）
      // 注意：只写入trailer，video_url留空，等待管理员上传正片
      await conn.execute(`
        INSERT INTO movie (
          imdb_id, title, director, actors, region, year, duration,
          description, poster, trailer, video_url, video_type, rating, views, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          updated_at = NOW(),
          trailer = COALESCE(VALUES(trailer), trailer)
      `, [
        detail.data.imdb_id || null,
        m.title,
        detail.data.credits?.crew?.find(c => c.job === 'Director')?.name || '',
        detail.data.credits?.cast?.slice(0, 3).map(c => c.name).join(',') || '',
                       
        detail.data.production_countries?.[0]?.name || '',
        new Date(m.release_date).getFullYear() || 0,
        detail.data.runtime || 0,
        detail.data.overview || '',
        poster,
        trailer,              // 只写入预告片
        NULL,                 // video_url 留空，等待管理员上传
        'external',           // 预告片类型为external
        m.vote_average || 0,
        0,
        'active'
      ]);
    }
    console.log(`✅ 本日抓取完成，共 ${PAGE_SIZE} 部`);
  } catch (e) {
    console.error('❌ 抓取失败', e.message);
  } finally {
    conn.release();
  }
})();