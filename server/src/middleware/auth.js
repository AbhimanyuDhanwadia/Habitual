import admin from '../config/firebase.js';
import { getAuth } from 'firebase-admin/auth';
import User from '../models/User.js';

const AUTH_USER_CACHE_MS = Number(process.env.AUTH_USER_CACHE_MS || 60000);
const MAX_AUTH_USER_CACHE_SIZE = 1000;
const authUserCache = new Map();

const getCachedUser = async (firebaseUid) => {
  const now = Date.now();
  const cached = authUserCache.get(firebaseUid);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const user = await User.findOne({ firebaseUid })
    .select('_id username firebaseUid')
    .lean();

  if (user && AUTH_USER_CACHE_MS > 0) {
    if (authUserCache.size >= MAX_AUTH_USER_CACHE_SIZE) {
      authUserCache.delete(authUserCache.keys().next().value);
    }
    authUserCache.set(firebaseUid, {
      user,
      expiresAt: now + AUTH_USER_CACHE_MS,
    });
  }

  return user;
};

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    

    // Verify Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token);

    // Find the user in our database using the Firebase UID
    const user = await getCachedUser(decodedToken.uid);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found in local database' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid or missing token' });
  }
};
