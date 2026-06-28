import mongoose from 'mongoose';

const dailyTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  date: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  isHabitGenerated: {
    type: Boolean,
    default: false,
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index for fast daily lookups
dailyTaskSchema.index({ userId: 1, date: 1 });

// When completing a task, set completedAt
dailyTaskSchema.pre('save', function (next) {
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
  } else if (this.isModified('completed') && !this.completed) {
    this.completedAt = null;
  }
  next();
});

const DailyTask = mongoose.model('DailyTask', dailyTaskSchema);
export default DailyTask;
