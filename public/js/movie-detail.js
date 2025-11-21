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
  const rating = movie.rating != null && !isNaN(movie.rating)
    ? Number(movie.rating).toFixed(1)
    : '暂无评分';
  
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
        </div>
        <div style="margin-top:20px;">
          <h3>剧情简介</h3>
          <p>${movie.description || '暂无简介'}</p>
        </div>
      </div>
    </div>
    <div class="movie-player-section">
      <h3>📺 在线观看</h3>
      <div id="videoPlayerContainer">
        ${renderVideoPlayer(movie)}
      </div>
    </div>
  `;

  initializeVideoPlayer(movie);
}

function renderVideoPlayer(movie) {
  const rawUrl = (movie.video_url || '').trim();

  if (!rawUrl) {
    return '<p class="player-empty">暂无播放源，请在后台上传或填写完整影片地址。</p>';
  }

  if (isYouTubeUrl(rawUrl)) {
    const embedUrl = normalizeYouTubeUrl(rawUrl);
    return `
      <div class="video-iframe">
        <iframe 
          src="${escapeHtml(embedUrl)}" 
          title="在线视频播放器"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen>
        </iframe>
      </div>
      <p class="player-tip">当前播放资源来自外部平台，如需完整正片，可在后台为该影片配置本地视频地址。</p>
    `;
  }

  if (isHlsSource(rawUrl)) {
    const playerId = getVideoElementId(movie.id);
    const posterAttr = movie.poster ? ` poster="${escapeHtml(movie.poster)}"` : '';
    return `<video id="${playerId}" class="movie-player" controls playsinline${posterAttr}></video>`;
  }

  const posterAttr = movie.poster ? ` poster="${escapeHtml(movie.poster)}"` : '';
  const mimeType = getVideoMimeType(rawUrl);
  const typeAttr = mimeType ? ` type="${mimeType}"` : '';

  return `
    <video class="movie-player" controls playsinline${posterAttr}>
      <source src="${escapeHtml(rawUrl)}"${typeAttr}>
      您的浏览器不支持 HTML5 视频播放，请尝试下载后观看。
    </video>
  `;
}

function initializeVideoPlayer(movie) {
  const videoUrl = (movie.video_url || '').trim();
  if (!videoUrl || !isHlsSource(videoUrl)) {
    // 为非HLS视频添加错误处理
    if (videoUrl && !isYouTubeUrl(videoUrl)) {
      const videoElements = document.querySelectorAll('.movie-player');
      videoElements.forEach(video => {
        video.addEventListener('error', (e) => {
          handleVideoError(e, video, videoUrl);
        });
        video.addEventListener('loadstart', () => {
          showLoadingMessage(video);
        });
        video.addEventListener('canplay', () => {
          hideLoadingMessage(video);
        });
      });
    }
    return;
  }

  const playerId = getVideoElementId(movie.id);
  const videoElement = document.getElementById(playerId);
  if (!videoElement) return;

  if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = videoUrl;
    videoElement.addEventListener('error', (e) => handleVideoError(e, videoElement, videoUrl));
    return;
  }

  if (window.Hls && window.Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false
    });
    
    hls.loadSource(videoUrl);
    hls.attachMedia(videoElement);
    
    // HLS错误处理
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            showPlayerError(videoElement, '网络错误，无法加载视频。请检查网络连接或稍后重试。');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            showPlayerError(videoElement, '视频格式错误或文件损坏。');
            hls.recoverMediaError();
            break;
          default:
            showPlayerError(videoElement, '播放器错误，请刷新页面重试。');
            hls.destroy();
            break;
        }
      }
    });
    
    videoElement.addEventListener('error', (e) => handleVideoError(e, videoElement, videoUrl));
    return;
  }

  const fallback = document.createElement('p');
  fallback.className = 'player-empty';
  fallback.textContent = '当前浏览器不支持在线播放该视频，请更换支持HLS的浏览器或下载影片观看。';
  videoElement.replaceWith(fallback);
}

function getVideoElementId(movieId) {
  return `movie-player-${movieId || 'current'}`;
}

function isYouTubeUrl(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

function normalizeYouTubeUrl(url) {
  if (url.includes('embed')) return url;
  if (url.includes('watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'www.youtube.com/embed/');
  }
  return url;
}

function isHlsSource(url) {
  return /\.m3u8(\?.*)?$/i.test(url);
}

function getVideoMimeType(url) {
  if (/\.mp4(\?.*)?$/i.test(url)) return 'video/mp4';
  if (/\.webm(\?.*)?$/i.test(url)) return 'video/webm';
  if (/\.ogg(\?.*)?$/i.test(url) || /\.ogv(\?.*)?$/i.test(url)) return 'video/ogg';
  return '';
}

function escapeHtml(text) {
  return text
    ? text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    : '';
}

// 处理视频播放错误
function handleVideoError(event, videoElement, videoUrl) {
  const error = videoElement.error;
  let errorMessage = '视频加载失败';
  
  if (error) {
    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        errorMessage = '视频加载被中止，请重试';
        break;
      case error.MEDIA_ERR_NETWORK:
        errorMessage = '网络错误，无法加载视频。请检查网络连接';
        break;
      case error.MEDIA_ERR_DECODE:
        errorMessage = '视频解码失败，文件可能已损坏';
        break;
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = '不支持的视频格式或视频源不可用';
        break;
      default:
        errorMessage = '视频播放出错，请刷新页面重试';
    }
  }
  
  showPlayerError(videoElement, errorMessage, videoUrl);
}

// 显示播放器错误
function showPlayerError(videoElement, message, videoUrl = null) {
  const container = videoElement.parentElement;
  const errorDiv = document.createElement('div');
  errorDiv.className = 'player-error';
  errorDiv.innerHTML = `
    <p style="color: #e74c3c; font-weight: bold; margin-bottom: 10px;">⚠️ ${message}</p>
    ${videoUrl ? `<p style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">视频地址: <code>${escapeHtml(videoUrl)}</code></p>` : ''}
    <button class="btn btn-primary" onclick="location.reload()" style="margin-right: 10px;">刷新页面</button>
    ${videoUrl && !videoUrl.includes('youtube.com') ? `<a href="${escapeHtml(videoUrl)}" class="btn btn-primary" download>下载视频</a>` : ''}
  `;
  
  videoElement.style.display = 'none';
  container.appendChild(errorDiv);
}

// 显示加载提示
function showLoadingMessage(videoElement) {
  const container = videoElement.parentElement;
  let loadingDiv = container.querySelector('.player-loading');
  if (!loadingDiv) {
    loadingDiv = document.createElement('div');
    loadingDiv.className = 'player-loading';
    loadingDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">正在加载视频...</p>';
    container.insertBefore(loadingDiv, videoElement);
  }
}

// 隐藏加载提示
function hideLoadingMessage(videoElement) {
  const container = videoElement.parentElement;
  const loadingDiv = container.querySelector('.player-loading');
  if (loadingDiv) {
    loadingDiv.remove();
  }
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
        ${rate.created_at ? new Date(rate.created_at).toLocaleString() : ''}
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

