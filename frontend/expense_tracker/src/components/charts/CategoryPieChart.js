import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const CategoryPieChart = ({ categoryStats, totalExpenses }) => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#14B8A6', // Teal
    '#A855F7', // Violet
  ];

  const data = {
    labels: Object.keys(categoryStats),
    datasets: [
      {
        data: Object.values(categoryStats).map(stat => stat.total),
        backgroundColor: colors.slice(0, Object.keys(categoryStats).length),
        borderColor: colors.slice(0, Object.keys(categoryStats).length).map(color => color + '80'),
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
        text: 'Spending by Category',
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
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / totalExpenses) * 100).toFixed(1);
            return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
      }
    }
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default CategoryPieChart;
