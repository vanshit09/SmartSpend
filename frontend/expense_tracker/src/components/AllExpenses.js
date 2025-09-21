import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddExpense from './AddExpense';

const AllExpenses = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch expenses from API
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data.expenses || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories for filter
  const categories = [...new Set(expenses.map(expense => expense.category))];

  // Filter expenses based on search, category, and time period
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    
    // Time period filtering
    const expenseDate = new Date(expense.date);
    const now = new Date();
    let matchesPeriod = true;
    
    switch (selectedPeriod) {
      case '7days':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesPeriod = expenseDate >= weekAgo;
        break;
      case '30days':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesPeriod = expenseDate >= monthAgo;
        break;
      case 'thismonth':
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        matchesPeriod = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        break;
      case 'thisyear':
        const currentYearOnly = now.getFullYear();
        matchesPeriod = expenseDate.getFullYear() === currentYearOnly;
        break;
      case 'all':
      default:
        matchesPeriod = true;
        break;
    }
    
    return matchesSearch && matchesCategory && matchesPeriod;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  // CRUD Functions
  const handleAddExpense = async (expenseData) => {
    try {
      // Refresh expenses from API
      await fetchExpenses();
      setShowAddForm(false);
      alert('Expense added successfully!');
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleEditExpense = async (expenseData) => {
    try {
      // Refresh expenses from API
      await fetchExpenses();
      setEditingExpense(null);
      alert('Expense updated successfully!');
    } catch (err) {
      console.error('Error updating expense:', err);
      alert('Failed to update expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh expenses from API
        await fetchExpenses();
        alert('Expense deleted successfully!');
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense. Please try again.');
      }
    }
  };

  const handleSaveExpense = (expenseData) => {
    if (editingExpense) {
      handleEditExpense(expenseData);
    } else {
      handleAddExpense(expenseData);
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingExpense(null);
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
          <p style={{ color: '#6b7280' }}>Loading expenses...</p>
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
            All Expenses
          </h1>
          <button
            onClick={() => setShowAddForm(true)}
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
            + Add Expense
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                width: '250px'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}>
              🔍
            </span>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '1rem'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

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
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="thismonth">This Month</option>
            <option value="thisyear">This Year</option>
          </select>

          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            {filteredExpenses.length} of {expenses.length} expenses
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        {filteredExpenses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#6b7280'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              📊
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              {expenses.length === 0 ? 'No expenses yet' : 'No expenses match your filters'}
            </h3>
            <p style={{
              marginBottom: '1.5rem',
              fontSize: '1rem'
            }}>
              {expenses.length === 0 
                ? 'Start tracking your expenses by adding your first expense!'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {expenses.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
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
                + Add Your First Expense
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Title
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Category
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Amount
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Date
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{
                      padding: '0.75rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{expense.title || 'No title'}</div>
                        {expense.description && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {expense.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {expense.category}
                      </span>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {formatCurrency(expense.amount)}
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {formatDate(expense.date)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setEditingExpense(expense)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Expense Model */}
      {(showAddForm || editingExpense) && (
        <AddExpense
          onSave={handleSaveExpense}
          onCancel={handleCancelForm}
          editingExpense={editingExpense}
        />
      )}
    </div>
  );
};

export default AllExpenses;
