/**
 * 电影详情页JavaScript
 */

let currentMovieId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 获取电影ID
  const urlParams = new URLSearchParams(window.location.search);
  currentMovieId = urlParams.get('id');

  if (!currentMovieId) {
    alert('电影ID不存在');
    window.location.href = '/';
    return;
  }

  await loadMovieDetail();
  await loadComments();
  
  // 如果已登录，显示评论表单
  if (localStorage.getItem('token')) {
    document.getElementById('commentForm').style.display = 'block';
    await checkWishlist();
  }
});

// 加载电影详情
async function loadMovieDetail() {
  try {
    const result = await movieAPI.getDetail(currentMovieId);
    if (result.success) {
      const movie = result.data;
      displayMovieDetail(movie);
      
      // 显示推荐电影
      if (movie.recommendations && movie.recommendations.length > 0) {
        const container = document.getElementById('recommendations');
        container.innerHTML = movie.recommendations.map(m => createMovieCard(m)).join('');
      }
    } else {
      alert('加载电影详情失败');
      window.location.href = '/';
    }
  } catch (error) {
    console.error('加载电影详情失败:', error);
  }
}

// 显示电影详情
function displayMovieDetail(movie) {
  const container = document.getElementById('movieDetail');
  const poster = movie.poster || 'https://via.placeholder.com/300x450?text=No+Poster';
  const rating = movie.rating ? movie.rating.toFixed(1) : '暂无评分';
  
  container.innerHTML = `
    <div class="movie-detail-header">
      <div class="movie-detail-poster">
        <img src="${poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
      </div>
      <div class="movie-detail-info">
        <h1>${movie.title}</h1>
        <p><strong>类型：</strong>${movie.genre_name || '未知'}</p>
        <p><strong>导演：</strong>${movie.director || '未知'}</p>
        <p><strong>演员：</strong>${movie.actors || '未知'}</p>
        <p><strong>地区：</strong>${movie.region || '未知'}</p>
        <p><strong>年份：</strong>${movie.year || '未知'}</p>
        <p><strong>时长：</strong>${movie.duration ? movie.duration + '分钟' : '未知'}</p>
        <p><strong>评分：</strong><span class="movie-card-rating">⭐ ${rating}</span> (${movie.ratingCount || 0}人评价)</p>
        <p><strong>观看次数：</strong>${movie.views || 0}</p>
        <div class="movie-detail-actions">
          <button class="btn btn-primary" id="wishBtn" onclick="toggleWishlist()">添加到收藏</button>
          ${movie.video_url ? `<button class="btn btn-primary" onclick="watchMovie('${movie.video_url}')">立即观看</button>` : ''}
        </div>
        <div style="margin-top:20px;">
          <h3>剧情简介</h3>
          <p>${movie.description || '暂无简介'}</p>
        </div>
      </div>
    </div>
  `;
}

// 加载评论
async function loadComments() {
  try {
    const result = await rateAPI.getList(currentMovieId);
    if (result.success) {
      const container = document.getElementById('commentsList');
      if (result.data.rates.length === 0) {
        container.innerHTML = '<p>暂无评论</p>';
      } else {
        container.innerHTML = result.data.rates.map(rate => createCommentItem(rate)).join('');
      }
    }
  } catch (error) {
    console.error('加载评论失败:', error);
  }
}

// 创建评论项
function createCommentItem(rate) {
  return `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-author">${rate.username || '匿名用户'}</span>
        <span class="comment-rating">⭐ ${rate.rating}</span>
      </div>
      <div class="comment-content">${rate.comment || '无评论内容'}</div>
      <div style="color:#999;font-size:0.9rem;margin-top:10px;">
        ${new Date(rate.created_at).toLocaleString()}
      </div>
    </div>
  `;
}

// 提交评论
async function submitComment() {
  if (!localStorage.getItem('token')) {
    alert('请先登录');
    window.location.href = '/login.html';
    return;
  }

  const rating = document.getElementById('ratingSelect').value;
  const comment = document.getElementById('commentText').value;

  try {
    const result = await rateAPI.add({
      movieId: currentMovieId,
      rating: parseInt(rating),
      comment: comment || null
    });

    if (result.success) {
      alert('评论成功');
      document.getElementById('commentText').value = '';
      await loadMovieDetail();
      await loadComments();
    } else {
      alert(result.message || '评论失败');
    }
  } catch (error) {
    console.error('提交评论失败:', error);
    alert('评论失败');
  }
}

// 检查收藏状态
async function checkWishlist() {
  try {
    const result = await wishlistAPI.check(currentMovieId);
    if (result.success) {
      const wishBtn = document.getElementById('wishBtn');
      if (wishBtn) {
        if (result.data.isWished) {
          wishBtn.textContent = '已收藏';
          wishBtn.onclick = () => removeWishlist();
        } else {
          wishBtn.textContent = '添加到收藏';
          wishBtn.onclick = () => toggleWishlist();
        }
      }
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error);
  }
}

// 切换收藏
async function toggleWishlist() {
  if (!localStorage.getItem('token')) {
    alert('请先登录');
    window.location.href = '/login.html';
    return;
  }

  try {
    const result = await wishlistAPI.add({
      movieId: currentMovieId,
      status: 'favorite'
    });

    if (result.success) {
      alert('收藏成功');
      await checkWishlist();
    } else {
      alert(result.message || '收藏失败');
    }
  } catch (error) {
    console.error('收藏失败:', error);
  }
}

// 取消收藏
async function removeWishlist() {
  try {
    const result = await wishlistAPI.delete(currentMovieId);
    if (result.success) {
      alert('取消收藏成功');
      await checkWishlist();
    }
  } catch (error) {
    console.error('取消收藏失败:', error);
  }
}

// 观看电影
function watchMovie(videoUrl) {
  window.open(videoUrl, '_blank');
}

// 创建电影卡片（用于推荐）
function createMovieCard(movie) {
  const poster = movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster';
  return `
    <div class="movie-card" onclick="goToMovieDetail(${movie.id})">
      <img src="${poster}" alt="${movie.title}">
      <div class="movie-card-body">
        <div class="movie-card-title">${movie.title}</div>
      </div>
    </div>
  `;
}

// 跳转到详情页
function goToMovieDetail(movieId) {
  window.location.href = `/movie-detail.html?id=${movieId}`;
}

