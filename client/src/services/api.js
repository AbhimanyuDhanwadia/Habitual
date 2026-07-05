import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

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
    if (error.response?.status === 401) {
      // With Firebase, session state is managed by Firebase Auth, so we don't necessarily need to clear anything manually here,
      // but we can force a redirect.
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth API ----
export const authAPI = {
  // register and login are handled by Firebase SDK, but we still need register to create the MongoDB user
  register: (data) => api.post('/auth/register', data),
  googleLogin: () => api.post('/auth/google'),
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
