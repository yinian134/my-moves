/**
 * API调用封装
 * 所有与后端API交互的函数都写在这里
 */

const API_BASE_URL = '/api';

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // 如果已登录，添加token到请求头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    return { success: false, message: '网络错误，请检查连接' };
  }
}

// 电影相关API
const movieAPI = {
  // 获取电影列表
  getList: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/movies?${queryString}`);
  },

  // 获取电影详情
  getDetail: (id) => {
    return apiRequest(`/movies/${id}`);
  },

  // 获取类型列表
  getGenres: () => {
    return apiRequest('/movies/genres/list');
  },

  // 获取热门电影
  getHot: (limit = 10) => {
    return apiRequest(`/movies/hot/list?limit=${limit}`);
  }
};

// 用户相关API
const userAPI = {
  // 注册
  register: (data) => {
    return apiRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 登录
  login: (data) => {
    return apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 获取当前用户信息
  getMe: () => {
    return apiRequest('/users/me');
  },

  // 更新用户信息
  updateMe: (data) => {
    return apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // 获取收藏列表
  getWishlist: (status) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest(`/users/wishlist${query}`);
  }
};

// 评分相关API
const rateAPI = {
  // 添加评分
  add: (data) => {
    return apiRequest('/rates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 获取电影评论列表
  getList: (movieId, page = 1, limit = 20) => {
    return apiRequest(`/rates/movie/${movieId}?page=${page}&limit=${limit}`);
  },

  // 删除评论
  delete: (id) => {
    return apiRequest(`/rates/${id}`, {
      method: 'DELETE'
    });
  }
};

// 收藏相关API
const wishlistAPI = {
  // 添加收藏
  add: (data) => {
    return apiRequest('/wishlist', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 删除收藏
  delete: (movieId) => {
    return apiRequest(`/wishlist/${movieId}`, {
      method: 'DELETE'
    });
  },

  // 检查是否已收藏
  check: (movieId) => {
    return apiRequest(`/wishlist/check/${movieId}`);
  }
};

// 管理员相关API
const adminAPI = {
  // 添加电影
  addMovie: (data) => {
    return apiRequest('/admin/movies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 更新电影
  updateMovie: (id, data) => {
    return apiRequest(`/admin/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // 删除电影
  deleteMovie: (id) => {
    return apiRequest(`/admin/movies/${id}`, {
      method: 'DELETE'
    });
  },

  // 添加类型
  addGenre: (data) => {
    return apiRequest('/admin/genres', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 获取用户列表
  getUsers: (page = 1, limit = 20, role) => {
    const query = new URLSearchParams({ page, limit });
    if (role) query.append('role', role);
    return apiRequest(`/admin/users?${query.toString()}`);
  },

  // 获取统计数据
  getStats: () => {
    return apiRequest('/admin/stats');
  }
};

