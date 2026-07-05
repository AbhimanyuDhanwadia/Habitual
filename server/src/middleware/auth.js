import admin from '../config/firebase.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find the user in our database using the Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
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

