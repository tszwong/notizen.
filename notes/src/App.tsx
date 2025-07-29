import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useEffect } from 'react';
import './App.css';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    if (location.pathname === '/login' || location.pathname === '/register') {
      root.classList.add('auth-page');
    } else {
      root.classList.remove('auth-page');
    }
  }, [location.pathname]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </AuthProvider>
  )
}