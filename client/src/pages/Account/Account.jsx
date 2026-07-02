import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import './Account.css';

export default function Account() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
  });
  const [saving, setSaving] = useState(false);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data.user);
      setEditing(false);
      showFeedback('Profile updated successfully');
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-header animate-fade-in-up">
        <h1>My Account</h1>
        <p className="account-subtitle">Manage your profile and view your progress</p>
      </div>

      {/* Inline Feedback */}
      {feedback && (
        <div className={`account-feedback badge badge-${feedback.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-5)' }}>
          {feedback.message}
        </div>
      )}

      <div className="account-grid">
        {/* Profile Card */}
        <div className="account-card glass-card animate-fade-in-up">
          <div className="account-avatar-section">
            <div className="account-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <h2>{user?.firstName} {user?.lastName}</h2>
            <p className="account-username">@{user?.username}</p>
          </div>

          <div className="account-details">
            {editing ? (
              <div className="account-edit-form">
                <div className="auth-field">
                  <label className="label">First Name</label>
                  <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="auth-field">
                  <label className="label">Last Name</label>
                  <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
                <div className="auth-field">
                  <label className="label">Username</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="account-edit-actions">
                  <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="account-info-row">
                  <span className="account-info-label">Email</span>
                  <span className="account-info-value">{user?.email}</span>
                </div>
                <div className="account-info-row">
                  <span className="account-info-label">Member Since</span>
                  <span className="account-info-value">
                    {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <button className="btn-secondary" onClick={() => setEditing(true)} style={{ marginTop: 'var(--space-4)' }}>
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="account-card glass-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3>Your Progress</h3>
          <div className="account-stats-grid">
            <div className="account-stat">
              <span className="account-stat-icon">📅</span>
              <span className="account-stat-value">{user?.currentStreak || 0}</span>
              <span className="account-stat-label">Consecutive Days</span>
            </div>
            <div className="account-stat">
              <span className="account-stat-icon">📈</span>
              <span className="account-stat-value">{user?.longestStreak || 0}</span>
              <span className="account-stat-label">Personal Best</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
