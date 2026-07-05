import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { auth } from '../config/firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('habitual_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Handle Dummy Mode
      if (localStorage.getItem('habitual_token') === 'dummy_token_12345') {
        const storedUser = localStorage.getItem('dummy_user');
        let fakeUser;
        if (storedUser) {
          fakeUser = JSON.parse(storedUser);
        } else {
          fakeUser = {
            _id: "dummy123",
            email: "dummy@example.com",
            firstName: "Dummy",
            lastName: "User",
            username: "dummyuser",
            avatar: "default-1",
            activeTheme: "default",
            coins: 1000,
            currentStreak: 5,
            longestStreak: 12,
            ownedItems: [],
            adoptedHabits: [],
            createdAt: new Date().toISOString()
          };
          localStorage.setItem('dummy_user', JSON.stringify(fakeUser));
        }
        setUser(fakeUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      if (firebaseUser) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          // If we can't fetch the user profile, but they are authenticated in Firebase,
          // they might not have finished registration on our backend.
          setUser(null);
          setIsAuthenticated(false);
          setError("User profile not found. Please log in again.");
          await signOut(auth);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Wait for the token to be available for the interceptor
      await userCredential.user.getIdToken();

      // 3. Create user in our MongoDB backend
      const res = await authAPI.register(formData);
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      let message = err.message || 'Registration failed';
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Email is already in use.';
      }
      setError(message);
      setIsLoading(false);
      // If Firebase succeeded but our backend failed, we should probably delete the Firebase user here to keep them in sync.
      // Ignoring for simplicity in this demo, but important for production.
      return { success: false, message };
    }
  };

  const login = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // onAuthStateChanged will handle the rest (fetching profile)
      return { success: true, message: "Welcome back!" };
    } catch (err) {
      let message = err.message || 'Login failed';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      }
      setError(message);
      setIsLoading(false);
      return { success: false, message };
    }
  };

  const dummyLogin = () => {
    const fakeToken = "dummy_token_12345";
    const fakeUser = {
      _id: "dummy_id",
      email: "dummy@example.com",
      firstName: "Dummy",
      lastName: "User",
      username: "dummyuser",
      avatar: "default-1",
      activeTheme: "default",
      coins: 1000,
      currentStreak: 5,
      longestStreak: 12,
      ownedItems: [],
      adoptedHabits: []
    };
    localStorage.setItem('habitual_token', fakeToken);
    localStorage.setItem('dummy_user', JSON.stringify(fakeUser));
    setToken(fakeToken);
    setUser(fakeUser);
    setIsAuthenticated(true);
    return { success: true, message: "Logged in as Dummy User" };
  };

  const logout = async () => {
    try {
      localStorage.removeItem('habitual_token');
      localStorage.removeItem('dummy_user');
      await signOut(auth);
      // onAuthStateChanged will handle the rest
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => {
      const newUser = { ...prevUser, ...userData };
      if (localStorage.getItem('habitual_token') === 'dummy_token_12345') {
        localStorage.setItem('dummy_user', JSON.stringify(newUser));
      }
      return newUser;
    });
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token, // token state here is mainly for dummy mode, the real token is dynamic now
      isAuthenticated,
      isLoading,
      error,
      register,
      login,
      dummyLogin,
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


