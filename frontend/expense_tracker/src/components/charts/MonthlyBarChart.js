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

const MonthlyBarChart = ({ expenses, selectedPeriod }) => {
  // Generate data based on selected period
  const generateChartData = () => {
    const now = new Date();
    let labels = [];
    let data = [];

    switch (selectedPeriod) {
      case 'week':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-IN', { weekday: 'short' }));
          
          const dayExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.toDateString() === date.toDateString();
          });
          
          data.push(dayExpenses.reduce((sum, expense) => sum + expense.amount, 0));
        }
        break;
        
      case 'month':
        // Last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.getDate().toString());
          
          const dayExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.toDateString() === date.toDateString();
          });
          
          data.push(dayExpenses.reduce((sum, expense) => sum + expense.amount, 0));
        }
        break;
        
      case 'year':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          labels.push(date.toLocaleDateString('en-IN', { month: 'short' }));
          
          const monthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === date.getMonth() && 
                   expenseDate.getFullYear() === date.getFullYear();
          });
          
          data.push(monthExpenses.reduce((sum, expense) => sum + expense.amount, 0));
        }
        break;
        
      default:
        // All time - show by month
        const monthlyData = {};
        expenses.forEach(expense => {
          const date = new Date(expense.date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, label: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) };
          }
          monthlyData[monthKey].total += expense.amount;
        });
        
        const sortedMonths = Object.keys(monthlyData).sort();
        labels = sortedMonths.map(month => monthlyData[month].label);
        data = sortedMonths.map(month => monthlyData[month].total);
        break;
    }

    return { labels, data };
  };

  const { labels, data } = generateChartData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Amount Spent (₹)',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Spending Trend - ${selectedPeriod === 'week' ? 'Last 7 Days' : 
               selectedPeriod === 'month' ? 'Last 30 Days' : 
               selectedPeriod === 'year' ? 'Last 12 Months' : 'All Time'}`,
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
            return `₹${context.parsed.y.toLocaleString('en-IN')}`;
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
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default MonthlyBarChart;
