import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';

// SVG component for the "see" icon (reuse from LoginForm)
const SeeIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    width="18"
    height="12"
    viewBox="0 0 32 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M2 2C8 10 24 10 30 2"
      stroke="#232323"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 14L10 8"
      stroke="#232323"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M16 15V8"
      stroke="#232323"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M26 14L22 8"
      stroke="#232323"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

export default function RegisterFormComponent() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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

    // Styles (copied from LoginForm)
    const cleanFont = {
        fontFamily: "'Nunito Sans', sans-serif",
    };
    const buttonStyle = {
        ...cleanFont,
        color: '#232323',
        borderRadius: '35px',
        fontWeight: 700,
        fontSize: '1.1rem',
        padding: '10px 20px',
        margin: '0.5em 0',
        cursor: 'pointer',
        transition: 'all 0.18s',
        letterSpacing: '1px',
        outline: 'none',
        display: 'block',
        width: '100%',
    } as React.CSSProperties;
    const inputStyle = {
        ...cleanFont,
        background: '#f7ede2',
        border: 'none',
        borderRadius: '35px',
        fontSize: '1rem',
        padding: '0.75em 1em',
        margin: '0.5em 0',
        width: '100%',
        color: '#232323',
        outline: 'none',
        boxSizing: 'border-box' as const,
    };
    const dividerStyle = {
        margin: '1.2em 0',
        border: 'none',
        borderTop: '2px solid #000',
        width: '100%',
    };

    return (
        <div 
            style={{ 
                ...cleanFont, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                minHeight: '60vh',
                padding: '1rem 2.5rem',
                marginTop: '0.5rem',
                borderRadius: '60px',
                width: '100%',
                maxWidth: '450px',
                boxSizing: 'border-box',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}
        >
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <input
                    style={{ ...inputStyle, marginLeft: 'auto', marginRight: 'auto' }}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                />
                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        style={{ ...inputStyle, marginLeft: 'auto', marginRight: 'auto', paddingRight: '2.5em' }}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                            position: 'absolute',
                            right: '1em',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            outline: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            marginRight: '0.7em',
                        }}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        <SeeIcon />
                    </button>
                </div>
                <button type="submit" style={{ ...buttonStyle, background: '#ffd670', color: '#000', marginLeft: 'auto', marginRight: 'auto' }}>
                    Register
                </button>
            </form>
            <hr style={{ ...dividerStyle, marginLeft: 'auto', marginRight: 'auto' }} />
            {error && <div style={{ color: '#e57373', marginTop: '0.7em', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginTop: '0.7em', fontWeight: 600, textAlign: 'center' }}>{success}</div>}
            <button onClick={() => navigate('/login')} style={{ ...buttonStyle, background: 'transparent', color: '#000', border: '2px dashed #7A6C4D', marginTop: '1.5em', marginLeft: 'auto', marginRight: 'auto' }}>
                Already have an account? Login
            </button>
        </div>
    );
}

