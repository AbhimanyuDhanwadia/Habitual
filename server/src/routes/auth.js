import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import admin from '../config/firebase.js';
import { awardSignupBonus } from '../services/rewardService.js';

const router = express.Router();

// Validation helper
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

// POST /api/auth/register
// Expects an Authorization header with a valid Firebase ID token
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('username').trim().isLength({ min: 3, max: 24 }).withMessage('Username must be 3-24 characters'),
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('Firebase token verification error during registration:', error);
      return res.status(401).json({ message: 'Invalid or missing Firebase token' });
    }

    const { email, firstName, lastName, username, dob, avatar } = req.body;
    const firebaseUid = decodedToken.uid;

    // Check existing user
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const existingFirebaseUser = await User.findOne({ firebaseUid });
    if (existingFirebaseUser) {
      return res.status(400).json({ message: 'User already exists for this Firebase identity' });
    }

    const user = await User.create({
      email,
      firebaseUid,
      firstName,
      lastName,
      username,
      dob: dob || undefined,
      avatar: avatar || 'default-1',
    });

    // Award signup bonus
    await awardSignupBonus(user._id);

    // Refresh user data to include bonus
    const updatedUser = await User.findById(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      user: updatedUser.toPublicJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
