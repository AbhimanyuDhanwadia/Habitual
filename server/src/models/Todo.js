import mongoose from 'mongoose';

const phaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  deadline: {
    type: Date,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
}, { _id: true });

const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  deadline: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  phases: [phaseSchema],
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

todoSchema.index({ userId: 1, completed: 1 });
todoSchema.index({ userId: 1, deadline: 1 });
todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, priority: 1 });

// Auto-complete todo when all phases are done
todoSchema.methods.checkCompletion = function () {
  if (this.phases.length > 0) {
    const allDone = this.phases.every(p => p.completed);
    if (allDone && !this.completed) {
      this.completed = true;
      this.completedAt = new Date();
    } else if (!allDone && this.completed) {
      this.completed = false;
      this.completedAt = null;
    }
  }
};

const Todo = mongoose.model('Todo', todoSchema);
export default Todo;
