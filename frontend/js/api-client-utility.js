// API Client for Bridge Frontend
// This module handles all API calls to the backend

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('bridgeAuthToken');
}

// Helper function to make authenticated requests
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

// Auth API
const authAPI = {
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('bridgeAuthToken', data.token);
      localStorage.setItem('bridgeUser', JSON.stringify(data.user));
    }
    
    return data;
  },

  async verifyEmail(token) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`);
    return response.json();
  },

  logout() {
    localStorage.removeItem('bridgeAuthToken');
    localStorage.removeItem('bridgeUser');
    window.location.href = '/index.html';
  },

  isLoggedIn() {
    return !!getAuthToken();
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('bridgeUser');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Posts API
const postsAPI = {
  async getTrending(limit = 20, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/posts/trending?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async getExplore(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/posts/explore?${queryParams}`);
    return response.json();
  },

  async getPost(id) {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`);
    return response.json();
  },

  async createPost(postData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/posts`, {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    return response.json();
  },

  async updatePost(id, postData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
    return response.json();
  },

  async deletePost(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async likePost(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/posts/${id}/like`, {
      method: 'POST',
    });
    return response.json();
  },

  async getUserPosts(userId, limit = 20, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/posts/user/${userId}?limit=${limit}&offset=${offset}`);
    return response.json();
  },
};

// Comments API
const commentsAPI = {
  async getComments(postId, limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/comments/post/${postId}?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async createComment(postId, content) {
    const response = await fetchWithAuth(`${API_BASE_URL}/comments/post/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async updateComment(id, content) {
    const response = await fetchWithAuth(`${API_BASE_URL}/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async deleteComment(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/comments/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Users API
const usersAPI = {
  async getProfile(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return response.json();
  },

  async getMyProfile() {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/me/profile`);
    return response.json();
  },

  async updateProfile(profileData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/me/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.json();
  },

  async followUser(userId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}/follow`, {
      method: 'POST',
    });
    return response.json();
  },

  async getFollowers(userId, limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/followers?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async getFollowing(userId, limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/following?limit=${limit}&offset=${offset}`);
    return response.json();
  },
};

// AI Agent API
const aiAPI = {
  async chat(message, postId = null) {
    const response = await fetchWithAuth(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, postId }),
    });
    return response.json();
  },

  async getConversation(conversationId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/ai/conversation/${conversationId}`);
    return response.json();
  },

  async getConversations(limit = 20, offset = 0) {
    const response = await fetchWithAuth(`${API_BASE_URL}/ai/conversations?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async deleteConversation(conversationId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/ai/conversation/${conversationId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Export all APIs
const BridgeAPI = {
  auth: authAPI,
  posts: postsAPI,
  comments: commentsAPI,
  users: usersAPI,
  ai: aiAPI,
};