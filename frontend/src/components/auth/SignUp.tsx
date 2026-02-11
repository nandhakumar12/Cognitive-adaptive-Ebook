import React, { useState } from 'react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import './Auth.css';

interface SignUpProps {
    onSwitchToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'signup' | 'confirm'>('signup');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                    },
                    autoSignIn: true
                }
            });
            setStep('confirm');
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await confirmSignUp({
                username: email,
                confirmationCode: verificationCode
            });
            // Auto sign in happens if configured, otherwise redirect to login
            onSwitchToLogin();
            alert('Account verified! Please sign in.');
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'confirm') {
        return (
            <div className="auth-form-container">
                <h2>Verify Email</h2>
                <p className="auth-instruction">We sent a code to {email}</p>
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleConfirm}>
                    <div className="form-group">
                        <label>Verification Code</label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>
                    <button type="submit" className="btn-auth-primary" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="auth-form-container">
            <h2>Create Account</h2>
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSignUp}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
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
                        minLength={8}
                    />
                    <small className="password-hint">At least 8 chars, 1 number, 1 special char</small>
                </div>

                <button type="submit" className="btn-auth-primary" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Continue'}
                </button>
            </form>

            <div className="auth-footer">
                <p>Already have an account?</p>
                <button onClick={onSwitchToLogin} className="btn-auth-link">
                    Sign In
                </button>
            </div>
        </div>
    );
};
