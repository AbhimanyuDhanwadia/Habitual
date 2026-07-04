import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tasksAPI, todosAPI } from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [tasksRes, todosRes, historyRes] = await Promise.all([
          tasksAPI.getByDate(today),
          todosAPI.getAll({ completed: false }),
          tasksAPI.getHistory(new Date().getMonth() + 1, new Date().getFullYear()),
        ]);
        setTasks(tasksRes.data.tasks || []);
        setTodos(todosRes.data.todos || []);
        setTaskHistory(historyRes.data.history || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedToday = tasks.filter(t => t.completed).length;
  const totalToday = tasks.length;
  const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Get urgent todos (deadline within 3 days)
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const urgentTodos = todos
    .filter(t => t.deadline && new Date(t.deadline) <= threeDaysFromNow)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  // Generate mini calendar data
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const getHistoryForDay = (day) => {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return taskHistory.find(h => h.date === dateStr);
  };

  const greeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Greeting Header */}
      <div className="dash-header animate-fade-in-up">
        <div>
          <h1 className="dash-greeting">{greeting()}, <span className="gradient-text">{user?.firstName}</span></h1>
          <p className="dash-date">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="dash-stats stagger-children">
        <div className="dash-stat-card glass-card">
          <div className="stat-icon stat-icon-streak">📅</div>
          <div className="stat-info">
            <span className="stat-value">{user?.currentStreak || 0}</span>
            <span className="stat-label">Consecutive Days</span>
          </div>
        </div>
        <div className="dash-stat-card glass-card">
          <div className="stat-icon stat-icon-tasks">✅</div>
          <div className="stat-info">
            <span className="stat-value">{completedToday}/{totalToday}</span>
            <span className="stat-label">Today's Tasks</span>
          </div>
        </div>
        <div className="dash-stat-card glass-card">
          <div className="stat-icon stat-icon-percent">📊</div>
          <div className="stat-info">
            <span className="stat-value">{completionPercent}%</span>
            <span className="stat-label">Completion</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dash-grid">
        {/* Today's Schedule */}
        <div className="dash-card glass-card animate-fade-in-up">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Today's Schedule</h2>
            <Link to="/tasks" className="btn-ghost">View All →</Link>
          </div>
          <div className="dash-card-content">
            {tasks.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">📝</span>
                <p>No tasks yet today</p>
                <Link to="/tasks" className="btn-secondary" style={{ marginTop: '8px' }}>Add Tasks</Link>
              </div>
            ) : (
              <div className="dash-task-list">
                {[...tasks]
                  .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
                  .slice(0, 6)
                  .map((task) => (
                  <div key={task._id} className={`dash-task-item ${task.completed ? 'dash-task-done' : ''}`}>
                    <div className={`dash-task-check ${task.completed ? 'checked' : ''}`}>
                      {task.completed && '✓'}
                    </div>
                    <span className={`dash-task-text ${task.completed ? 'strikethrough' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
                {tasks.length > 6 && (
                  <p className="dash-more">+{tasks.length - 6} more tasks</p>
                )}
              </div>
            )}

            {/* Progress bar */}
            {totalToday > 0 && (
              <div className="dash-progress">
                <div className="dash-progress-bar">
                  <div
                    className="dash-progress-fill"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="dash-progress-text">{completionPercent}% complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Priority To-Dos */}
        <div className="dash-card glass-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">Priority To-Dos</h2>
            <Link to="/todos" className="btn-ghost">View All →</Link>
          </div>
          <div className="dash-card-content">
            {urgentTodos.length === 0 && todos.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">📋</span>
                <p>No active to-dos</p>
                <Link to="/todos" className="btn-secondary" style={{ marginTop: '8px' }}>Create To-Do</Link>
              </div>
            ) : urgentTodos.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">✓</span>
                <p>No urgent deadlines</p>
                <small style={{ color: 'var(--text-tertiary)' }}>{todos.length} active to-dos</small>
              </div>
            ) : (
              <div className="dash-todo-list">
                {urgentTodos.map((todo) => {
                  const deadline = todo.deadline ? new Date(todo.deadline) : null;
                  const daysLeft = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;
                  const completedPhases = todo.phases.filter(p => p.completed).length;
                  return (
                    <div key={todo._id} className="dash-todo-item">
                      <div className="dash-todo-top">
                        <span className={`dash-priority-dot priority-${todo.priority}`} />
                        <span className="dash-todo-title">{todo.title}</span>
                      </div>
                      <div className="dash-todo-meta">
                        {daysLeft !== null && (
                          <span className={`dash-todo-deadline ${daysLeft <= 1 ? 'deadline-urgent' : ''}`}>
                            {daysLeft <= 0 ? '⚠️ Overdue' : daysLeft === 1 ? '⏰ Tomorrow' : `${daysLeft} days left`}
                          </span>
                        )}
                        {todo.phases.length > 0 && (
                          <span className="dash-todo-phases">
                            {completedPhases}/{todo.phases.length} phases
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="dash-card glass-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <Link to="/tasks" className="btn-ghost">Full View →</Link>
          </div>
          <div className="dash-card-content">
            <div className="mini-cal">
              <div className="mini-cal-header">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="mini-cal-day-label">{d}</span>
                ))}
              </div>
              <div className="mini-cal-grid">
                {/* Empty cells for days before the 1st */}
                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                  <span key={`empty-${i}`} className="mini-cal-cell mini-cal-empty" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === now.getDate();
                  const history = getHistoryForDay(day);
                  const rate = history?.rate || 0;

                  let intensity = '';
                  if (history) {
                    if (rate >= 100) intensity = 'cal-full';
                    else if (rate >= 50) intensity = 'cal-high';
                    else if (rate > 0) intensity = 'cal-low';
                    else intensity = 'cal-none';
                  }

                  return (
                    <span
                      key={day}
                      className={`mini-cal-cell ${isToday ? 'mini-cal-today' : ''} ${intensity}`}
                      title={history ? `${history.completed}/${history.total} tasks (${rate}%)` : ''}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
