import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BudgetPerformanceChart = ({ budgetPerformance }) => {
  if (!budgetPerformance || budgetPerformance.length === 0) {
    return (
      <div style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <p>No budget data available for the current period</p>
        </div>
      </div>
    );
  }

  const data = {
    labels: budgetPerformance.map(budget => budget.category),
    datasets: [
      {
        label: 'Budget Amount (₹)',
        data: budgetPerformance.map(budget => budget.amount),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Amount Spent (₹)',
        data: budgetPerformance.map(budget => budget.spent),
        backgroundColor: budgetPerformance.map(budget => 
          budget.percentage >= 100 ? 'rgba(239, 68, 68, 0.6)' : 
          budget.percentage >= 80 ? 'rgba(245, 158, 11, 0.6)' : 
          'rgba(59, 130, 246, 0.6)'
        ),
        borderColor: budgetPerformance.map(budget => 
          budget.percentage >= 100 ? 'rgba(239, 68, 68, 1)' : 
          budget.percentage >= 80 ? 'rgba(245, 158, 11, 1)' : 
          'rgba(59, 130, 246, 1)'
        ),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'system-ui, -apple-system, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: 'Budget vs Actual Spending',
        font: {
          size: 16,
          weight: 'bold',
          family: 'system-ui, -apple-system, sans-serif'
        },
        color: '#1F2937'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const budget = budgetPerformance[context.dataIndex];
            
            if (label.includes('Spent')) {
              const percentage = budget.percentage.toFixed(1);
              return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
            }
            return `${label}: ₹${value.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          },
          font: {
            family: 'system-ui, -apple-system, sans-serif'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          font: {
            family: 'system-ui, -apple-system, sans-serif'
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BudgetPerformanceChart;
