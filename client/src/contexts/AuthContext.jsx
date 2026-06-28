import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('habitual_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_LOADED':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto-load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('habitual_token');
      if (!token) {
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }
      try {
        const res = await authAPI.getMe();
        dispatch({ type: 'AUTH_LOADED', payload: { user: res.data.user } });
      } catch (err) {
        localStorage.removeItem('habitual_token');
        dispatch({ type: 'AUTH_ERROR', payload: null });
      }
    };
    loadUser();
  }, []);

  const register = async (formData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await authAPI.register(formData);
      localStorage.setItem('habitual_token', res.data.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: res.data.user, token: res.data.token } });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const login = async (formData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await authAPI.login(formData);
      localStorage.setItem('habitual_token', res.data.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: res.data.user, token: res.data.token } });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('habitual_token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      register,
      login,
      logout,
      updateUser,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
