import React, { useState } from 'react';
import axios from 'axios';

const AddExpense = ({ onSave, onCancel, editingExpense = null }) => {
  const [formData, setFormData] = useState({
    title: editingExpense?.title || '',
    amount: editingExpense?.amount || '',
    category: editingExpense?.category || '',
    description: editingExpense?.description || '',
    date: editingExpense?.date || new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    'Food',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Shopping',
    'Healthcare',
    'Education',
    'Travel',
    'Bike Repairing',
    'Petrol',
    'Rent',
    'Insurance',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const expenseData = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date
      };

      if (editingExpense) {
        // Update existing expense
        const response = await axios.put(`/api/expenses/${editingExpense._id}`, expenseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        onSave(response.data.expense);
      } else {
        // Create new expense
        const response = await axios.post('/api/expenses', expenseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        onSave(response.data.expense);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Expense Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="e.g., Grocery shopping"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Amount (₹) *
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="0.00"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Category *
            </label>
            <select
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Date *
            </label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              placeholder="Optional description..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : (editingExpense ? 'Update' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;