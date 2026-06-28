import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['fitness', 'mindfulness', 'nutrition', 'sleep', 'social', 'learning'],
  },
  description: {
    type: String,
    required: true,
  },
  benefits: {
    type: String,
    required: true,
  },
  howTo: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  icon: {
    type: String,
    default: '✨',
  },
  isDefault: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

habitSchema.index({ category: 1 });

const Habit = mongoose.model('Habit', habitSchema);
export default Habit;
