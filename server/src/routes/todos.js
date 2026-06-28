import express from 'express';
import { body } from 'express-validator';
import Todo from '../models/Todo.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// GET /api/todos
router.get('/', async (req, res) => {
  try {
    const { completed, priority, sort } = req.query;
    const query = { userId: req.user._id };

    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    if (priority) {
      query.priority = priority;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'deadline') sortOption = { deadline: 1 };
    if (sort === 'priority') sortOption = { priority: -1 };

    const todos = await Todo.find(query).sort(sortOption);
    res.json({ todos });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Error fetching todos' });
  }
});

// POST /api/todos
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
], async (req, res) => {
  try {
    const { title, description, deadline, priority, phases } = req.body;

    const todo = await Todo.create({
      userId: req.user._id,
      title,
      description,
      deadline: deadline || undefined,
      priority: priority || 'medium',
      phases: phases || [],
    });

    res.status(201).json({ todo });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Error creating todo' });
  }
});

// PATCH /api/todos/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, description, deadline, priority, phases } = req.body;
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user._id });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (deadline !== undefined) todo.deadline = deadline;
    if (priority !== undefined) todo.priority = priority;
    if (phases !== undefined) todo.phases = phases;

    await todo.save();
    res.json({ todo });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Error updating todo' });
  }
});

// PATCH /api/todos/:id/phases/:phaseIndex
router.patch('/:id/phases/:phaseIndex', async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const phaseIdx = parseInt(req.params.phaseIndex);
    if (phaseIdx < 0 || phaseIdx >= todo.phases.length) {
      return res.status(400).json({ message: 'Invalid phase index' });
    }

    todo.phases[phaseIdx].completed = !todo.phases[phaseIdx].completed;
    todo.phases[phaseIdx].completedAt = todo.phases[phaseIdx].completed ? new Date() : null;

    // Check if all phases completed → mark todo as done
    todo.checkCompletion();
    await todo.save();

    res.json({ todo });
  } catch (error) {
    console.error('Toggle phase error:', error);
    res.status(500).json({ message: 'Error toggling phase' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Error deleting todo' });
  }
});

export default router;
