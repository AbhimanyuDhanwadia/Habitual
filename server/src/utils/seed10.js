import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DailyTask from '../models/DailyTask.js';
import Todo from '../models/Todo.js';

dotenv.config();

async function seed10() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find();
    if (users.length === 0) {
      console.log('ℹ️ No users found. Please run seedUser.js first.');
      process.exit(0);
    }

    for (const user of users) {
      console.log(`Processing user: ${user.email}`);

      // Generate 10 Daily Tasks for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tasks = [];
      for (let i = 1; i <= 10; i++) {
        tasks.push({
          userId: user._id,
          title: `Dummy Task ${i} for ${user.username}`,
          date: today,
          completed: i % 3 === 0, // Mark every 3rd task as completed
        });
      }

      await DailyTask.insertMany(tasks);
      console.log(`✅ Added 10 Daily Tasks for ${user.username}`);

      // Generate 10 Todos
      const todos = [];
      for (let i = 1; i <= 10; i++) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + (i * 2)); // varying deadlines
        
        todos.push({
          userId: user._id,
          title: `Project phase ${i} for ${user.username}`,
          description: `This is a generated dummy to-do item number ${i}.`,
          deadline: deadline,
          priority: ['low', 'medium', 'high', 'critical'][i % 4],
          phases: [
            { title: 'Phase 1', completed: true },
            { title: 'Phase 2', completed: false }
          ],
        });
      }

      await Todo.insertMany(todos);
      console.log(`✅ Added 10 To-Dos for ${user.username}`);
    }

    console.log('\n🎉 Successfully added 10 items to instances!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding items:', error);
    process.exit(1);
  }
}

seed10();
