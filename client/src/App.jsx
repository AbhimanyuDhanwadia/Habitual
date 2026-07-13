import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import Toast from './components/Toast/Toast';
import Landing from './pages/Landing/Landing';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';
import DailyTasks from './pages/DailyTasks/DailyTasks';
import TodoList from './pages/TodoList/TodoList';
import Habits from './pages/Habits/Habits';
import Streaks from './pages/Streaks/Streaks';
import Friends from './pages/Friends/Friends';
import Account from './pages/Account/Account';
import './styles/global.css';
import './App.css';

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
