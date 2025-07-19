import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider } from '../../firebase';

export default function LoginFormComponent() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Attempting email login for:', email);
        try {
            await signInWithEmailAndPassword(auth, email, password)
            console.log('Email login successful for:', email);
            // Redirect to home page after successful login
            navigate('/');
        } catch (err: any) {
            console.error('Email login failed:', err);
            setError(err.message);
        }
    }

    const handleGoogleLogin = async () => {
        console.log('Attempting Google login');
        try {
            await signInWithPopup(auth, googleProvider)
            console.log('Google login successful');
            // Redirect to home page after successful login
            navigate('/');
        } catch (err: any) {
            console.error('Google login failed:', err);
            setError(err.message);
        }
    }

    const handleGithubLogin = async () => {
        console.log('Attempting GitHub login');
        try {
            await signInWithPopup(auth, githubProvider)
            console.log('GitHub login successful');
            // Redirect to home page after successful login
            navigate('/');
        } catch (err: any) {
            console.error('GitHub login failed:', err);
            setError(err.message);
        }
    }

    return (
        <div
            style={{
                backgroundColor: 'black',
                padding: '1em 2em',
                display: 'inline-block'
            }}
        >
            <button onClick={handleGoogleLogin}>Sign in with Google</button>
            <button onClick={handleGithubLogin}>Sign in with GitHub</button>
            <form onSubmit={handleEmailLogin}>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <button type="submit">Sign in with Email</button>
            </form>
            
            {error && <div>{error}</div>}
            <button onClick={() => navigate('/register')}>Register</button>
        </div>
    );
}