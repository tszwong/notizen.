import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider } from '../../firebase';

import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

export default function LoginFormComponent() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password)
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        }
    }

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider)
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        }
    }

    const handleGithubLogin = async () => {
        try {
            await signInWithPopup(auth, githubProvider)
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        }
    }

    // Retro/Mechanical style helpers
    const retroFont = {
        fontFamily: 'IBM Plex Mono, Share Tech Mono, VT323, monospace',
    };
    const buttonStyle = {
        ...retroFont,
        background: 'linear-gradient(90deg, #e0d8c3 0%, #b7b1a3 100%)',
        color: '#232323',
        border: '2.5px solid #7A6C4D',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '1.1rem',
        padding: '0.7em 1.5em',
        margin: '0.5em 0',
        boxShadow: '0 2px 0 #7A6C4D, 0 4px 12px #b7b1a355',
        cursor: 'pointer',
        transition: 'all 0.18s',
        letterSpacing: '1px',
        outline: 'none',
        display: 'block',
        width: '100%',
    } as React.CSSProperties;
    const inputStyle = {
        ...retroFont,
        background: '#f4f1eb',
        border: '2px solid #7A6C4D',
        borderRadius: '10px',
        fontSize: '1.1rem',
        padding: '0.7em 1em',
        margin: '0.5em 0',
        width: '100%',
        color: '#232323',
        outline: 'none',
        boxSizing: 'border-box' as const,
    };
    const dividerStyle = {
        margin: '1.2em 0',
        border: 'none',
        borderTop: '2px dashed #b7b1a3',
        width: '100%',
    };

    return (
        <div style={{ ...retroFont }}>
            <button style={{ ...buttonStyle, background: '#fffbe6', color: '#232323' }} onClick={handleGoogleLogin}>
                <span role="img" aria-label="Google" style={{marginRight:8}}> <GoogleIcon /> </span> Sign in with Google
            </button>
            <button style={{ ...buttonStyle, background: '#e6e6e6', color: '#232323' }} onClick={handleGithubLogin}>
                <span role="img" aria-label="GitHub" style={{marginRight:8}}> <GitHubIcon /> </span> Sign in with GitHub
            </button>
            <hr style={dividerStyle} />
            <form onSubmit={handleEmailLogin}>
                <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <button type="submit" style={{ ...buttonStyle, background: '#e0d8c3', color: '#7A6C4D' }}>
                    <span role="img" aria-label="Envelope" style={{marginRight:8}}> <MailOutlineIcon /> </span> Sign in with Email
                </button>
            </form>
            {error && <div style={{ color: '#e57373', marginTop: '0.7em', fontWeight: 600 }}>{error}</div>}
            <button onClick={() => navigate('/register')} style={{ ...buttonStyle, background: 'transparent', color: '#7A6C4D', border: '2px dashed #7A6C4D', marginTop: '1.5em' }}>
                Need an account? Register
            </button>
        </div>
    );
}