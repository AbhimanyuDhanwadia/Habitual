import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import Toast from './components/Toast/Toast';
import Landing from './pages/Landing/Landing';
import Auth from './pages/Auth/Auth';
import './styles/global.css';
import './App.css';

const authenticatedRouteImports = [
  () => import('./pages/Dashboard/Dashboard'),
  () => import('./pages/DailyTasks/DailyTasks'),
  () => import('./pages/TodoList/TodoList'),
  () => import('./pages/Habits/Habits'),
  () => import('./pages/Streaks/Streaks'),
  () => import('./pages/Friends/Friends'),
  () => import('./pages/Account/Account'),
];

const Dashboard = lazy(authenticatedRouteImports[0]);
const DailyTasks = lazy(authenticatedRouteImports[1]);
const TodoList = lazy(authenticatedRouteImports[2]);
const Habits = lazy(authenticatedRouteImports[3]);
const Streaks = lazy(authenticatedRouteImports[4]);
const Friends = lazy(authenticatedRouteImports[5]);
const Account = lazy(authenticatedRouteImports[6]);

function preloadAuthenticatedRoutes() {
  authenticatedRouteImports.forEach(loadRoute => {
    loadRoute().catch(() => {});
  });
}

function RouteFallback() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Loading...</p>
    </div>
  );
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pages that don't show the app shell (header + sidebar)
  const publicPages = ['/', '/auth'];
  const isPublicPage = publicPages.includes(location.pathname);
  const showShell = isAuthenticated && !isPublicPage;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-lock', sidebarOpen && showShell);
    return () => document.body.classList.remove('sidebar-lock');
  }, [sidebarOpen, showShell]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadAuthenticatedRoutes, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(preloadAuthenticatedRoutes, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated]);

  return (
    <div className={`app ${showShell ? 'app-shell' : 'app-public'} ${sidebarOpen ? 'sidebar-is-open' : ''}`}>
      {showShell && (
        <>
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}

      <main
        className={showShell ? 'app-main with-shell' : 'app-main'}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><DailyTasks /></ProtectedRoute>} />
            <Route path="/todos" element={<ProtectedRoute><TodoList /></ProtectedRoute>} />
            <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
            <Route path="/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </main>

      <Toast />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppLayout />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
