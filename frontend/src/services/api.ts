import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and redirect to login (but not if already on auth pages)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      
      // Only redirect if not already on an auth page
      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data.data),
  register: (data: { email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data.data),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsApi = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/posts?page=${page}&limit=${limit}`).then((r) => r.data.data),
  create: (data: { title: string; content: string }) =>
    api.post('/posts', data).then((r) => r.data.data),
  update: (id: string, data: { title?: string; content?: string }) =>
    api.put(`/posts/${id}`, data).then((r) => r.data.data),
  delete: (id: string) =>
    api.delete(`/posts/${id}`).then((r) => r.data.data),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsApi = {
  getByPost: (postId: string, page = 1, limit = 5) =>
    api.get(`/comments/post/${postId}?page=${page}&limit=${limit}`).then((r) => r.data.data),
  create: (data: { content: string; postId: string }) =>
    api.post('/comments', data).then((r) => r.data.data),
  delete: (id: string) =>
    api.delete(`/comments/${id}`).then((r) => r.data.data),
};

// ── Users (admin only) ────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/users?page=${page}&limit=${limit}`).then((r) => r.data.data),
  delete: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data.data),
};

export default api;
