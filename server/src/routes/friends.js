import express from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// GET /api/friends
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username firstName lastName avatar currentStreak longestStreak')
      .populate('friendRequests', 'username firstName lastName avatar');
    
    res.json({
      friends: user.friends,
      friendRequests: user.friendRequests,
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Error fetching friends' });
  }
});

// POST /api/friends/request
router.post('/request', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });
    if (username === req.user.username) return res.status(400).json({ message: 'Cannot add yourself' });

    const friend = await User.findOne({ username });
    if (!friend) return res.status(404).json({ message: 'User not found' });

    // Check if already friends
    if (friend.friends.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already sent
    if (friend.friendRequests.includes(req.user._id)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    friend.friendRequests.push(req.user._id);
    await friend.save();

    // Create notification
    await Notification.create({
      userId: friend._id,
      type: 'friend_request',
      fromUserId: req.user._id,
    });

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ message: 'Error sending friend request' });
  }
});

// POST /api/friends/accept
router.post('/accept', async (req, res) => {
  try {
    const { friendId } = req.body;
    
    const user = await User.findById(req.user._id);
    const friend = await User.findById(friendId);

    if (!friend) return res.status(404).json({ message: 'User not found' });

    // Remove from requests
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    
    // Add to friends for both
    if (!user.friends.includes(friendId)) user.friends.push(friendId);
    if (!friend.friends.includes(user._id)) friend.friends.push(user._id);

    await user.save();
    await friend.save();

    // Create notification
    await Notification.create({
      userId: friend._id,
      type: 'friend_accepted',
      fromUserId: user._id,
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Error accepting friend request' });
  }
});

// POST /api/friends/nudge
router.post('/nudge', async (req, res) => {
  try {
    const { friendId } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user.friends.includes(friendId)) {
      return res.status(403).json({ message: 'Can only nudge friends' });
    }

    // Create notification
    await Notification.create({
      userId: friendId,
      type: 'nudge',
      fromUserId: user._id,
    });

    res.json({ message: 'Nudge sent' });
  } catch (error) {
    console.error('Nudge error:', error);
    res.status(500).json({ message: 'Error sending nudge' });
  }
});

// GET /api/friends/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const user = await User.findById(req.user._id);
    if (!user.friends.includes(id)) {
      return res.status(403).json({ message: 'Not authorized to view this user\'s history' });
    }

    const { default: DailyTask } = await import('../models/DailyTask.js');
    
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const tasks = await DailyTask.find({
      userId: id,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    // Group by date and compute completion rates
    const dateMap = {};
    tasks.forEach(task => {
      const dateKey = task.date.toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { total: 0, completed: 0 };
      }
      dateMap[dateKey].total += 1;
      if (task.completed) {
        dateMap[dateKey].completed += 1;
      }
    });

    const history = Object.entries(dateMap).map(([date, counts]) => ({
      date,
      total: counts.total,
      completed: counts.completed,
      rate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
    }));

    res.json({ history, month, year });
  } catch (error) {
    console.error('Friend history error:', error);
    res.status(500).json({ message: 'Error fetching friend history' });
  }
});

export default router;
