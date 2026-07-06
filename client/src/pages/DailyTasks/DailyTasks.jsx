import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { tasksAPI, todosAPI } from '../../services/api';
import './DailyTasks.css';

export default function DailyTasks() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarMonthDate, setCalendarMonthDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const { showNotification } = useNotification();
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async (date) => {
    try {
      const res = await tasksAPI.getByDate(date);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      showNotification({ message: 'Failed to load tasks', type: 'error' });
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await tasksAPI.getHistory(calendarMonthDate.getMonth() + 1, calendarMonthDate.getFullYear());
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchTodos = async () => {
    try {
      const res = await todosAPI.getAll();
      setTodos(res.data.todos || []);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(selectedDate), fetchHistory(), fetchTodos()]);
      setLoading(false);
    };
    init();
  }, [selectedDate, calendarMonthDate]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || isAdding) return;

    try {
      setIsAdding(true);
      const res = await tasksAPI.create({ title: newTask.trim(), date: selectedDate });
      setTasks([...tasks, res.data.task]);
      setNewTask('');
      inputRef.current?.focus();
      showNotification({ message: 'Task added successfully', type: 'success' });
    } catch (err) {
      console.error('Error creating task:', err);
      const msg = err.response ? `API Error ${err.response.status}` : err.message;
      showNotification({ message: `Failed to add task: ${msg}`, type: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (taskId) => {
    try {
      const res = await tasksAPI.toggle(taskId);
      setTasks(tasks.map(t => t._id === taskId ? res.data.task : t));

      // Update user streak in auth context
      if (res.data.task.completed) {
        if (res.data.reward) {
          updateUser({
            coins: res.data.reward.totalCoins || res.data.reward.coins,
          });
        }
        if (res.data.streakUpdate) {
          updateUser({
            currentStreak: res.data.streakUpdate.currentStreak,
            longestStreak: res.data.streakUpdate.longestStreak,
          });
        }
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const navigateDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const navigateMonth = (offset) => {
    const d = new Date(calendarMonthDate);
    d.setMonth(d.getMonth() + offset);
    setCalendarMonthDate(d);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calendar heatmap data based on calendarMonthDate
  const daysInMonth = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), 1).getDay();

  const getHistoryForDay = (day) => {
    const dateStr = `${calendarMonthDate.getFullYear()}-${String(calendarMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return history.find(h => h.date === dateStr);
  };

  return (
    <div className="daily-tasks">
      <div className="tasks-main">
        {/* Header */}
        <div className="tasks-header animate-fade-in-up">
          <h1>Daily Tasks</h1>
          <p className="tasks-subtitle">Build your daily routine, one task at a time</p>
        </div>

        {/* Date Navigator */}
        <div className="date-nav glass-card animate-fade-in-up">
          <button className="btn-ghost date-nav-btn" onClick={() => navigateDate(-1)}>
            ←
          </button>
          <div className="date-nav-center">
            <span className="date-nav-label">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {isToday && <span className="badge badge-info">Today</span>}
          </div>
          <button className="btn-ghost date-nav-btn" onClick={() => navigateDate(1)}>
            →
          </button>
        </div>

        {/* Add Task */}
        <form className="add-task-form animate-fade-in-up" onSubmit={handleAddTask}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="add-task-input"
          />
          <button type="submit" className="btn-primary add-task-btn" disabled={!newTask.trim()}>
            <span>Add</span>
          </button>
        </form>

        {/* Progress */}
        {total > 0 && (
          <div className="tasks-progress animate-fade-in-up">
            <div className="tasks-progress-info">
              <span>{completed} of {total} completed</span>
              <span className="tasks-progress-percent">{percent}%</span>
            </div>
            <div className="tasks-progress-bar">
              <div className="tasks-progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}

        {/* Deadlines Section */}
        {todos.filter(todo => todo.deadline && todo.deadline.split('T')[0] === selectedDate).length > 0 && (
          <div className="deadlines-section animate-fade-in-up" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--sun-deep)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              ⚠️ Deadlines Today
            </h3>
            <div className="task-list stagger-children">
              {todos.filter(todo => todo.deadline && todo.deadline.split('T')[0] === selectedDate).map(todo => (
                <div 
                  key={todo._id} 
                  className={`task-item glass-card ${todo.completed ? 'task-completed' : ''}`}
                  onClick={() => navigate('/todos')}
                  style={{ cursor: 'pointer' }}
                  title="Click to view To-Do details"
                >
                  <div className="task-checkbox" style={{ visibility: 'hidden' }}></div>
                  <span className={`task-title ${todo.completed ? 'task-title-done' : ''}`} style={{ fontWeight: 'var(--weight-semibold)' }}>
                    {todo.title}
                  </span>
                  <span className="badge badge-warning">Project Deadline</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="task-list stagger-children">
          {loading ? (
            <div className="tasks-loading">
              <div className="loading-spinner" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="tasks-empty glass-card">
              <span className="tasks-empty-icon">✨</span>
              <h3>No tasks for this day</h3>
              <p>Add your first task above to get started!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className={`task-item glass-card ${task.completed ? 'task-completed' : ''}`}>
                <button
                  className={`task-checkbox ${task.completed ? 'task-checkbox-checked' : ''}`}
                  onClick={() => handleToggle(task._id)}
                  aria-label={`Toggle ${task.title}`}
                >
                  {task.completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className={`task-title ${task.completed ? 'task-title-done' : ''}`}>
                  {task.title}
                </span>
                {task.isHabitGenerated && (
                  <span className="task-habit-badge" title="From Better Habits">🌱</span>
                )}
                <button
                  className="task-delete-btn"
                  onClick={() => handleDelete(task._id)}
                  aria-label={`Delete ${task.title}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar: Calendar Heatmap */}
      <aside className="tasks-sidebar">
        <div className="heatmap-card glass-card animate-fade-in-up">
          <div className="heatmap-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button className="btn-ghost" onClick={() => navigateMonth(-1)} style={{ padding: '0.25rem 0.5rem' }}>←</button>
            <h3 className="heatmap-title" style={{ margin: 0, fontSize: '1rem', flex: 1, textAlign: 'center' }}>
              {calendarMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button className="btn-ghost" onClick={() => navigateMonth(1)} style={{ padding: '0.25rem 0.5rem' }}>→</button>
          </div>
          <div className="heatmap">
            <div className="heatmap-header">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="heatmap-day-label">{d}</span>
              ))}
            </div>
            <div className="heatmap-grid">
              {Array.from({ length: firstDay }, (_, i) => (
                <span key={`e-${i}`} className="heatmap-cell heatmap-empty" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayDate = `${calendarMonthDate.getFullYear()}-${String(calendarMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dayDate === selectedDate;
                
                const realNow = new Date();
                const isCurrentDay = day === realNow.getDate() && 
                                     calendarMonthDate.getMonth() === realNow.getMonth() && 
                                     calendarMonthDate.getFullYear() === realNow.getFullYear();
                                     
                const h = getHistoryForDay(day);
                const rate = h?.rate || 0;

                let level = '';
                if (h) {
                  if (rate >= 100) level = 'heat-4';
                  else if (rate >= 75) level = 'heat-3';
                  else if (rate >= 50) level = 'heat-2';
                  else if (rate > 0) level = 'heat-1';
                  else level = 'heat-0';
                }

                return (
                  <button
                    key={day}
                    className={`heatmap-cell ${level} ${isSelected ? 'heatmap-selected' : ''} ${isCurrentDay ? 'heatmap-today' : ''}`}
                    onClick={() => setSelectedDate(dayDate)}
                    title={h ? `${h.completed}/${h.total} (${rate}%)` : `Day ${day}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="heatmap-legend">
            <span className="heatmap-legend-label">Less</span>
            <span className="heatmap-legend-cell heat-0" />
            <span className="heatmap-legend-cell heat-1" />
            <span className="heatmap-legend-cell heat-2" />
            <span className="heatmap-legend-cell heat-3" />
            <span className="heatmap-legend-cell heat-4" />
            <span className="heatmap-legend-label">More</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats glass-card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <h3>Your Stats</h3>
          <div className="quick-stat-item">
            <span className="quick-stat-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            <span className="quick-stat-label">Consecutive Days</span>
            <span className="quick-stat-value">{user?.currentStreak || 0} days</span>
          </div>
          <div className="quick-stat-item">
            <span className="quick-stat-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </span>
            <span className="quick-stat-label">Personal Best</span>
            <span className="quick-stat-value">{user?.longestStreak || 0} days</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
