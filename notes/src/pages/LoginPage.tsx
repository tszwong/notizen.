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
            {/* <span
                style={{
                fontFamily: "'Nunito Sans', sans-serif",
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: '3rem',
                color: '#000',
                letterSpacing: '0.03em',
                marginLeft: '2.5rem',
                marginRight: '2.5rem',
                // marginBottom: '2rem',
                userSelect: 'none',
                }}
            >
                notizen.
            </span> */}
            <LoginFormComponent />
        </AuthLayout>
    );
}