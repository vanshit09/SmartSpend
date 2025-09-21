const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/budgets
// @desc    Get all budgets for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const budgets = await Budget.find({
      user: req.user._id,
      month: parseInt(targetMonth),
      year: parseInt(targetYear)
    });

    // Get expenses for the same period to calculate spent amounts
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate spent amounts per category
    const spentByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    // Combine budget and spent data
    const budgetsWithSpent = budgets.map(budget => {
      const spent = spentByCategory[budget.category] || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        ...budget.toObject(),
        spentAmount: spent,
        remainingAmount: Math.max(0, budget.amount - spent),
        percentage: Math.round(percentage),
        isOverBudget: percentage > 100,
        isNearLimit: percentage >= budget.alertThreshold
      };
    });

    res.json({
      budgets: budgetsWithSpent,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/budgets
// @desc    Create or update a budget
// @access  Private
router.post('/', [
  auth,
  body('category').isIn([
    'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping',
    'Healthcare', 'Education', 'Travel', 'Bike Repairing', 'Petrol',
    'Rent', 'Insurance', 'Other'
  ]).withMessage('Invalid category'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Year must be 2020 or later'),
  body('alertThreshold').optional().isInt({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100')
], async (req, res) => {
  try {
    console.log('Budget creation request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, month, year, alertThreshold = 80 } = req.body;

    // Check if budget already exists for this category, month, and year
    const existingBudget = await Budget.findOne({
      user: req.user._id,
      category,
      month,
      year
    });

    let budget;
    if (existingBudget) {
      // Update existing budget
      existingBudget.amount = amount;
      existingBudget.alertThreshold = alertThreshold;
      existingBudget.isActive = true;
      budget = await existingBudget.save();
    } else {
      // Create new budget
      budget = new Budget({
        user: req.user._id,
        category,
        amount,
        month,
        year,
        alertThreshold
      });
      await budget.save();
    }

    res.status(201).json({
      message: 'Budget saved successfully',
      budget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put('/:id', [
  auth,
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('alertThreshold').optional().isInt({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/budgets/alerts
// @desc    Get budget alerts for current month
// @access  Private
router.get('/alerts', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const budgets = await Budget.find({
      user: req.user._id,
      month: currentMonth,
      year: currentYear,
      isActive: true
    });

    // Get expenses for current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate spent amounts per category
    const spentByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    // Generate alerts
    const alerts = budgets.map(budget => {
      const spent = spentByCategory[budget.category] || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        category: budget.category,
        budgetAmount: budget.amount,
        spentAmount: spent,
        percentage: Math.round(percentage),
        isOverBudget: percentage > 100,
        isNearLimit: percentage >= budget.alertThreshold,
        alertThreshold: budget.alertThreshold
      };
    }).filter(alert => alert.isOverBudget || alert.isNearLimit);

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

