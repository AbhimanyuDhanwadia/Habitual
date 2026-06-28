import express from 'express';
import { body } from 'express-validator';
import DailyTask from '../models/DailyTask.js';
import { auth } from '../middleware/auth.js';
import { awardTaskCompletion, awardDailyCompletion, updateStreak } from '../services/rewardService.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const tasks = await DailyTask.find({
      userId: req.user._id,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ order: 1, createdAt: 1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
], async (req, res) => {
  try {
    const { title, date, isHabitGenerated, habitId } = req.body;
    const taskDate = date ? new Date(date) : new Date();
    const normalizedDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

    // Get count for ordering
    const count = await DailyTask.countDocuments({
      userId: req.user._id,
      date: { $gte: normalizedDate, $lt: new Date(normalizedDate.getTime() + 86400000) },
    });

    const task = await DailyTask.create({
      userId: req.user._id,
      title,
      date: normalizedDate,
      isHabitGenerated: isHabitGenerated || false,
      habitId: habitId || undefined,
      order: count,
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// PATCH /api/tasks/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await DailyTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = !task.completed;
    await task.save();

    let reward = null;
    let streakUpdate = null;

    if (task.completed) {
      // Award coins for completing this task
      reward = await awardTaskCompletion(req.user._id);

      // Update streak
      streakUpdate = await updateStreak(req.user._id);

      // Check if all tasks for the day are complete
      const startOfDay = new Date(task.date);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const dayTasks = await DailyTask.find({
        userId: req.user._id,
        date: { $gte: startOfDay, $lt: endOfDay },
      });

      const allCompleted = dayTasks.every(t => t.completed);
      if (allCompleted && dayTasks.length > 0) {
        const dailyBonus = await awardDailyCompletion(req.user._id);
        reward = {
          ...reward,
          dailyBonus: dailyBonus.earned,
          totalCoins: dailyBonus.coins,
        };
      }
    }

    res.json({ task, reward, streakUpdate });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ message: 'Error toggling task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await DailyTask.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// GET /api/tasks/history?month=MM&year=YYYY
router.get('/history', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const tasks = await DailyTask.find({
      userId: req.user._id,
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

    // Convert to array with completion rate
    const history = Object.entries(dateMap).map(([date, counts]) => ({
      date,
      total: counts.total,
      completed: counts.completed,
      rate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
    }));

    res.json({ history, month, year });
  } catch (error) {
    console.error('Task history error:', error);
    res.status(500).json({ message: 'Error fetching task history' });
  }
});

export default router;
