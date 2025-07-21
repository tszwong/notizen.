import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import { AuthProvider } from './components/auth/AuthProvider'
import ProtectedRoute from './components/auth/ProtectedRoute'
import './App.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useEffect } from 'react';

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
      </Routes>
    </AuthProvider>
  )
}