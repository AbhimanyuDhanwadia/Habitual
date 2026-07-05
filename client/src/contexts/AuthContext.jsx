import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { auth } from '../config/firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
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
    let signingOut = false; // Prevent re-entrant loop when signOut triggers onAuthStateChanged again

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (signingOut) return; // Already handling sign-out, skip

      if (firebaseUser) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          // User exists in Firebase but not in our MongoDB — sign them out
          // to avoid an infinite loop.
          setUser(null);
          setIsAuthenticated(false);
          signingOut = true;
          try {
            await signOut(auth);
          } catch (signOutErr) {
            console.error("Sign out error:", signOutErr);
          }
          signingOut = false;
        }
      } else {
        const localToken = localStorage.getItem('habitual_token');
        if (localToken === 'dummy_token_12345') {
          const dummyUserStr = localStorage.getItem('dummy_user');
          if (dummyUserStr) {
            setUser(JSON.parse(dummyUserStr));
            setToken(localToken);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
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
      const token = await userCredential.user.getIdToken();

      // 3. Create user in our MongoDB backend
      const res = await authAPI.register(formData, token);
      
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
      // DUMMY MODE
      if (formData.email === 'dummy@example.com' && formData.password === 'password') {
        const fakeToken = 'dummy_token_12345';
        const fakeUser = {
          _id: 'dummy_user_123',
          firstName: 'Dummy',
          lastName: 'User',
          email: 'dummy@example.com',
          username: 'dummy',
          avatar: 'default-1',
          coins: 100,
          currentStreak: 1,
          longestStreak: 1,
          activeTheme: 'neo-mirai',
          unlockedThemes: ['neo-mirai']
        };
        
        localStorage.setItem('habitual_token', fakeToken);
        localStorage.setItem('dummy_user', JSON.stringify(fakeUser));
        setToken(fakeToken);
        setUser(fakeUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true, message: "Welcome back (Dummy Mode)!" };
      }

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

  const googleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      const res = await authAPI.googleLogin(token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true, message: res.data.message || "Welcome back!" };
    } catch (err) {
      console.error(err);
      let message = err.message || 'Google Login failed';
      if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
      setIsLoading(false);
      return { success: false, message };
    }
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
      googleLogin,
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


