import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CategoryPieChart from './charts/CategoryPieChart';
import MonthlyBarChart from './charts/MonthlyBarChart';
import BudgetPerformanceChart from './charts/BudgetPerformanceChart';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all expenses
      const expensesResponse = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(expensesResponse.data.expenses || []);

      // Fetch budgets for current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const budgetsResponse = await axios.get(`/api/budgets?month=${currentMonth}&year=${currentYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(budgetsResponse.data.budgets || []);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  // Filter expenses by period
  const getFilteredExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();

      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expenseDate >= weekAgo;
        case 'month':
          return expenseMonth === currentMonth && expenseYear === currentYear;
        case 'year':
          return expenseYear === currentYear;
        default:
          return true;
      }
    });
  };

  const filteredExpenses = getFilteredExpenses();

  // Calculate analytics
  const calculateAnalytics = () => {
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryStats = filteredExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { total: 0, count: 0, expenses: [] };
      }
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      acc[expense.category].expenses.push(expense);
      return acc;
    }, {});

    // Calculate average expense
    const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

    // Find top spending category
    const topCategory = Object.entries(categoryStats).reduce((max, [category, data]) => 
      data.total > (max ? max.total : 0) ? { category, ...data } : max, null
    );

    // Calculate budget performance for current month budgets
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonthBudgets = budgets.filter(budget => 
      budget.month === currentMonth && budget.year === currentYear
    );
    
    const budgetPerformance = currentMonthBudgets.map(budget => {
      const categoryExpenses = filteredExpenses
        .filter(expense => expense.category === budget.category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        ...budget,
        spent: categoryExpenses,
        percentage: (categoryExpenses / budget.amount) * 100,
        remaining: budget.amount - categoryExpenses
      };
    });

    return {
      totalExpenses,
      averageExpense,
      topCategory,
      categoryStats,
      budgetPerformance,
      totalTransactions: filteredExpenses.length
    };
  };

  const analytics = calculateAnalytics();

  // Get period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={fetchAnalyticsData}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            Analytics & Insights
          </h1>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '1rem'
            }}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <p style={{
          color: '#6b7280',
          margin: 0
        }}>
          Detailed analysis of your spending patterns for {getPeriodLabel().toLowerCase()}.
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            💰
          </div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
            Total Spent
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {formatCurrency(analytics.totalExpenses)}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            📊
          </div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
            Transactions
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {analytics.totalTransactions}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            📈
          </div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
            Average Expense
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {formatCurrency(analytics.averageExpense)}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            🏆
          </div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
            Top Category
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {analytics.topCategory ? analytics.topCategory.category : 'N/A'}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem'
        }}>
          Spending by Category
        </h3>
        
        {Object.keys(analytics.categoryStats).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <p>No expenses found for the selected period.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(analytics.categoryStats)
              .sort(([,a], [,b]) => b.total - a.total)
              .map(([category, data]) => {
                const percentage = analytics.totalExpenses > 0 
                  ? (data.total / analytics.totalExpenses) * 100 
                  : 0;
                
                return (
                  <div key={category} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#1f2937', fontWeight: '500' }}>
                        {category}
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        {data.count} transactions
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#1f2937', fontWeight: 'bold' }}>
                        {formatCurrency(data.total)}
                      </p>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Category Pie Chart */}
        {Object.keys(analytics.categoryStats).length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <CategoryPieChart 
              categoryStats={analytics.categoryStats} 
              totalExpenses={analytics.totalExpenses} 
            />
          </div>
        )}

        {/* Spending Trend Bar Chart */}
        {filteredExpenses.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <MonthlyBarChart 
              expenses={filteredExpenses} 
              selectedPeriod={selectedPeriod} 
            />
          </div>
        )}

      </div>

      {/* Budget Performance */}
      {budgets.filter(budget => budget.month === new Date().getMonth() + 1 && budget.year === new Date().getFullYear()).length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Budget Performance
          </h3>
          
          {/* Budget Performance Chart */}
          <div style={{ marginBottom: '2rem' }}>
            <BudgetPerformanceChart budgetPerformance={analytics.budgetPerformance} />
          </div>
          
          {/* Budget Performance List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analytics.budgetPerformance.map((budget) => {
              const statusColor = budget.percentage >= 100 ? '#ef4444' : 
                                budget.percentage >= 80 ? '#f59e0b' : '#10b981';
              
              return (
                <div key={budget.id} style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: '#1f2937', fontWeight: '500' }}>
                      {budget.category}
                    </h4>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: statusColor,
                      color: 'white',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {budget.percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {budget.remaining >= 0 ? `${formatCurrency(budget.remaining)} left` : `${formatCurrency(Math.abs(budget.remaining))} over`}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(budget.percentage, 100)}%`,
                        height: '100%',
                        backgroundColor: statusColor,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
