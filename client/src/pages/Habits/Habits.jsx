import { useState, useEffect } from 'react';
import { habitsAPI } from '../../services/api';
import './Habits.css';

const categories = [
  { id: '', label: 'All', icon: '🌟' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧠' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { id: 'sleep', label: 'Sleep', icon: '😴' },
  { id: 'social', label: 'Social', icon: '💬' },
  { id: 'learning', label: 'Learning', icon: '📚' },
];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [expandedHabit, setExpandedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchHabits = async (category) => {
    try {
      setLoading(true);
      const res = await habitsAPI.getAll(category || undefined);
      setHabits(res.data.habits || []);
    } catch (err) {
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHabits(activeCategory); }, [activeCategory]);

  const handleAdopt = async (habitId) => {
    try {
      const res = await habitsAPI.adopt(habitId);
      showFeedback(res.data.message);
      setHabits(habits.map(h => h._id === habitId ? { ...h, adopted: true } : h));
    } catch (err) {
      const msg = err.response?.data?.message || 'Error adopting habit';
      showFeedback(msg, 'error');
    }
  };

  const handleUnadopt = async (habitId) => {
    try {
      await habitsAPI.unadopt(habitId);
      setHabits(habits.map(h => h._id === habitId ? { ...h, adopted: false } : h));
      showFeedback('Habit removed from daily routine');
    } catch (err) {
      console.error('Error unadopting:', err);
    }
  };

  const difficultyColors = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--error)' };

  return (
    <div className="habits-page">
      <div className="habits-header animate-fade-in-up">
        <h1>Better Habits</h1>
        <p className="habits-subtitle">Discover science-backed habits and add them to your daily routine</p>
      </div>

      {/* Inline Feedback */}
      {feedback && (
        <div className={`habits-feedback badge badge-${feedback.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-5)' }}>
          {feedback.message}
        </div>
      )}

      {/* Category Tabs */}
      <div className="habits-tabs animate-fade-in-up">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`habit-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="habit-tab-icon">{cat.icon}</span>
            <span className="habit-tab-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Habits Grid */}
      {loading ? (
        <div className="habits-loading"><div className="loading-spinner" /></div>
      ) : habits.length === 0 ? (
        <div className="habits-empty glass-card">
          <span>🌱</span>
          <p>No habits found in this category</p>
        </div>
      ) : (
        <div className="habits-grid stagger-children">
          {habits.map(habit => {
            const isExpanded = expandedHabit === habit._id;
            return (
              <div
                key={habit._id}
                className={`habit-card glass-card cat-${habit.category} ${isExpanded ? 'expanded' : ''}`}
              >
                <div className="habit-card-main" onClick={() => setExpandedHabit(isExpanded ? null : habit._id)}>
                  <div className="habit-card-top">
                    <span className="habit-emoji">{habit.icon}</span>
                    <div className="habit-meta">
                      <span className="habit-category-tag">{habit.category}</span>
                      <span className="habit-difficulty" style={{ color: difficultyColors[habit.difficulty] }}>
                        {habit.difficulty}
                      </span>
                    </div>
                  </div>
                  <h3 className="habit-title">{habit.title}</h3>
                  <p className="habit-desc">{habit.description}</p>
                  <div className="habit-expand-hint">
                    {isExpanded ? 'Click to collapse ↑' : 'Click to learn more ↓'}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="habit-details animate-fade-in-up">
                    <div className="habit-section">
                      <h4>🔬 Why This Works</h4>
                      <p>{habit.benefits}</p>
                    </div>
                    <div className="habit-section">
                      <h4>📋 How To Start</h4>
                      <p>{habit.howTo}</p>
                    </div>
                    <div className="habit-action">
                      {habit.adopted ? (
                        <button className="btn-secondary" onClick={() => handleUnadopt(habit._id)}>
                          ✓ Adopted — Remove
                        </button>
                      ) : (
                        <button className="btn-primary" onClick={() => handleAdopt(habit._id)}>
                          <span>🌱 Add to Daily Tasks</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
