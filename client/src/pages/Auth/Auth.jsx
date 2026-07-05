import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const defaultAvatars = [
  { id: 'default-1', emoji: '😎' },
  { id: 'default-2', emoji: '🦊' },
  { id: 'default-3', emoji: '🐱' },
  { id: 'default-4', emoji: '🦉' },
  { id: 'default-5', emoji: '🐺' },
  { id: 'default-6', emoji: '🦁' },
  { id: 'default-7', emoji: '🐯' },
  { id: 'default-8', emoji: '🦅' },
  { id: 'default-9', emoji: '🐼' },
  { id: 'default-10', emoji: '🦋' },
  { id: 'default-11', emoji: '🌟' },
  { id: 'default-12', emoji: '🔮' },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup');
  const [step, setStep] = useState(1); // 1 = form, 2 = avatar selection (signup only)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    dob: '',
    avatar: 'default-1',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, login, dummyLogin, isAuthenticated, error: authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignup) {
      if (step === 1) {
        // Validate fields
        if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        setStep(2);
        setLoading(false);
        return;
      }

      // Step 2: Submit registration
      const result = await register(formData);
      if (!result.success) {
        setError(result.message);
      }
    } else {
      const result = await login({ email: formData.email, password: formData.password });
      if (!result.success) {
        setError(result.message);
      }
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setStep(1);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="auth-container animate-scale-in">
        {/* Logo */}
        <Link to="/" className="auth-logo" style={{ textDecoration: 'none' }}>
          <span className="auth-logo-icon">⚡</span>
          <span className="auth-logo-text">Habitual</span>
        </Link>

        {/* Step indicator for signup */}
        {isSignup && (
          <div className="auth-steps">
            <div className={`auth-step ${step >= 1 ? 'auth-step-active' : ''}`}>
              <span className="auth-step-num">1</span>
              <span className="auth-step-label">Details</span>
            </div>
            <div className="auth-step-line" />
            <div className={`auth-step ${step >= 2 ? 'auth-step-active' : ''}`}>
              <span className="auth-step-num">2</span>
              <span className="auth-step-label">Avatar</span>
            </div>
          </div>
        )}

        <h1 className="auth-title">
          {isSignup
            ? step === 1 ? 'Create Your Account' : 'Choose Your Avatar'
            : 'Welcome Back'
          }
        </h1>
        <p className="auth-subtitle">
          {isSignup
            ? step === 1 ? 'Start your productivity journey today' : 'Pick a starting avatar to personalize your profile'
            : 'Log in to continue where you left off'
          }
        </p>

        {error && (
          <div className="auth-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && step === 1 && (
            <>
              <div className="auth-row">
                <div className="auth-field">
                  <label className="label" htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="label" htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label className="label" htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={24}
                />
              </div>
              <div className="auth-field">
                <label className="label" htmlFor="dob">Date of Birth <small>(optional)</small></label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {((!isSignup) || (isSignup && step === 1)) && (
            <>
              <div className="auth-field">
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {isSignup && step === 2 && (
            <div className="avatar-grid">
              {defaultAvatars.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  className={`avatar-option ${formData.avatar === av.id ? 'avatar-selected' : ''}`}
                  onClick={() => setFormData({ ...formData, avatar: av.id })}
                >
                  <span className="avatar-emoji">{av.emoji}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={loading}
          >
            <span>
              {loading
                ? 'Please wait...'
                : isSignup
                  ? step === 1 ? 'Continue' : 'Create Account'
                  : 'Log In'
              }
            </span>
          </button>

          {!isSignup && (
            <button
              type="button"
              className="btn-ghost auth-submit"
              onClick={dummyLogin}
              style={{ marginTop: '10px' }}
            >
              <span>Log In as Guest (Dummy)</span>
            </button>
          )}

          {isSignup && step === 2 && (
            <button type="button" className="btn-ghost auth-back" onClick={() => setStep(1)}>
              ← Back to details
            </button>
          )}
        </form>

        <div className="auth-toggle">
          {isSignup ? (
            <p>Already have an account? <button onClick={toggleMode} className="auth-toggle-btn">Log In</button></p>
          ) : (
            <p>New to Habitual? <button onClick={toggleMode} className="auth-toggle-btn">Create Account</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
