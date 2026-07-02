import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Landing.css';

const features = [
  {
    icon: '✅',
    title: 'Daily Tasks',
    description: 'Build powerful daily routines with satisfying visual feedback and progress tracking.',
  },
  {
    icon: '📋',
    title: 'Phased To-Dos',
    description: 'Break major projects into phases with independent deadlines. Never rush again.',
  },
  {
    icon: '🌱',
    title: 'Better Habits',
    description: 'Discover science-backed habits and seamlessly integrate them into your daily life.',
  },
  {
    icon: '📊',
    title: 'Progress Insights',
    description: 'Track your productivity with detailed analytics, heatmaps, and completion metrics.',
  },
  {
    icon: '📅',
    title: 'Consistency Tracking',
    description: 'Maintain consecutive days of productivity and visualize your long-term commitment.',
  },
  {
    icon: '🎨',
    title: 'Personalize',
    description: 'Custom avatars, themes, and profile settings — make your workspace feel like yours.',
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <span className="landing-nav-icon">⚡</span>
          <span className="landing-nav-text">Habitual</span>
        </div>
        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost">Log In</Link>
              <Link to="/auth?mode=signup" className="btn-primary">
                <span>Get Started</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="hero-content animate-fade-in-up">
          <div className="hero-badge">
            <span>⚡</span> Your Productivity, Elevated
          </div>
          <h1 className="hero-title">
            Turn Your Daily Routine Into A
            <span className="gradient-text"> Rewarding Journey</span>
          </h1>
          <p className="hero-subtitle">
            Build habits, manage projects, track progress. Habitual provides a structured
            experience that keeps you focused and motivated every single day.
          </p>
          <div className="hero-actions">
            <Link to="/auth?mode=signup" className="btn-primary btn-lg">
              <span>Start Your Journey</span>
            </Link>
            <Link to="/auth" className="btn-secondary btn-lg">
              I Already Have an Account
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">5</span>
              <span className="hero-stat-label">Categories</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">13</span>
              <span className="hero-stat-label">Curated habits</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">∞</span>
              <span className="hero-stat-label">Potential</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-features">
        <h2 className="features-title">Everything You Need to <span className="gradient-text">Stay On Track</span></h2>
        <p className="features-subtitle">
          A complete productivity ecosystem designed to help you build lasting habits and achieve your goals.
        </p>
        <div className="features-grid stagger-children">
          {features.map((feature, i) => (
            <div key={i} className="feature-card glass-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="cta-card glass-card">
          <h2>Ready to Transform Your Productivity?</h2>
          <p>Join Habitual today and start building better habits with a platform designed for your success.</p>
          <Link to="/auth?mode=signup" className="btn-primary btn-lg">
            <span>Create Free Account</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Built with ⚡ by Habitual • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
