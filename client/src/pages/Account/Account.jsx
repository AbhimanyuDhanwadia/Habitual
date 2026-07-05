import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import './Account.css';

const AVATAR_OPTIONS = ['default-1', '🦁', '🦊', '🦉', '🦄', '🐼', '🐸', '🐙', '👾'];
const THEME_OPTIONS = [
  { id: 'default', label: 'Default (Warm)' },
  { id: 'dark', label: 'Dark Mode' },
  { id: 'light', label: 'Light Mode' },
];

export default function Account() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
  });

  const [saving, setSaving] = useState(false);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveProfile = async () => {
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

  const handleUpdateAvatar = async (avatar) => {
    try {
      const res = await userAPI.updateAvatar(avatar);
      updateUser(res.data.user);
      showFeedback('Avatar updated');
    } catch (err) {
      showFeedback('Error updating avatar', 'error');
    }
  };

  const handleUpdateTheme = async (theme) => {
    try {
      const res = await userAPI.updateTheme(theme);
      updateUser(res.data.user);
      showFeedback('Theme updated');
    } catch (err) {
      showFeedback('Error updating theme', 'error');
    }
  };

  const renderAvatar = () => {
    if (!user?.avatar || user.avatar === 'default-1') {
      return `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;
    }
    return user.avatar;
  };

  return (
    <div className="account-page">
      <div className="account-header animate-fade-in-up">
        <h1>My Account</h1>
        <p className="account-subtitle">Manage your profile, preferences, and view your progress</p>
      </div>

      {feedback && (
        <div className={`account-feedback badge badge-${feedback.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-5)' }}>
          {feedback.message}
        </div>
      )}

      <div className="account-tabs animate-fade-in-up">
        <button className={`account-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
        <button className={`account-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>Preferences</button>
      </div>

      <div className="account-grid">
        {/* Profile/Preferences Card */}
        <div className="account-card glass-card animate-fade-in-up">
          {activeTab === 'profile' && (
            <>
              <div className="account-avatar-section">
                <div className="account-avatar">
                  {renderAvatar()}
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
                    <div className="auth-field">
                      <label className="label">Date of Birth</label>
                      <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                    </div>
                    <div className="account-edit-actions">
                      <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                      <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
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
                      <span className="account-info-label">Date of Birth</span>
                      <span className="account-info-value">{user?.dob ? new Date(user.dob).toLocaleDateString() : 'Not set'}</span>
                    </div>
                    <div className="account-info-row">
                      <span className="account-info-label">Member Since</span>
                      <span className="account-info-value">
                        {user?.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          : 'Unknown'}
                      </span>
                    </div>
                    <button className="btn-secondary" onClick={() => setEditing(true)} style={{ marginTop: 'var(--space-4)' }}>
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === 'preferences' && (
            <div className="account-preferences">
              <div className="preference-group">
                <h3>Avatar Selection</h3>
                <div className="avatar-selection-grid">
                  {AVATAR_OPTIONS.map(opt => (
                    <button 
                      key={opt}
                      className={`avatar-option ${user?.avatar === opt || (!user?.avatar && opt === 'default-1') ? 'active' : ''}`}
                      onClick={() => handleUpdateAvatar(opt)}
                    >
                      {opt === 'default-1' ? `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}` : opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="preference-group" style={{ marginTop: 'var(--space-6)' }}>
                <h3>Theme Options</h3>
                <div className="theme-selection-list">
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.id}
                      className={`theme-option ${user?.activeTheme === theme.id || (!user?.activeTheme && theme.id === 'default') ? 'active' : ''}`}
                      onClick={() => handleUpdateTheme(theme.id)}
                    >
                      <span className="theme-option-name">{theme.label}</span>
                      {(user?.activeTheme === theme.id || (!user?.activeTheme && theme.id === 'default')) && <span className="theme-option-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
            <div className="account-stat" style={{ borderBottom: 'none' }}>
              <span className="account-stat-icon">🪙</span>
              <span className="account-stat-value">{user?.coins || 0}</span>
              <span className="account-stat-label">Total Coins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
