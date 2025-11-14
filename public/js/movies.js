/**
 * 电影列表页JavaScript
 */

let currentPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await loadGenres();
  await loadYears();
  
  // 检查URL参数（搜索关键词）
  const urlParams = new URLSearchParams(window.location.search);
  const keyword = urlParams.get('keyword');
  if (keyword) {
    document.getElementById('searchInput').value = keyword;
  }
  
  await loadMovies();
});

// 加载类型
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

// 加载年份
function loadYears() {
  const yearFilter = document.getElementById('yearFilter');
  if (!yearFilter) return;

  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 30; i--) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    yearFilter.appendChild(option);
  }
}

// 加载电影列表
async function loadMovies(page = 1) {
  try {
    currentPage = page;
    const params = {
      page,
      limit: 24,
      genre: document.getElementById('genreFilter')?.value || '',
      region: document.getElementById('regionFilter')?.value || '',
      year: document.getElementById('yearFilter')?.value || '',
      sort: document.getElementById('sortFilter')?.value || 'created_at',
      order: 'DESC',
      keyword: document.getElementById('searchInput')?.value || ''
    };

    const result = await movieAPI.getList(params);
    if (result.success) {
      const container = document.getElementById('movieList');
      if (container) {
        if (result.data.movies.length === 0) {
          container.innerHTML = '<p style="text-align:center;padding:40px;">没有找到电影</p>';
        } else {
          container.innerHTML = result.data.movies.map(movie => createMovieCard(movie)).join('');
        }
      }

      updatePagination(result.data.pagination);
    }
  } catch (error) {
    console.error('加载电影列表失败:', error);
  }
}

// 创建电影卡片
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
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button ${page <= 1 ? 'disabled' : ''} onclick="loadMovies(${page - 1})">上一页</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="${i === page ? 'active' : ''}" onclick="loadMovies(${i})">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<button disabled>...</button>`;
    }
  }
  
  html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="loadMovies(${page + 1})">下一页</button>`;
  container.innerHTML = html;
}

// 跳转到详情页
function goToMovieDetail(movieId) {
  window.location.href = `/movie-detail.html?id=${movieId}`;
}

