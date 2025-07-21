import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';

export default function RegisterFormComponent() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setSuccess('Registration successful! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message);
        }
    };

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
            <form onSubmit={handleRegister}>
                <input
                    style={inputStyle}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                />
                <input
                    style={inputStyle}
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <button type="submit" style={{ ...buttonStyle, background: '#e0d8c3', color: '#7A6C4D' }}>
                    <span role="img" aria-label="Register" style={{marginRight:8}}>📝</span> Register
                </button>
            </form>
            <hr style={dividerStyle} />
            {error && <div style={{ color: '#e57373', marginTop: '0.7em', fontWeight: 600 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginTop: '0.7em', fontWeight: 600 }}>{success}</div>}
            <button onClick={() => navigate('/login')} style={{ ...buttonStyle, background: 'transparent', color: '#7A6C4D', border: '2px dashed #7A6C4D', marginTop: '1.5em' }}>
                Already have an account? Login
            </button>
        </div>
    );
}

