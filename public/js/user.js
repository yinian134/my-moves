/**
 * 用户中心页面JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 检查登录状态
  if (!requireAuth()) {
    return;
  }

  await loadUserProfile();
  await loadWishlist();
  await loadWatched();
});

// 切换标签
function switchUserTab(tab) {
  // 隐藏所有内容
  document.getElementById('profileTab').style.display = 'none';
  document.getElementById('wishlistTab').style.display = 'none';
  document.getElementById('watchedTab').style.display = 'none';

  // 显示选中的标签内容
  document.getElementById(tab + 'Tab').style.display = 'block';

  // 更新按钮状态
  document.querySelectorAll('.user-tabs .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

// 加载用户资料
async function loadUserProfile() {
  try {
    const result = await userAPI.getMe();
    if (result.success) {
      const user = result.data;
      document.getElementById('profileUsername').value = user.username || '';
      document.getElementById('profileEmail').value = user.email || '';
      document.getElementById('profilePhone').value = user.phone || '';
    }
  } catch (error) {
    console.error('加载用户资料失败:', error);
  }
}

// 更新用户资料
async function updateProfile(event) {
  event.preventDefault();
  
  const email = document.getElementById('profileEmail').value;
  const phone = document.getElementById('profilePhone').value;
  const messageDiv = document.getElementById('profileMessage');

  try {
    const result = await userAPI.updateMe({ email, phone });
    
    if (result.success) {
      messageDiv.className = 'message success';
      messageDiv.textContent = '更新成功';
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = result.message || '更新失败';
    }
  } catch (error) {
    console.error('更新资料失败:', error);
    messageDiv.className = 'message error';
    messageDiv.textContent = '更新失败';
  }
}

// 加载收藏列表
async function loadWishlist() {
  try {
    const result = await userAPI.getWishlist('favorite');
    if (result.success) {
      const container = document.getElementById('wishlistGrid');
      if (result.data.length === 0) {
        container.innerHTML = '<p>暂无收藏</p>';
      } else {
        container.innerHTML = result.data.map(item => createMovieCard(item)).join('');
      }
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error);
  }
}

// 加载已看电影
async function loadWatched() {
  try {
    const result = await userAPI.getWishlist('watched');
    if (result.success) {
      const container = document.getElementById('watchedGrid');
      if (result.data.length === 0) {
        container.innerHTML = '<p>暂无已看电影</p>';
      } else {
        container.innerHTML = result.data.map(item => createMovieCard(item)).join('');
      }
    }
  } catch (error) {
    console.error('加载已看电影失败:', error);
  }
}

// 创建电影卡片
function createMovieCard(item) {
  const movie = item;
  const poster = movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster';
  const rating = movie.rating ? movie.rating.toFixed(1) : '暂无评分';
  
  return `
    <div class="movie-card" onclick="goToMovieDetail(${movie.movie_id})">
      <img src="${poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">
      <div class="movie-card-body">
        <div class="movie-card-title">${movie.title}</div>
        <div class="movie-card-info">${movie.year || '未知年份'}</div>
        <div class="movie-card-rating">⭐ ${rating}</div>
      </div>
    </div>
  `;
}

// 跳转到详情页
function goToMovieDetail(movieId) {
  window.location.href = `/movie-detail.html?id=${movieId}`;
}

