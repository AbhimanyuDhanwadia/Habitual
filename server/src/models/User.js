import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 24,
  },
  dob: {
    type: Date,
  },
  avatar: {
    type: String,
    default: 'default-1',
  },
  coins: {
    type: Number,
    default: 0,
    min: 0,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  lastActiveDate: {
    type: Date,
  },
  ownedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
  }],
  activeTheme: {
    type: String,
    default: 'default',
  },
  adoptedHabits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});



// Get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    dob: this.dob,
    avatar: this.avatar,
    coins: this.coins,
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak,
    lastActiveDate: this.lastActiveDate,
    ownedItems: this.ownedItems,
    activeTheme: this.activeTheme,
    adoptedHabits: this.adoptedHabits,
    friends: this.friends,
    friendRequests: this.friendRequests,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
