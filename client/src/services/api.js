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

// Simple in-memory store for Dummy Mode to persist state during the session
const dummyStore = {
  tasks: [],
  todos: [],
  habits: [
    { _id: 'h1', title: 'Drink Water', icon: '💧', category: 'health', adopted: false },
    { _id: 'h2', title: 'Read 10 Pages', icon: '📚', category: 'mind', adopted: false },
    { _id: 'h3', title: 'Meditate', icon: '🧘', category: 'mind', adopted: true } // one adopted for testing
  ],
};

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('habitual_token');
    // If it's the dummy token, don't trigger the logout loop
    if (token === 'dummy_token_12345') {
      console.log('Dummy mode: Ignored 401 error from backend');
      
      const method = error.config?.method?.toLowerCase();
      const url = error.config?.url || '';

      if (url.includes('/tasks')) {
        if (method === 'post') {
          const payload = error.config.data ? JSON.parse(error.config.data) : {};
          const newTask = {
            _id: 'dummy_' + Date.now(),
            title: payload.title || 'Dummy Task',
            date: payload.date || new Date().toISOString(),
            completed: false,
            isHabitGenerated: payload.isHabitGenerated || false,
            habitId: payload.habitId || undefined
          };
          dummyStore.tasks.push(newTask);
          return Promise.resolve({ data: { task: newTask } });
        }
        
        if (method === 'get' && url.includes('history')) return Promise.resolve({ data: { history: [] } });
        
        if (method === 'get') {
          // Parse date from URL params: e.g. /tasks?date=2026-07-04
          const match = url.match(/date=([^&]+)/);
          const reqDateStr = match ? match[1].split('T')[0] : new Date().toISOString().split('T')[0];
          
          let dayTasks = dummyStore.tasks.filter(t => t.date.startsWith(reqDateStr));
          
          // Auto-spawn missing habits (like the backend fix)
          const adoptedHabits = dummyStore.habits.filter(h => h.adopted);
          const existingHabitIds = dayTasks.filter(t => t.isHabitGenerated).map(t => t.habitId);
          
          let newHabitTasks = [];
          for (const habit of adoptedHabits) {
            if (!existingHabitIds.includes(habit._id)) {
              const hTask = {
                _id: 'dummy_' + Date.now() + Math.random(),
                title: `${habit.icon} ${habit.title}`,
                date: reqDateStr + 'T12:00:00.000Z',
                completed: false,
                isHabitGenerated: true,
                habitId: habit._id
              };
              dummyStore.tasks.push(hTask);
              newHabitTasks.push(hTask);
            }
          }
          
          dayTasks = [...dayTasks, ...newHabitTasks];
          return Promise.resolve({ data: { tasks: dayTasks } });
        }
        
        if (method === 'patch') {
           const id = url.split('/').slice(-2, -1)[0];
           const task = dummyStore.tasks.find(t => t._id === id);
           if (task) task.completed = !task.completed;
           
           return Promise.resolve({ 
             data: { 
               task: task || { _id: id || 'dummy', completed: true },
               reward: { coins: 10 },
               streakUpdate: { currentStreak: 1, longestStreak: 1 }
             } 
           });
        }
        if (method === 'delete') {
           const id = url.split('/').pop();
           dummyStore.tasks = dummyStore.tasks.filter(t => t._id !== id);
           return Promise.resolve({ data: { success: true } });
        }
      }

      if (url.includes('/todos')) {
        if (method === 'get') return Promise.resolve({ data: { todos: dummyStore.todos } });
        if (method === 'post') {
          const payload = error.config.data ? JSON.parse(error.config.data) : {};
          const newTodo = { ...payload, _id: 'dummy_todo_' + Date.now(), currentPhase: 0, completed: false, phases: payload.phases || [] };
          dummyStore.todos.push(newTodo);
          return Promise.resolve({ data: { todo: newTodo } });
        }
        if (method === 'patch') {
           const id = url.split('/').pop() || url.split('/').slice(-3, -2)[0]; // naive parsing
           const todo = dummyStore.todos.find(t => t._id === id);
           if (todo) {
             const payload = error.config.data ? JSON.parse(error.config.data) : {};
             Object.assign(todo, payload);
           }
           return Promise.resolve({ data: { todo: todo || {} } });
        }
        if (method === 'delete') {
           const id = url.split('/').pop();
           dummyStore.todos = dummyStore.todos.filter(t => t._id !== id);
           return Promise.resolve({ data: { success: true } });
        }
      }

      if (url.includes('/habits')) {
        if (method === 'get') return Promise.resolve({ data: { habits: dummyStore.habits } });
        if (method === 'post' && url.includes('adopt')) {
           const id = url.split('/').slice(-2, -1)[0];
           const habit = dummyStore.habits.find(h => h._id === id);
           if (habit) habit.adopted = true;
           return Promise.resolve({ data: { message: 'Habit adopted in dummy mode', habit } });
        }
        if (method === 'post' && url.includes('unadopt')) {
           const id = url.split('/').slice(-2, -1)[0];
           const habit = dummyStore.habits.find(h => h._id === id);
           if (habit) habit.adopted = false;
           return Promise.resolve({ data: { message: 'Habit removed in dummy mode' } });
        }
      }

      if (url.includes('/user')) {
        if (method === 'get') return Promise.resolve({ data: { stats: {} } });
        if (method === 'patch') {
          const payload = error.config.data ? JSON.parse(error.config.data) : {};
          if (url.includes('/avatar')) {
            return Promise.resolve({ data: { user: { avatar: payload.avatar } } });
          }
          if (url.includes('/theme')) {
            return Promise.resolve({ data: { user: { activeTheme: payload.theme } } });
          }
          if (url.includes('/profile')) {
            return Promise.resolve({ data: { user: payload } });
          }
          return Promise.resolve({ data: { user: { coins: 100, currentStreak: 1, longestStreak: 1 } } });
        }
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
