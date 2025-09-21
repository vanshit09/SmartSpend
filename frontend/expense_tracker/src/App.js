import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AllExpenses from './components/AllExpenses';
import BudgetManagement from './components/BudgetManagement';
import Analytics from './components/Analytics';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('login');
  const { isAuthenticated, user, logout, loading } = useAuth();

  // Redirect to dashboard if authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentPage('dashboard');
    } else if (!loading) {
      setCurrentPage('login');
    }
  }, [isAuthenticated, user, loading]);

  const handleLogin = () => {
    setCurrentPage('dashboard');
  };

  const handleRegister = () => {
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Navigation */}
        <nav style={{
          backgroundColor: 'white',
          padding: '1rem 2rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#3b82f6',
            margin: 0
          }}>
            SmartSpend
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              Welcome, {user?.name}
            </span>
            <button
              onClick={() => setCurrentPage('dashboard')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 'dashboard' ? '#3b82f6' : 'transparent',
                color: currentPage === 'dashboard' ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('expenses')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 'expenses' ? '#3b82f6' : 'transparent',
                color: currentPage === 'expenses' ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              All Expenses
            </button>
            <button
              onClick={() => setCurrentPage('budget')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 'budget' ? '#3b82f6' : 'transparent',
                color: currentPage === 'budget' ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Budget
            </button>
            <button
              onClick={() => setCurrentPage('analytics')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 'analytics' ? '#3b82f6' : 'transparent',
                color: currentPage === 'analytics' ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Analytics
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Main Content */}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'expenses' && <AllExpenses />}
        {currentPage === 'budget' && <BudgetManagement />}
        {currentPage === 'analytics' && <Analytics />}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {currentPage === 'login' && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentPage('register')}
        />
      )}

      {currentPage === 'register' && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
