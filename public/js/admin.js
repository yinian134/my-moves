/**
 * 管理后台JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 检查管理员权限
  if (!checkAdmin()) {
    return;
  }

  await loadStats();
  await loadGenres();
  await loadAdminMovies();
  await loadAdminUsers();
  await loadAdminGenres();
});

// 切换标签
function switchAdminTab(tab) {
  // 隐藏所有内容
  document.getElementById('statsTab').style.display = 'none';
  document.getElementById('moviesTab').style.display = 'none';
  document.getElementById('usersTab').style.display = 'none';
  document.getElementById('genresTab').style.display = 'none';

  // 显示选中的标签内容
  document.getElementById(tab + 'Tab').style.display = 'block';

  // 更新按钮状态
  document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

// 加载统计数据
async function loadStats() {
  try {
    const result = await adminAPI.getStats();
    if (result.success) {
      const data = result.data;
      document.getElementById('statsMovies').textContent = data.movies || 0;
      document.getElementById('statsUsers').textContent = data.users || 0;
      document.getElementById('statsRates').textContent = data.rates || 0;
      document.getElementById('statsWishes').textContent = data.wishes || 0;

      // 显示热门电影
      if (data.popularMovies) {
        const container = document.getElementById('popularMovies');
        container.innerHTML = data.popularMovies.map(movie => `
          <div class="card" style="margin:10px 0;">
            <p><strong>${movie.title}</strong></p>
            <p>观看次数: ${movie.views} | 评分: ${movie.rating || '暂无'}</p>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 加载类型（用于添加电影时的下拉框）
async function loadGenres() {
  try {
    const result = await movieAPI.getGenres();
    if (result.success) {
      const select = document.getElementById('movieGenre');
      if (select) {
        select.innerHTML = '<option value="">请选择类型</option>';
        result.data.forEach(genre => {
          const option = document.createElement('option');
          option.value = genre.id;
          option.textContent = genre.name;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('加载类型失败:', error);
  }
}

// 添加电影
async function addMovie(event) {
  event.preventDefault();
  
  const data = {
    title: document.getElementById('movieTitle').value,
    director: document.getElementById('movieDirector').value,
    actors: document.getElementById('movieActors').value,
    genreId: document.getElementById('movieGenre').value || null,
    region: document.getElementById('movieRegion').value || null,
    year: document.getElementById('movieYear').value || null,
    description: document.getElementById('movieDescription').value || null,
    poster: document.getElementById('moviePoster').value || null,
    videoUrl: document.getElementById('movieVideoUrl').value || null
  };

  try {
    const result = await adminAPI.addMovie(data);
    if (result.success) {
      alert('添加电影成功');
      document.getElementById('addMovieForm').reset();
      await loadAdminMovies();
    } else {
      alert(result.message || '添加失败');
    }
  } catch (error) {
    console.error('添加电影失败:', error);
    alert('添加失败');
  }
}

// 加载电影列表（管理后台）
async function loadAdminMovies() {
  try {
    const result = await movieAPI.getList({ page: 1, limit: 100 });
    if (result.success) {
      const container = document.getElementById('adminMovieList');
      if (result.data.movies.length === 0) {
        container.innerHTML = '<p>暂无电影</p>';
      } else {
        container.innerHTML = result.data.movies.map(movie => `
          <div class="card" style="margin:10px 0;">
            <h3>${movie.title}</h3>
            <p>导演: ${movie.director} | 年份: ${movie.year} | 评分: ${movie.rating || '暂无'}</p>
            <button class="btn btn-primary" onclick="deleteMovie(${movie.id})">删除</button>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('加载电影列表失败:', error);
  }
}

// 删除电影
async function deleteMovie(movieId) {
  if (!confirm('确定要删除这部电影吗？')) {
    return;
  }

  try {
    const result = await adminAPI.deleteMovie(movieId);
    if (result.success) {
      alert('删除成功');
      await loadAdminMovies();
    } else {
      alert(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除电影失败:', error);
    alert('删除失败');
  }
}

// 添加类型
async function addGenre(event) {
  event.preventDefault();
  
  const data = {
    name: document.getElementById('genreName').value,
    description: document.getElementById('genreDescription').value || null
  };

  try {
    const result = await adminAPI.addGenre(data);
    if (result.success) {
      alert('添加类型成功');
      document.getElementById('addGenreForm').reset();
      await loadGenres();
      await loadAdminGenres();
    } else {
      alert(result.message || '添加失败');
    }
  } catch (error) {
    console.error('添加类型失败:', error);
    alert('添加失败');
  }
}

// 加载类型列表（管理后台）
async function loadAdminGenres() {
  try {
    const result = await movieAPI.getGenres();
    if (result.success) {
      const container = document.getElementById('adminGenreList');
      if (result.data.length === 0) {
        container.innerHTML = '<p>暂无类型</p>';
      } else {
        container.innerHTML = result.data.map(genre => `
          <div class="card" style="margin:10px 0;">
            <h3>${genre.name}</h3>
            <p>${genre.description || '暂无描述'}</p>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('加载类型列表失败:', error);
  }
}

// 加载用户列表
async function loadAdminUsers() {
  try {
    const result = await adminAPI.getUsers();
    if (result.success) {
      const container = document.getElementById('adminUserList');
      if (result.data.users.length === 0) {
        container.innerHTML = '<p>暂无用户</p>';
      } else {
        container.innerHTML = result.data.users.map(user => `
          <div class="card" style="margin:10px 0;">
            <h3>${user.username}</h3>
            <p>邮箱: ${user.email || '未设置'} | 手机: ${user.phone || '未设置'} | 角色: ${user.role}</p>
            <p>注册时间: ${new Date(user.created_at).toLocaleString()}</p>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
}

