import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : '');
const ENABLE_API_TIMING = import.meta.env.DEV || import.meta.env.VITE_API_TIMING === 'true';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_CACHE_TTL_MS = 30 * 1000;

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL. Set it to the deployed API base URL, e.g. https://your-render-service.onrender.com/api');
}

let cachedToken = null;
let cachedTokenExpiresAt = 0;
let cachedTokenUid = null;

const responseCache = new Map();
const inflightRequests = new Map();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCachedIdToken = async () => {
  const user = auth.currentUser;

  if (!user) {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
    cachedTokenUid = null;
    return null;
  }

  const now = Date.now();
  if (cachedToken && cachedTokenUid === user.uid && cachedTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS > now) {
    return cachedToken;
  }

  const tokenResult = await user.getIdTokenResult();
  cachedToken = tokenResult.token;
  cachedTokenUid = user.uid;
  cachedTokenExpiresAt = new Date(tokenResult.expirationTime).getTime();

  return cachedToken;
};

const stableStringify = (value) => {
  if (!value || typeof value !== 'object') return JSON.stringify(value || {});
  return JSON.stringify(Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = value[key];
    return acc;
  }, {}));
};

const cacheKey = (label, params) => `${label}:${stableStringify(params)}`;

const cachedRequest = async (key, requestFn, ttlMs = DEFAULT_CACHE_TTL_MS) => {
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    return { data: cached.data, cached: true };
  }

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const request = requestFn()
    .then((response) => {
      responseCache.set(key, {
        data: response.data,
        expiresAt: Date.now() + ttlMs,
      });
      return response;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
  return request;
};

const invalidateCache = (prefix) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
};

// Request interceptor — attach JWT token
api.interceptors.request.use(
  async (config) => {
    if (ENABLE_API_TIMING) {
      config.metadata = { start: performance.now() };
    }

    const token = await getCachedIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (ENABLE_API_TIMING && response.config.metadata?.start) {
      const duration = Math.round(performance.now() - response.config.metadata.start);
      console.debug(`[api] ${response.config.method?.toUpperCase()} ${response.config.url} ${duration}ms`);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      cachedToken = null;
      cachedTokenExpiresAt = 0;
      cachedTokenUid = null;
    }
    if (ENABLE_API_TIMING && error.config?.metadata?.start) {
      const duration = Math.round(performance.now() - error.config.metadata.start);
      console.debug(`[api] ${error.config.method?.toUpperCase()} ${error.config.url} failed after ${duration}ms`);
    }
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
  getByDate: (date) => cachedRequest(cacheKey('tasks:date', { date }), () => api.get(`/tasks`, { params: { date } }), 15_000),
  generateForDate: (date) => cachedRequest(cacheKey('tasks:generate', { date }), () => api.post('/tasks/generate', { date }), 60_000),
  create: async (data) => {
    const response = await api.post('/tasks', data);
    invalidateCache('tasks:');
    return response;
  },
  toggle: async (id) => {
    const response = await api.patch(`/tasks/${id}/toggle`);
    invalidateCache('tasks:');
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    invalidateCache('tasks:');
    return response;
  },
  getHistory: (month, year) => cachedRequest(cacheKey('tasks:history', { month, year }), () => api.get('/tasks/history', { params: { month, year } }), 60_000),
};

// ---- Todos API ----
export const todosAPI = {
  getAll: (params) => cachedRequest(cacheKey('todos:all', params), () => api.get('/todos', { params }), 30_000),
  create: async (data) => {
    const response = await api.post('/todos', data);
    invalidateCache('todos:');
    return response;
  },
  update: async (id, data) => {
    const response = await api.patch(`/todos/${id}`, data);
    invalidateCache('todos:');
    return response;
  },
  togglePhase: async (id, phaseIndex) => {
    const response = await api.patch(`/todos/${id}/phases/${phaseIndex}`);
    invalidateCache('todos:');
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/todos/${id}`);
    invalidateCache('todos:');
    return response;
  },
};

// ---- Habits API ----
export const habitsAPI = {
  getAll: (category) => cachedRequest(cacheKey('habits:all', { category }), () => api.get('/habits', { params: { category } }), 5 * 60_000),
  getById: (id) => cachedRequest(cacheKey('habits:id', { id }), () => api.get(`/habits/${id}`), 5 * 60_000),
  adopt: async (id) => {
    const response = await api.post(`/habits/${id}/adopt`);
    invalidateCache('habits:');
    invalidateCache('tasks:');
    return response;
  },
  unadopt: async (id) => {
    const response = await api.post(`/habits/${id}/unadopt`);
    invalidateCache('habits:');
    invalidateCache('tasks:');
    return response;
  },
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
  getAll: () => cachedRequest('friends:all', () => api.get('/friends'), 30_000),
  request: async (username) => {
    const response = await api.post('/friends/request', { username });
    invalidateCache('friends:');
    invalidateCache('notifications:');
    return response;
  },
  accept: async (friendId) => {
    const response = await api.post('/friends/accept', { friendId });
    invalidateCache('friends:');
    invalidateCache('notifications:');
    return response;
  },
  nudge: async (friendId) => {
    const response = await api.post('/friends/nudge', { friendId });
    invalidateCache('notifications:');
    return response;
  },
  getHistory: (id, month, year) => cachedRequest(cacheKey('friends:history', { id, month, year }), () => api.get(`/friends/${id}/history`, { params: { month, year } }), 60_000),
};

// ---- Notifications API ----
export const notificationsAPI = {
  getAll: () => cachedRequest('notifications:all', () => api.get('/notifications'), 15_000),
  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    invalidateCache('notifications:');
    return response;
  },
  markAllRead: async () => {
    const response = await api.patch('/notifications/read-all');
    invalidateCache('notifications:');
    return response;
  },
};

export default api;
