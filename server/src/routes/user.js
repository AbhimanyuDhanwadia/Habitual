import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();
router.use(auth);

// PATCH /api/user/profile
router.patch('/profile', [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('username').optional().trim().isLength({ min: 3, max: 24 }).withMessage('Username must be 3-24 characters'),
  body('dob').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Date of birth must be a valid date'),
  validateRequest,
], async (req, res) => {
  try {
    const { firstName, lastName, username, dob } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (dob) user.dob = dob;

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// PATCH /api/user/avatar
router.patch('/avatar', [
  body('avatar').trim().notEmpty().withMessage('Avatar is required'),
  validateRequest,
], async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = await User.findById(req.user._id);
    user.avatar = avatar;
    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Error updating avatar' });
  }
});

// PATCH /api/user/theme
router.patch('/theme', [
  body('theme').trim().notEmpty().withMessage('Theme is required'),
  validateRequest,
], async (req, res) => {
  try {
    const { theme } = req.body;
    const user = await User.findById(req.user._id);
    user.activeTheme = theme;
    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ message: 'Error updating theme' });
  }
});

// GET /api/user/stats
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get total earned/spent
    const totals = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    const totalEarned = totals.find(t => t._id === 'earned')?.total || 0;
    const totalSpent = totals.find(t => t._id === 'spent')?.total || 0;

    res.json({
      coins: user.coins,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      totalEarned,
      totalSpent,
      recentTransactions,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

export default router;
