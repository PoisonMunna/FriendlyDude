// Resolve backend API base URL from server injection with automatic local development fallback
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isSameOrigin = window.location.port === '5000';
const serverApiBase = window.API_BASE_URL && window.API_BASE_URL !== '__API_BASE_URL__' ? window.API_BASE_URL : '';
const API_BASE_URL = serverApiBase || ((isLocalDev && !isSameOrigin) ? 'http://localhost:5000' : '');

// Generic fetch wrapper with error handling and credentials enabled for cookies
async function apiFetch(url, options = {}) {
  // Set credentials to 'include' so HTTP-only JWT cookies are sent/received automatically
  options.credentials = 'include';
  
  if (options.body && typeof options.body === 'object') {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    options.body = JSON.stringify(options.body);
  }

  try {
    const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(targetUrl, options);
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || `HTTP Error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Fetch Error [${url}]:`, err.message);
    throw err;
  }
}

export const Auth = {
  async register(username, email, password, bio) {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: { username, email, password, bio }
    });
  },

  async login(email, password) {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  async logout() {
    return apiFetch('/api/auth/logout', {
      method: 'POST'
    });
  },

  async getMe() {
    return apiFetch('/api/auth/me');
  }
};

export const Posts = {
  async getAll() {
    return apiFetch('/api/posts');
  },

  async getUserPosts(username) {
    return apiFetch(`/api/posts/user/${username}`);
  },

  async create(content) {
    return apiFetch('/api/posts', {
      method: 'POST',
      body: { content }
    });
  },

  async likePost(postId) {
    return apiFetch(`/api/posts/${postId}/like`, {
      method: 'PUT'
    });
  },

  async deletePost(postId) {
    return apiFetch(`/api/posts/${postId}`, {
      method: 'DELETE'
    });
  }
};

export const Comments = {
  async getComments(postId) {
    return apiFetch(`/api/posts/${postId}/comments`);
  },

  async createComment(postId, content) {
    return apiFetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: { content }
    });
  }
};

export const Users = {
  async getAll() {
    return apiFetch('/api/users');
  },

  async getProfile(username) {
    return apiFetch(`/api/users/profile/${username}`);
  },

  async updateBio(bio) {
    return apiFetch('/api/users/profile', {
      method: 'PUT',
      body: { bio }
    });
  },

  async followUser(userId) {
    return apiFetch(`/api/users/follow/${userId}`, {
      method: 'PUT'
    });
  }
};
