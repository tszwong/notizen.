import React from "react";
import { Navigate } from 'react-router-dom';
import { useAuth } from "../components/auth/AuthProvider";
import LoginFormComponent from "../components/auth/LoginForm";
import { CircularProgress, Box } from '@mui/material';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
    const { user, loading } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                sx={{ background: 'rgb(244,241,235)' }}
            >
                <CircularProgress size={60} sx={{ color: '#7A6C4D' }} />
            </Box>
        );
    }

    // Redirect to home if already authenticated
    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <AuthLayout>
            <h1 style={{
                fontFamily: 'IBM Plex Mono, Share Tech Mono, VT323, monospace',
                fontSize: '2.2rem',
                color: '#7A6C4D',
                marginBottom: '2rem',
                letterSpacing: '2px',
                textAlign: 'center',
                textShadow: '0 2px 0 #e0d8c3, 0 4px 8px #b7b1a3',
            }}>
                Welcome Back <span style={{color:'#232323'}}>✦</span>
            </h1>
            <LoginFormComponent />
        </AuthLayout>
    );
}