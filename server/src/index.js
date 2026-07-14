import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import todoRoutes from './routes/todos.js';
import habitRoutes from './routes/habits.js';
import shopRoutes from './routes/shop.js';
import userRoutes from './routes/user.js';
import friendRoutes from './routes/friends.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const serverStartedAt = Date.now();
const enableRequestTiming = process.env.REQUEST_TIMING !== 'false';
const slowRequestMs = Number(process.env.SLOW_REQUEST_MS || 750);
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use('/api', apiLimiter);
app.use('/api/auth', sensitiveLimiter);
app.use('/api/friends', sensitiveLimiter);

if (enableRequestTiming) {
  app.use('/api', (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const originalWriteHead = res.writeHead;

    res.writeHead = function writeHeadWithTiming(...args) {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const roundedDuration = Math.round(durationMs);
      const uptimeSeconds = Math.round((Date.now() - serverStartedAt) / 1000);
      const isSlow = durationMs >= slowRequestMs;

      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${roundedDuration}ms`);
      }

      if (isSlow || process.env.NODE_ENV !== 'production') {
        console.log(`[timing] ${req.method} ${req.originalUrl} ${res.statusCode} ${roundedDuration}ms uptime=${uptimeSeconds}s slow=${isSlow}`);
      }

      return originalWriteHead.apply(this, args);
    };

    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/user', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

import Habit from './models/Habit.js';
import ShopItem from './models/ShopItem.js';
import DailyTask from './models/DailyTask.js';
import User from './models/User.js';
import { defaultHabits, defaultShopItems } from './data/seedData.js';

/**
 * Auto-seed default data if not already present.
 */
const ensureSeeded = async () => {
  try {
    const habitCount = await Habit.countDocuments();
    if (habitCount === 0) {
      console.log('⚠️  No habits found in database. Auto-seeding defaults...');
      await Habit.insertMany(defaultHabits);
      console.log(`✅ Auto-seeded ${defaultHabits.length} default habits`);
    }

    const shopCount = await ShopItem.countDocuments();
    if (shopCount === 0) {
      console.log('⚠️  No shop items found in database. Auto-seeding defaults...');
      await ShopItem.insertMany(defaultShopItems);
      console.log(`✅ Auto-seeded ${defaultShopItems.length} shop items`);
    }
  } catch (error) {
    console.error('Auto-seed warning (non-fatal):', error.message);
  }
};

/**
 * One-time migration: backfill existing manual daily tasks into user.recurringTasks.
 * This ensures users who already created tasks before the recurring feature
 * will have those tasks auto-generated on future dates.
 */
const migrateRecurringTasks = async () => {
  try {
    const users = await User.find({});
    for (const user of users) {
      // Skip users who already have recurringTasks set
      if (user.recurringTasks && user.recurringTasks.length > 0) continue;

      // Find all unique manual task titles for this user
      const manualTasks = await DailyTask.distinct('title', {
        userId: user._id,
        isHabitGenerated: false,
      });

      if (manualTasks.length > 0) {
        user.recurringTasks = manualTasks;
        await user.save();
        console.log(`✅ Migrated ${manualTasks.length} recurring tasks for user ${user.username}`);
      }
    }
  } catch (error) {
    console.error('Migration warning (non-fatal):', error.message);
  }
};

// Start server
const start = async () => {
  await connectDB();
  await ensureSeeded();
  await migrateRecurringTasks();
  app.listen(PORT, () => {
    console.log(`\n🚀 Habitual API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app };
