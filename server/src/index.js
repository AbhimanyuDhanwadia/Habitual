import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

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
import { defaultHabits, defaultShopItems } from './data/seedData.js';

/**
 * Auto-seed default data if not already present.
 * This ensures production databases always have the required habits and shop items
 * without needing a manual `npm run seed` step.
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

// Start server
const start = async () => {
  await connectDB();
  await ensureSeeded();
  app.listen(PORT, () => {
    console.log(`\n🚀 Habitual API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app };
