import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function seedUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const dummyEmail = 'dummy@example.com';
    const dummyPassword = 'password123'; // Note: password should be at least 6 characters

    let user = await User.findOne({ email: dummyEmail });
    
    if (!user) {
      user = new User({
        email: dummyEmail,
        password: dummyPassword,
        firstName: 'Dummy',
        lastName: 'User',
        username: 'dummyuser',
        dob: new Date('1990-01-01'),
        coins: 1000,
        currentStreak: 5,
        longestStreak: 12
      });
      await user.save();
      console.log(`✅ Dummy user created successfully!`);
    } else {
      console.log(`ℹ️  Dummy user already exists.`);
    }

    console.log(`\n🔑 Login Credentials:`);
    console.log(`Email:    ${dummyEmail}`);
    console.log(`Password: ${dummyPassword}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummy user:', error);
    process.exit(1);
  }
}

seedUser();
