import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import './Auth.css';

interface LoginProps {
    onSwitchToSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { isSignedIn, nextStep } = await signIn({ username: email, password });
            if (isSignedIn) {
                window.location.reload(); // Refresh to trigger auth check
            } else {
                console.log('Next step:', nextStep);
                if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                    setError('Please verify your email first.');
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-form-container">
            <h2>Sign In</h2>
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email / Username</label>
                    <input
                        id="email"
                        type="email" // Changed from text to email for better UX
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input"
                    />
                </div>

                <button type="submit" className="btn-auth-primary" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="auth-footer">
                <p>New to Adaptive Audio?</p>
                <button onClick={onSwitchToSignup} className="btn-auth-link">
                    Create your Amazon account
                </button>
            </div>
        </div>
    );
};
