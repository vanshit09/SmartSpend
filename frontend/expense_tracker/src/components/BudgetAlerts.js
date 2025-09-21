import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BudgetAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    // Check for alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/budgets/alerts');
      setAlerts(response.data.alerts);
      
      // Show toast notifications for new alerts
      response.data.alerts.forEach(alert => {
        if (alert.isOverBudget) {
          toast.error(`🚨 Budget Alert: You've exceeded your ${alert.category} budget!`, {
            autoClose: 8000,
            position: "top-right"
          });
        } else if (alert.isNearLimit) {
          toast.warning(`⚠️ Budget Warning: You're approaching your ${alert.category} budget limit!`, {
            autoClose: 6000,
            position: "top-right"
          });
        }
      });
    } catch (error) {
      console.error('Fetch alerts error:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              Great! You're within all your budget limits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${
            alert.isOverBudget
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {alert.isOverBudget ? (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${
                alert.isOverBudget ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {alert.isOverBudget ? 'Budget Exceeded' : 'Budget Warning'}
              </h3>
              <div className="mt-2 text-sm">
                <p className={`${
                  alert.isOverBudget ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  <strong>{alert.category}</strong>: You've spent {formatCurrency(alert.spentAmount)} 
                  out of your {formatCurrency(alert.budgetAmount)} budget ({alert.percentage}%)
                </p>
                {alert.isOverBudget && (
                  <p className="mt-1 text-red-600 font-medium">
                    You're {formatCurrency(alert.spentAmount - alert.budgetAmount)} over budget!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BudgetAlerts;

