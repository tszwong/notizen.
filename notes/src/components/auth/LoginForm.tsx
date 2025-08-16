import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider } from '../../firebase';

import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';

// SVG component for the "see" icon
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

export default function LoginFormComponent() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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
    const cleanFont = {
        fontFamily: "'Nunito Sans', sans-serif",
    };
    const buttonStyle = {
        ...cleanFont,
        color: '#232323',
        borderRadius: '35px',
        fontWeight: 700,
        fontSize: '1.1rem',
        padding: '8px 20px',
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
                justifyContent: 'center', 
                minHeight: '50vh',
                padding: '0rem 2.5rem',
                marginTop: '0rem',
                borderRadius: '60px',
                width: '100%',
                maxWidth: '450px', // Fix form width so it doesn't exceed page
                boxSizing: 'border-box',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}
            className='upper-layer'
        >
            <span
                style={{
                fontFamily: "'Nunito Sans', sans-serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '2.5rem',
                color: '#000',
                letterSpacing: '0.03em',
                marginLeft: '2.5rem',
                marginRight: '2.5rem',
                marginBottom: '1.5rem',
                userSelect: 'none',
                }}
            >
                notizen.
            </span>
            {/* <hr style={{ ...dividerStyle, marginLeft: 'auto', marginRight: 'auto', marginBottom: '1.75em' }} /> */}

            <div 
                style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: '1.2em', 
                    justifyContent: 'center', 
                    width: '100%',
                    marginBottom: '0.75em',
                }}
            >
                <button 
                    style={{ 
                        ...buttonStyle, 
                        background: 'transparent', 
                        color: '#232323', 
                        margin: 0,
                        border: '1.5px solid #6c757d',
                        width: '50%',
                        display: 'flex',           // <-- Make button content flex
                        alignItems: 'center',      // <-- Center icon and text vertically
                        justifyContent: 'center',  // <-- Center horizontally
                        gap: '0.5em',              // <-- Space between icon and text
                    }} 
                    onClick={handleGoogleLogin}
                >
                    <GoogleIcon style={{ marginRight: 0 }} /> Google
                </button>
                <button 
                    style={{ 
                        ...buttonStyle, 
                        background: 'transparent', 
                        color: '#232323', 
                        margin: 0,
                        border: '1.5px solid #6c757d',
                        width: '50%',
                        display: 'flex',           // <-- Make button content flex
                        alignItems: 'center',      // <-- Center icon and text vertically
                        justifyContent: 'center',  // <-- Center horizontally
                        gap: '0.5em',              // <-- Space between icon and text
                    }} 
                    onClick={handleGithubLogin}>
                    <GitHubIcon style={{ marginRight: 0 }} /> GitHub
                </button>
            </div>
            
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <input
                    style={{ ...inputStyle, marginLeft: 'auto', marginRight: 'auto', paddingRight: '2.5em' }}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
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
                    Log In <span role="img" aria-label="Envelope" style={{marginRight:8}}> <ArrowForwardOutlinedIcon /> </span>
                </button>
            </form>
            {error && <div style={{ color: '#e57373', marginTop: '0.7em', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
            <button onClick={() => navigate('/register')} style={{ ...buttonStyle, background: 'transparent', color: '#000', border: '2px dashed #7A6C4D', marginTop: '1.5em', marginLeft: 'auto', marginRight: 'auto' }}>
                Register
            </button>
        </div>
    );
}