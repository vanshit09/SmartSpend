import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch expenses for current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      const expensesResponse = await axios.get(`/api/expenses?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(expensesResponse.data.expenses || []);

      // Fetch budgets for current month
      const budgetsResponse = await axios.get(`/api/budgets?month=${currentMonth}&year=${currentYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(budgetsResponse.data.budgets || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from actual expenses data for current month
  const calculateStats = () => {
    // Since we're already fetching current month expenses from API, use them directly
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryStats = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { total: 0, count: 0 };
      }
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {});

    // Calculate total budget for current month
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    // Calculate budget alerts using the spentAmount from API
    const budgetAlerts = budgets.filter(budget => {
      const spentAmount = budget.spentAmount || 0;
      return spentAmount > (budget.amount * 0.8);
    }).length;

    return { totalExpenses, totalBudget, categoryStats, budgetAlerts };
  };

  const stats = calculateStats();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
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
          <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
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
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0
        }}>
          Dashboard Overview
        </h1>
        <p style={{
          color: '#6b7280',
          margin: '0.5rem 0 0 0'
        }}>
          Welcome back! Here's your spending summary.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#3b82f6',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>₹</span>
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Total Expenses
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {formatCurrency(stats.totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#10b981',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>💰</span>
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Total Budget
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#8b5cf6',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>📊</span>
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Categories
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {Object.keys(stats.categoryStats).length}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#f59e0b',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>⚠️</span>
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Budget Alerts
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {stats.budgetAlerts}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;