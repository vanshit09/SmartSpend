import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BudgetManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch budgets from API
  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(response.data.budgets || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to fetch budgets');
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

  // Calculate spending for each budget category for selected month/year
  const calculateSpending = (category) => {
    const budget = budgets.find(b => b.category === category);
    return budget ? budget.spentAmount || 0 : 0;
  };

  // Calculate budget status
  const getBudgetStatus = (budget) => {
    const spending = calculateSpending(budget.category);
    const percentage = (spending / budget.amount) * 100;
    
    if (percentage >= 100) return { status: 'exceeded', color: '#ef4444', text: 'Exceeded' };
    if (percentage >= 80) return { status: 'warning', color: '#f59e0b', text: 'Warning' };
    return { status: 'good', color: '#10b981', text: 'Good' };
  };

  // Handle form submission
  const handleSaveBudget = async (budgetData) => {
    try {
      const token = localStorage.getItem('token');
      const budgetPayload = {
        category: budgetData.category,
        amount: budgetData.amount,
        month: selectedMonth,
        year: selectedYear,
        alertThreshold: 80
      };

      if (editingBudget) {
        // Update existing budget
        await axios.put(`/api/budgets/${editingBudget._id}`, budgetPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEditingBudget(null);
        alert('Budget updated successfully!');
      } else {
        // Create new budget
        await axios.post('/api/budgets', budgetPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShowAddForm(false);
        alert('Budget added successfully!');
      }
      
      // Refresh budgets
      await fetchBudgets();
    } catch (err) {
      console.error('Error saving budget:', err);
      alert('Failed to save budget. Please try again.');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/budgets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Budget deleted successfully!');
        // Refresh budgets
        await fetchBudgets();
      } catch (err) {
        console.error('Error deleting budget:', err);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingBudget(null);
  };

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
            Budget Management
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
            + Add Budget
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white'
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white'
            }}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <span style={{
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Viewing budgets for {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
          </span>
        </div>
        
        <p style={{
          color: '#6b7280',
          margin: 0
        }}>
          Set monthly budgets for different categories and track your spending.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          backgroundColor: 'white',
          padding: '3rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            ⏳
          </div>
          <p style={{ color: '#6b7280' }}>Loading budgets...</p>
        </div>
      )}

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

      {/* Budget Cards */}
      {!loading && !error && budgets.filter(budget => budget.month === selectedMonth && budget.year === selectedYear).length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '3rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            💰
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            No budgets set yet
          </h3>
          <p style={{
            marginBottom: '1.5rem',
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Set your first budget to start tracking your spending limits!
          </p>
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
            + Set Your First Budget
          </button>
        </div>
      ) : !loading && !error && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {budgets
            .filter(budget => budget.month === selectedMonth && budget.year === selectedYear)
            .map((budget) => {
            const spending = calculateSpending(budget.category);
            const status = getBudgetStatus(budget);
            const percentage = Math.min((spending / budget.amount) * 100, 100);
            
            return (
              <div key={budget.id} style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {budget.category}
                    </h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: '0.25rem 0 0 0'
                    }}>
                      {new Date(0, budget.month - 1).toLocaleString('default', { month: 'long' })} {budget.year}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: status.color,
                    color: 'white',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {status.text}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Spent</span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatCurrency(spending)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: status.color,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setEditingBudget(budget)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(budget._id)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Budget Form */}
      {(showAddForm || editingBudget) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1.5rem'
            }}>
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </h2>

            <BudgetForm
              budget={editingBudget}
              onSave={handleSaveBudget}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Budget Form Component
const BudgetForm = ({ budget, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    category: budget?.category || '',
    amount: budget?.amount || '',
    description: budget?.description || '',
    month: budget?.month || new Date().getMonth() + 1,
    year: budget?.year || new Date().getFullYear()
  });

  const categories = [
    'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping',
    'Healthcare', 'Education', 'Travel', 'Bike Repairing', 'Petrol',
    'Rent', 'Insurance', 'Other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.month || !formData.year) {
      alert('Please fill in all required fields');
      return;
    }

    const budgetData = {
      id: budget?.id || Date.now().toString(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      createdAt: budget?.createdAt || new Date().toISOString()
    };

    onSave(budgetData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Month *
          </label>
          <select
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            required
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Year *
          </label>
          <select
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            required
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Monthly Budget Amount (₹) *
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
          placeholder="Enter budget amount"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
            resize: 'vertical',
            minHeight: '80px'
          }}
          placeholder="Add a description for this budget"
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          {budget ? 'Update Budget' : 'Add Budget'}
        </button>
      </div>
    </form>
  );
};

export default BudgetManagement;