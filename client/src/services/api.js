import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL. Set it to the deployed API base URL, e.g. https://your-render-service.onrender.com/api');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { auth } from '../config/firebase';

// Request interceptor — attach JWT token
api.interceptors.request.use(
  async (config) => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't force-redirect on 401 — let the AuthContext handle auth state.
    // A hard window.location.href redirect restarts Firebase auth listeners
    // and causes an infinite redirect loop between /auth and /dashboard.
    return Promise.reject(error);
  }
);

// ---- Auth API ----
export const authAPI = {
  // register and login are handled by Firebase SDK, but we still need register to create the MongoDB user
  register: (data, token) => api.post('/auth/register', data, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  googleLogin: (token) => api.post('/auth/google', {}, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  getMe: () => api.get('/auth/me'),
};

// ---- Tasks API ----
export const tasksAPI = {
  getByDate: (date) => api.get(`/tasks`, { params: { date } }),
  create: (data) => api.post('/tasks', data),
  toggle: (id) => api.patch(`/tasks/${id}/toggle`),
  delete: (id) => api.delete(`/tasks/${id}`),
  getHistory: (month, year) => api.get('/tasks/history', { params: { month, year } }),
};

// ---- Todos API ----
export const todosAPI = {
  getAll: (params) => api.get('/todos', { params }),
  create: (data) => api.post('/todos', data),
  update: (id, data) => api.patch(`/todos/${id}`, data),
  togglePhase: (id, phaseIndex) => api.patch(`/todos/${id}/phases/${phaseIndex}`),
  delete: (id) => api.delete(`/todos/${id}`),
};

// ---- Habits API ----
export const habitsAPI = {
  getAll: (category) => api.get('/habits', { params: { category } }),
  getById: (id) => api.get(`/habits/${id}`),
  adopt: (id) => api.post(`/habits/${id}/adopt`),
  unadopt: (id) => api.post(`/habits/${id}/unadopt`),
};

// ---- User API ----
export const userAPI = {
  updateProfile: (data) => api.patch('/user/profile', data),
  updateAvatar: (avatar) => api.patch('/user/avatar', { avatar }),
  updateTheme: (theme) => api.patch('/user/theme', { theme }),
  getStats: () => api.get('/user/stats'),
};

// ---- Friends API ----
export const friendsAPI = {
  getAll: () => api.get('/friends'),
  request: (username) => api.post('/friends/request', { username }),
  accept: (friendId) => api.post('/friends/accept', { friendId }),
  nudge: (friendId) => api.post('/friends/nudge', { friendId }),
  getHistory: (id, month, year) => api.get(`/friends/${id}/history`, { params: { month, year } }),
};

// ---- Notifications API ----
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export default api;
