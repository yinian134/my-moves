/**
 * 用户认证相关功能
 * 处理登录状态、token管理等
 */

// 检查用户是否已登录
function checkAuth() {
  const token = localStorage.getItem('token');
  const userInfo = localStorage.getItem('userInfo');

  if (token && userInfo) {
    try {
      const user = JSON.parse(userInfo);
      updateNavbar(user);
      return true;
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      return false;
    }
  }
  return false;
}

// 更新导航栏（根据登录状态显示/隐藏菜单）
function updateNavbar(user) {
  const loginLink = document.getElementById('loginLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const userLink = document.getElementById('userLink');
  const adminLink = document.getElementById('adminLink');

  if (user) {
    if (loginLink) loginLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userLink) userLink.style.display = 'block';
    
    // 如果是管理员，显示管理后台链接
    if (user.role === 'admin' && adminLink) {
      adminLink.style.display = 'block';
    }
  } else {
    if (loginLink) loginLink.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userLink) userLink.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

// 退出登录
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  window.location.href = '/';
}

// 验证管理员权限
function checkAdmin() {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    window.location.href = '/login.html';
    return false;
  }

  try {
    const user = JSON.parse(userInfo);
    if (user.role !== 'admin') {
      alert('需要管理员权限');
      window.location.href = '/';
      return false;
    }
    return true;
  } catch (e) {
    window.location.href = '/login.html';
    return false;
  }
}

// 需要登录才能访问的页面，检查登录状态
function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// 页面加载时检查登录状态
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  });
}

