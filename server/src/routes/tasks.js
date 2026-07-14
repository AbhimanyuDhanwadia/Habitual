import express from 'express';
import { body, param, query } from 'express-validator';
import DailyTask from '../models/DailyTask.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { awardTaskCompletion, awardDailyCompletion, updateStreak } from '../services/rewardService.js';

import User from '../models/User.js';
import Habit from '../models/Habit.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

const getDateKey = (date) => date.toISOString().split('T')[0];

const getDayBounds = (dateValue) => {
  const queryDate = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(queryDate.getTime())) return null;

  const startOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate()));
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  return { startOfDay, endOfDay };
};

const buildGeneratedTaskPayload = async (userId, startOfDay) => {
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const [tasks, user] = await Promise.all([
    DailyTask.find({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ order: 1, createdAt: 1 }).lean(),
    User.findById(userId)
      .select('adoptedHabits recurringTasks')
      .populate({ path: 'adoptedHabits', select: 'title icon' })
      .lean(),
  ]);
  const ops = [];

  if (user?.adoptedHabits?.length > 0) {
    const existingHabitIds = new Set(tasks
      .filter(t => t.isHabitGenerated && t.habitId)
      .map(t => t.habitId.toString()));

    for (const habit of user.adoptedHabits) {
      if (habit && !existingHabitIds.has(habit._id.toString())) {
        const doc = {
          userId,
          title: `${habit.icon} ${habit.title}`,
          date: startOfDay,
          isHabitGenerated: true,
          habitId: habit._id,
          order: tasks.length + ops.length,
        };

        ops.push({
          updateOne: {
            filter: {
              userId,
              date: startOfDay,
              isHabitGenerated: true,
              habitId: habit._id,
            },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        });
      }
    }
  }

  if (user?.recurringTasks?.length > 0) {
    const existingManualTitles = new Set(tasks
      .filter(t => !t.isHabitGenerated)
      .map(t => t.title));

    for (const title of user.recurringTasks) {
      if (!existingManualTitles.has(title)) {
        const doc = {
          userId,
          title,
          date: startOfDay,
          isHabitGenerated: false,
          order: tasks.length + ops.length,
        };

        ops.push({
          updateOne: {
            filter: {
              userId,
              date: startOfDay,
              isHabitGenerated: false,
              title,
            },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        });
      }
    }
  }

  return { tasks, ops };
};

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', [
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  validateRequest,
], async (req, res) => {
  try {
    const bounds = getDayBounds(req.query.date);
    if (!bounds) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const tasks = await DailyTask.find({
      userId: req.user._id,
      date: { $gte: bounds.startOfDay, $lt: bounds.endOfDay },
    }).sort({ order: 1, createdAt: 1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// POST /api/tasks/generate
router.post('/generate', [
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  validateRequest,
], async (req, res) => {
  try {
    const bounds = getDayBounds(req.body.date);
    if (!bounds) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const { tasks: existingTasks, ops } = await buildGeneratedTaskPayload(req.user._id, bounds.startOfDay);
    if (ops.length > 0) {
      await DailyTask.bulkWrite(ops, { ordered: false });

      const tasks = await DailyTask.find({
        userId: req.user._id,
        date: { $gte: bounds.startOfDay, $lt: bounds.endOfDay },
      }).sort({ order: 1, createdAt: 1 }).lean();

      return res.json({ tasks });
    }

    res.json({ tasks: existingTasks });
  } catch (error) {
    console.error('Generate tasks error:', error);
    res.status(500).json({ message: 'Error generating tasks' });
  }
});

// POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('isHabitGenerated').optional().isBoolean().withMessage('isHabitGenerated must be boolean'),
  body('habitId').optional().isMongoId().withMessage('Habit ID must be valid'),
  validateRequest,
], async (req, res) => {
  try {
    const { title, date, isHabitGenerated, habitId } = req.body;
    const bounds = getDayBounds(date);
    if (!bounds) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    // Get count for ordering
    const count = await DailyTask.countDocuments({
      userId: req.user._id,
      date: { $gte: bounds.startOfDay, $lt: bounds.endOfDay },
    });

    const task = await DailyTask.create({
      userId: req.user._id,
      title,
      date: bounds.startOfDay,
      isHabitGenerated: isHabitGenerated || false,
      habitId: habitId || undefined,
      order: count,
    });

    // If this is a manual (non-habit) task, save it as a recurring template
    if (!isHabitGenerated) {
      const user = await User.findById(req.user._id);
      if (!user.recurringTasks.includes(title)) {
        user.recurringTasks.push(title);
        await user.save();
      }
    }

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// PATCH /api/tasks/:id/toggle
router.patch('/:id/toggle', [
  param('id').isMongoId().withMessage('Task ID must be valid'),
  validateRequest,
], async (req, res) => {
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
      reward = await awardTaskCompletion(req.user._id, task._id);

      // Update streak
      streakUpdate = await updateStreak(req.user._id);

      // Check if all tasks for the day are complete
      const startOfDay = new Date(task.date);
      const endOfDay = new Date(startOfDay.getTime() + 86400000);

      const dayTasks = await DailyTask.find({
        userId: req.user._id,
        date: { $gte: startOfDay, $lt: endOfDay },
      });

      const allCompleted = dayTasks.every(t => t.completed);
      if (allCompleted && dayTasks.length > 0) {
        const dailyBonus = await awardDailyCompletion(req.user._id, getDateKey(startOfDay));
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
router.delete('/:id', [
  param('id').isMongoId().withMessage('Task ID must be valid'),
  validateRequest,
], async (req, res) => {
  try {
    const task = await DailyTask.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If it was a recurring manual task, remove it from the recurring list
    // so it stops showing up on future dates
    if (!task.isHabitGenerated) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { recurringTasks: task.title },
      });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// GET /api/tasks/history?month=MM&year=YYYY
router.get('/history', [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year').optional().isInt({ min: 1970, max: 3000 }).withMessage('Year must be valid'),
  validateRequest,
], async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 1));

    const tasks = await DailyTask.find({
      userId: req.user._id,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    // Group by date and compute completion rates
    const dateMap = {};
    tasks.forEach(task => {
      const dateKey = task.date.toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { total: 0, completed: 0, tasksList: [] };
      }
      dateMap[dateKey].total += 1;
      if (task.completed) {
        dateMap[dateKey].completed += 1;
      }
      dateMap[dateKey].tasksList.push({
        id: task._id,
        title: task.title,
        completed: task.completed
      });
    });

    // Convert to array with completion rate
    const history = Object.entries(dateMap).map(([date, counts]) => ({
      date,
      total: counts.total,
      completed: counts.completed,
      rate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
      tasksList: counts.tasksList
    }));

    res.json({ history, month, year });
  } catch (error) {
    console.error('Task history error:', error);
    res.status(500).json({ message: 'Error fetching task history' });
  }
});

export default router;
