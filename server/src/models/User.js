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
  password: {
    type: String,
    minlength: 6,
    select: false, // Don't return password by default
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allow null for non-Google users
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
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

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
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
