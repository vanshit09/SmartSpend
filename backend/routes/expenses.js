const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get all expenses for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email');

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/stats
// @desc    Get expense statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    // Get expenses for the specified month/year
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryStats = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { total: 0, count: 0 };
      }
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {});

    // Get budget information
    const budgets = await Budget.find({
      user: req.user._id,
      month: parseInt(targetMonth),
      year: parseInt(targetYear),
      isActive: true
    });

    const budgetAlerts = budgets.map(budget => {
      const categoryExpense = categoryStats[budget.category]?.total || 0;
      const percentage = (categoryExpense / budget.amount) * 100;
      
      return {
        category: budget.category,
        budgetAmount: budget.amount,
        spentAmount: categoryExpense,
        percentage: Math.round(percentage),
        isOverBudget: percentage > 100,
        isNearLimit: percentage >= budget.alertThreshold
      };
    });

    res.json({
      totalExpenses,
      categoryStats,
      budgetAlerts,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('category').isIn([
    'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping',
    'Healthcare', 'Education', 'Travel', 'Bike Repairing', 'Petrol',
    'Rent', 'Insurance', 'Other'
  ]).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = new Expense({
      ...req.body,
      user: req.user._id
    });

    await expense.save();
    await expense.populate('user', 'name email');

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('category').optional().isIn([
    'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping',
    'Healthcare', 'Education', 'Travel', 'Bike Repairing', 'Petrol',
    'Rent', 'Insurance', 'Other'
  ]).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.populate('user', 'name email');

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

