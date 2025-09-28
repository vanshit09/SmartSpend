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

    console.log(`Fetching budgets for user: ${req.user._id}, month: ${targetMonth}, year: ${targetYear}`);

    const budgets = await Budget.find({
      user: req.user._id,
      month: parseInt(targetMonth),
      year: parseInt(targetYear)
    });

    console.log(`Found ${budgets.length} budgets:`, budgets.map(b => `${b.category} - ${b.month}/${b.year}`));

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
// @desc    Create or update a budget - FINAL BULLETPROOF VERSION
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== BUDGET CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user._id);

    const { category, amount, month, year, alertThreshold = 80 } = req.body;

    // Validate required fields
    if (!category || !amount || !month || !year) {
      return res.status(400).json({ 
        message: 'Missing required fields: category, amount, month, year' 
      });
    }

    console.log(`PROCESSING: ${category} for ${month}/${year}, amount: ${amount}`);

    // STEP 1: Delete any existing budget for this combination
    const deleteResult = await Budget.deleteMany({
      user: req.user._id,
      category: category,
      month: parseInt(month),
      year: parseInt(year)
    });
    console.log(`DELETED ${deleteResult.deletedCount} existing budgets`);

    // STEP 2: Create new budget with unique timestamp
    const newBudget = {
      user: req.user._id,
      category: category,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      alertThreshold: parseInt(alertThreshold),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('CREATING new budget:', newBudget);

    const budget = await Budget.create(newBudget);
    console.log('SUCCESS: Budget created with ID:', budget._id);

    return res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget: budget
    });

  } catch (error) {
    console.error('=== BUDGET CREATION ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    return res.status(500).json({ 
      success: false,
      message: 'Budget creation failed', 
      error: error.message,
      details: 'Please check server logs for more information'
    });
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

// @route   DELETE /api/budgets/reset
// @desc    Delete all budgets for user (reset)
// @access  Private
router.delete('/reset', auth, async (req, res) => {
  try {
    console.log(`Resetting all budgets for user: ${req.user._id}`);
    
    const result = await Budget.deleteMany({ user: req.user._id });
    console.log(`Deleted ${result.deletedCount} budgets`);
    
    res.json({
      message: 'All budgets reset successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Budget reset error:', error);
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
});

// @route   POST /api/budgets/cleanup
// @desc    Clean up duplicate budgets
// @access  Private
router.post('/cleanup', auth, async (req, res) => {
  try {
    console.log(`Starting budget cleanup for user: ${req.user._id}`);
    
    // Find all budgets for this user
    const allBudgets = await Budget.find({ user: req.user._id });
    console.log(`Found ${allBudgets.length} total budgets`);
    
    // Group by category, month, year
    const budgetGroups = {};
    allBudgets.forEach(budget => {
      const key = `${budget.category}-${budget.month}-${budget.year}`;
      if (!budgetGroups[key]) {
        budgetGroups[key] = [];
      }
      budgetGroups[key].push(budget);
    });
    
    let duplicatesRemoved = 0;
    
    // For each group, keep only the most recent one
    for (const [key, budgets] of Object.entries(budgetGroups)) {
      if (budgets.length > 1) {
        console.log(`Found ${budgets.length} duplicates for ${key}`);
        
        // Sort by updatedAt descending (most recent first)
        budgets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Keep the first (most recent), delete the rest
        const toKeep = budgets[0];
        const toDelete = budgets.slice(1);
        
        console.log(`Keeping budget ${toKeep._id}, deleting ${toDelete.length} duplicates`);
        
        for (const budget of toDelete) {
          await Budget.findByIdAndDelete(budget._id);
          duplicatesRemoved++;
        }
      }
    }
    
    console.log(`Cleanup completed. Removed ${duplicatesRemoved} duplicate budgets`);
    
    res.json({
      message: 'Budget cleanup completed',
      duplicatesRemoved,
      totalBudgets: allBudgets.length - duplicatesRemoved
    });
  } catch (error) {
    console.error('Budget cleanup error:', error);
    res.status(500).json({ message: 'Cleanup failed', error: error.message });
  }
});

// @route   GET /api/budgets/debug
// @desc    Get all budgets for debugging (all months/years)
// @access  Private
router.get('/debug', auth, async (req, res) => {
  try {
    const allBudgets = await Budget.find({
      user: req.user._id
    }).sort({ year: -1, month: -1, category: 1 });

    console.log(`DEBUG: Found ${allBudgets.length} total budgets for user ${req.user._id}`);
    allBudgets.forEach(budget => {
      console.log(`- ${budget.category}: ${budget.month}/${budget.year} - Amount: ${budget.amount}`);
    });

    res.json({
      totalBudgets: allBudgets.length,
      budgets: allBudgets.map(b => ({
        id: b._id,
        category: b.category,
        month: b.month,
        year: b.year,
        amount: b.amount,
        monthName: new Date(0, b.month - 1).toLocaleString('default', { month: 'long' })
      }))
    });
  } catch (error) {
    console.error('Debug budgets error:', error);
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

