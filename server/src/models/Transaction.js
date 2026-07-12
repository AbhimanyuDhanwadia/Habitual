import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['earned', 'spent'],
  },
  source: {
    type: String,
    required: true,
    enum: ['streak', 'milestone', 'daily-completion', 'task-complete', 'purchase', 'signup-bonus'],
  },
  description: {
    type: String,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTask',
  },
  dateKey: {
    type: String,
    trim: true,
  },
  rewardKey: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
}, {
  timestamps: true,
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, rewardKey: 1 }, { unique: true, sparse: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
