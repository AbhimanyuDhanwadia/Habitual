import express from 'express';
import { param, query } from 'express-validator';
import Habit from '../models/Habit.js';
import DailyTask from '../models/DailyTask.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();
router.use(auth);

// GET /api/habits?category=X
router.get('/', [
  query('category').optional().isIn(['fitness', 'mindfulness', 'nutrition', 'sleep', 'social', 'learning', 'grooming', 'health', 'productivity', 'better_life']).withMessage('Invalid category'),
  validateRequest,
], async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;

    const habits = await Habit.find(query).sort({ category: 1, title: 1 });

    // Mark which habits the user has adopted
    const user = await User.findById(req.user._id);
    const adoptedIds = user.adoptedHabits.map(id => id.toString());

    const habitsWithStatus = habits.map(habit => ({
      ...habit.toObject(),
      adopted: adoptedIds.includes(habit._id.toString()),
    }));

    res.json({ habits: habitsWithStatus });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Error fetching habits' });
  }
});

// GET /api/habits/:id
router.get('/:id', [
  param('id').isMongoId().withMessage('Habit ID must be valid'),
  validateRequest,
], async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.json({ habit });
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ message: 'Error fetching habit' });
  }
});

// POST /api/habits/:id/adopt
router.post('/:id/adopt', [
  param('id').isMongoId().withMessage('Habit ID must be valid'),
  validateRequest,
], async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const user = await User.findById(req.user._id);

    // Check if already adopted
    if (user.adoptedHabits.some(id => id.toString() === habit._id.toString())) {
      return res.status(400).json({ message: 'Habit already adopted' });
    }

    // Add to user's adopted habits
    user.adoptedHabits.push(habit._id);
    await user.save();

    // Create a daily task for today
    const today = new Date();
    const normalizedDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    await DailyTask.create({
      userId: req.user._id,
      title: `${habit.icon} ${habit.title}`,
      date: normalizedDate,
      isHabitGenerated: true,
      habitId: habit._id,
    });

    res.json({
      message: `"${habit.title}" added to your daily tasks!`,
      habit,
    });
  } catch (error) {
    console.error('Adopt habit error:', error);
    res.status(500).json({ message: 'Error adopting habit' });
  }
});

// POST /api/habits/:id/unadopt
router.post('/:id/unadopt', [
  param('id').isMongoId().withMessage('Habit ID must be valid'),
  validateRequest,
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.adoptedHabits = user.adoptedHabits.filter(id => id.toString() !== req.params.id);
    await user.save();

    res.json({ message: 'Habit removed from daily routine' });
  } catch (error) {
    console.error('Unadopt habit error:', error);
    res.status(500).json({ message: 'Error removing habit' });
  }
});

export default router;
