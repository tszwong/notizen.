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
        console.log('Attempting registration for:', email);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setSuccess('Registration successful! Redirecting...');
            console.log('Registration successful for:', email);

            // Redirect after successful registration
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message);
            console.error('Registration failed:', err);
        }
    };

    return (
        <div>
            <form onSubmit={handleRegister}>
                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                />
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <button type="submit">Register</button>
            </form>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}
        </div>
    );
}

