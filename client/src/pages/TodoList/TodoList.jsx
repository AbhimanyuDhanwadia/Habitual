import { useState, useEffect } from 'react';
import { todosAPI } from '../../services/api';
import './TodoList.css';

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [loading, setLoading] = useState(true);
  const [editingTodo, setEditingTodo] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', priority: 'medium',
    phases: [{ title: '', deadline: '' }],
  });

  const fetchTodos = async () => {
    try {
      const params = {};
      if (filter === 'active') params.completed = false;
      if (filter === 'done') params.completed = true;
      if (sortBy === 'deadline') params.sort = 'deadline';
      if (sortBy === 'priority') params.sort = 'priority';
      const res = await todosAPI.getAll(params);
      setTodos(res.data.todos || []);
    } catch (err) {
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTodos(); }, [filter, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      title: form.title,
      description: form.description,
      deadline: form.deadline || undefined,
      priority: form.priority,
      phases: form.phases.filter(p => p.title.trim()).map(p => ({
        title: p.title,
        deadline: p.deadline || undefined,
      })),
    };

    try {
      if (editingTodo) {
        await todosAPI.update(editingTodo._id, payload);
      } else {
        await todosAPI.create(payload);
      }
      resetForm();
      fetchTodos();
    } catch (err) {
      console.error('Error saving todo:', err);
    }
  };

  const handleTogglePhase = async (todoId, phaseIndex) => {
    try {
      const res = await todosAPI.togglePhase(todoId, phaseIndex);
      setTodos(todos.map(t => t._id === todoId ? res.data.todo : t));
    } catch (err) {
      console.error('Error toggling phase:', err);
    }
  };

  const handleDelete = async (todoId) => {
    try {
      await todosAPI.delete(todoId);
      setTodos(todos.filter(t => t._id !== todoId));
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', deadline: '', priority: 'medium', phases: [{ title: '', deadline: '' }] });
    setEditingTodo(null);
    setShowModal(false);
  };

  const openEdit = (todo) => {
    setForm({
      title: todo.title,
      description: todo.description || '',
      deadline: todo.deadline ? todo.deadline.split('T')[0] : '',
      priority: todo.priority,
      phases: todo.phases.length > 0 ? todo.phases.map(p => ({
        title: p.title,
        deadline: p.deadline ? p.deadline.split('T')[0] : '',
      })) : [{ title: '', deadline: '' }],
    });
    setEditingTodo(todo);
    setShowModal(true);
  };

  const addPhase = () => {
    setForm({ ...form, phases: [...form.phases, { title: '', deadline: '' }] });
  };

  const removePhase = (idx) => {
    setForm({ ...form, phases: form.phases.filter((_, i) => i !== idx) });
  };

  const updatePhase = (idx, field, value) => {
    const updated = [...form.phases];
    updated[idx][field] = value;
    setForm({ ...form, phases: updated });
  };

  const getDaysUntil = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="todo-page">
      <div className="todo-header animate-fade-in-up">
        <div>
          <h1>To-Do List</h1>
          <p className="todo-subtitle">Major projects and deadlines, broken into phases</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <span>+ New To-Do</span>
        </button>
      </div>

      {/* Filters */}
      <div className="todo-filters animate-fade-in-up">
        <div className="todo-filter-group">
          {['all', 'active', 'done'].map(f => (
            <button
              key={f}
              className={`todo-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select className="todo-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="created">Newest</option>
          <option value="deadline">Deadline</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* Todo Cards */}
      {loading ? (
        <div className="todo-loading"><div className="loading-spinner" /></div>
      ) : todos.length === 0 ? (
        <div className="todo-empty glass-card animate-fade-in-up">
          <span className="todo-empty-icon">🎯</span>
          <h3>No to-dos yet</h3>
          <p>Create your first major project or deadline</p>
        </div>
      ) : (
        <div className="todo-grid stagger-children">
          {todos.map(todo => {
            const completedPhases = todo.phases.filter(p => p.completed).length;
            const totalPhases = todo.phases.length;
            const phasePercent = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
            const daysLeft = getDaysUntil(todo.deadline);

            return (
              <div key={todo._id} className={`todo-card glass-card ${todo.completed ? 'todo-done' : ''}`}>
                <div className="todo-card-header">
                  <div className="todo-card-top">
                    <span className={`todo-priority-badge priority-${todo.priority}`}>
                      {priorityLabels[todo.priority]}
                    </span>
                    {daysLeft !== null && (
                      <span className={`todo-deadline-badge ${daysLeft <= 1 ? 'deadline-critical' : daysLeft <= 3 ? 'deadline-warning' : ''}`}>
                        {daysLeft <= 0 ? '⚠️ Overdue' : daysLeft === 1 ? '⏰ Tomorrow' : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <h3 className="todo-card-title">{todo.title}</h3>
                  {todo.description && <p className="todo-card-desc">{todo.description}</p>}
                </div>

                {/* Phase Timeline */}
                {totalPhases > 0 && (
                  <div className="phase-timeline">
                    <div className="phase-progress-row">
                      <div className="phase-progress-bar">
                        <div className="phase-progress-fill" style={{ width: `${phasePercent}%` }} />
                      </div>
                      <span className="phase-progress-text">{completedPhases}/{totalPhases}</span>
                    </div>
                    {todo.phases.map((phase, i) => (
                      <div key={i} className={`phase-item ${phase.completed ? 'phase-done' : ''}`}>
                        <button
                          className={`phase-dot ${phase.completed ? 'phase-dot-done' : ''}`}
                          onClick={() => handleTogglePhase(todo._id, i)}
                        >
                          {phase.completed && '✓'}
                        </button>
                        <div className="phase-info">
                          <span className={`phase-title ${phase.completed ? 'phase-title-done' : ''}`}>{phase.title}</span>
                          {phase.deadline && (
                            <span className="phase-deadline">
                              Due {new Date(phase.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {i < totalPhases - 1 && <div className={`phase-connector ${phase.completed ? 'connector-done' : ''}`} />}
                      </div>
                    ))}
                  </div>
                )}

                <div className="todo-card-actions">
                  <button className="btn-ghost" onClick={() => openEdit(todo)}>Edit</button>
                  <button className="btn-ghost todo-delete" onClick={() => handleDelete(todo._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal glass-card animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2>{editingTodo ? 'Edit To-Do' : 'New To-Do'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="auth-field">
                <label className="label">Title *</label>
                <input
                  type="text" placeholder="Project title..."
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="label">Description</label>
                <textarea
                  placeholder="What's this project about?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="auth-row">
                <div className="auth-field">
                  <label className="label">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div className="auth-field">
                  <label className="label">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Phases */}
              <div className="modal-phases">
                <div className="modal-phases-header">
                  <label className="label">Phases</label>
                  <button type="button" className="btn-ghost" onClick={addPhase}>+ Add Phase</button>
                </div>
                {form.phases.map((phase, i) => (
                  <div key={i} className="modal-phase-row">
                    <input
                      type="text" placeholder={`Phase ${i + 1}...`}
                      value={phase.title} onChange={e => updatePhase(i, 'title', e.target.value)}
                    />
                    <input type="date" value={phase.deadline} onChange={e => updatePhase(i, 'deadline', e.target.value)} />
                    {form.phases.length > 1 && (
                      <button type="button" className="btn-ghost phase-remove" onClick={() => removePhase(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary"><span>{editingTodo ? 'Save Changes' : 'Create To-Do'}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
