/**
 * 首页JavaScript
 */

let currentPage = 1;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadGenres();
  await loadYears();
  await loadHotMovies();
  await loadMovies();
});

// 加载电影类型
async function loadGenres() {
  try {
    const result = await movieAPI.getGenres();
    if (result.success) {
      const genreFilter = document.getElementById('genreFilter');
      if (genreFilter) {
        result.data.forEach(genre => {
          const option = document.createElement('option');
          option.value = genre.id;
          option.textContent = genre.name;
          genreFilter.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('加载类型失败:', error);
  }
}

// 加载年份选项（近20年）
function loadYears() {
  const yearFilter = document.getElementById('yearFilter');
  if (!yearFilter) return;

  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 20; i--) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    yearFilter.appendChild(option);
  }
}

// 加载热门电影
async function loadHotMovies() {
  try {
    const result = await movieAPI.getHot(6);
    if (result.success) {
      const container = document.getElementById('hotMovies');
      if (container) {
        container.innerHTML = result.data.map(movie => createMovieCard(movie)).join('');
      }
    }
  } catch (error) {
    console.error('加载热门电影失败:', error);
  }
}

// 加载电影列表
async function loadMovies(page = 1) {
  try {
    currentPage = page;
    const params = {
      page,
      limit: 12,
      genre: document.getElementById('genreFilter')?.value || '',
      region: document.getElementById('regionFilter')?.value || '',
      year: document.getElementById('yearFilter')?.value || '',
      sort: document.getElementById('sortFilter')?.value || 'created_at',
      order: 'DESC'
    };

    const result = await movieAPI.getList(params);
    if (result.success) {
      const container = document.getElementById('movieList');
      if (container) {
        container.innerHTML = result.data.movies.map(movie => createMovieCard(movie)).join('');
      }

      // 更新分页
      updatePagination(result.data.pagination);
    }
  } catch (error) {
    console.error('加载电影列表失败:', error);
  }
}

// 创建电影卡片HTML
function createMovieCard(movie) {
  const poster = movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster';
  const rating = movie.rating ? movie.rating.toFixed(1) : '暂无评分';
  
  return `
    <div class="movie-card" onclick="goToMovieDetail(${movie.id})">
      <img src="${poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">
      <div class="movie-card-body">
        <div class="movie-card-title">${movie.title}</div>
        <div class="movie-card-info">${movie.year || '未知年份'}</div>
        <div class="movie-card-info">${movie.director || '未知导演'}</div>
        <div class="movie-card-rating">⭐ ${rating}</div>
      </div>
    </div>
  `;
}

// 更新分页
function updatePagination(pagination) {
  const container = document.getElementById('pagination');
  if (!container) return;

  const { page, totalPages } = pagination;
  let html = '';

  // 上一页按钮
  html += `<button ${page <= 1 ? 'disabled' : ''} onclick="loadMovies(${page - 1})">上一页</button>`;

  // 页码按钮
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="${i === page ? 'active' : ''}" onclick="loadMovies(${i})">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<button disabled>...</button>`;
    }
  }

  // 下一页按钮
  html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="loadMovies(${page + 1})">下一页</button>`;

  container.innerHTML = html;
}

// 搜索电影
function searchMovies() {
  const keyword = document.getElementById('searchInput').value;
  if (keyword) {
    window.location.href = `/movies.html?keyword=${encodeURIComponent(keyword)}`;
  } else {
    loadMovies();
  }
}

// 跳转到电影详情页
function goToMovieDetail(movieId) {
  window.location.href = `/movie-detail.html?id=${movieId}`;
}

// 回车搜索
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchMovies();
      }
    });
  }
});

