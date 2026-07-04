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
    // If it's a dummy session, we don't need a real Firebase token
    const isDummy = localStorage.getItem('habitual_token') === 'dummy_token_12345';
    if (isDummy) {
      config.headers.Authorization = `Bearer dummy_token_12345`;
      return config;
    }

    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('habitual_token');
    // If it's the dummy token, don't trigger the logout loop
    if (token === 'dummy_token_12345') {
      console.log('Dummy mode: Ignored 401 error from backend');
      
      // Provide mock responses for dummy mode so UI doesn't crash
      const method = error.config?.method?.toLowerCase();
      const url = error.config?.url || '';

      if (url.includes('/tasks')) {
        if (method === 'post') {
          const payload = error.config.data ? JSON.parse(error.config.data) : {};
          return Promise.resolve({
            data: {
              task: {
                _id: 'dummy_' + Date.now(),
                title: payload.title || 'Dummy Task',
                date: payload.date || new Date().toISOString(),
                completed: false,
                isHabitGenerated: false
              }
            }
          });
        }
        if (method === 'get' && url.includes('history')) return Promise.resolve({ data: { history: [] } });
        if (method === 'get') return Promise.resolve({ data: { tasks: [] } });
        if (method === 'patch') {
           return Promise.resolve({ 
             data: { 
               task: { _id: url.split('/').slice(-2, -1)[0] || 'dummy', completed: true },
               reward: { coins: 10 },
               streakUpdate: { currentStreak: 1, longestStreak: 1 }
             } 
           });
        }
        if (method === 'delete') return Promise.resolve({ data: { success: true } });
      }

      if (url.includes('/todos')) {
        if (method === 'get') return Promise.resolve({ data: { todos: [] } });
        if (method === 'post' || method === 'patch') {
          return Promise.resolve({
            data: {
              todo: { _id: 'dummy_todo_' + Date.now(), title: 'Dummy Todo', currentPhase: 0, completed: false, phases: [] }
            }
          });
        }
        if (method === 'delete') return Promise.resolve({ data: { success: true } });
      }

      if (url.includes('/habits')) {
        if (method === 'get') return Promise.resolve({ data: { habits: [] } });
        if (method === 'post') return Promise.resolve({ data: { message: 'Action completed in dummy mode' } });
      }

      if (url.includes('/user')) {
        if (method === 'get') return Promise.resolve({ data: { stats: {} } });
        if (method === 'patch') return Promise.resolve({ data: { user: { coins: 100, currentStreak: 1, longestStreak: 1 } } });
      }

      // Default fake response or reject
      return Promise.reject(error); 
    }

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
