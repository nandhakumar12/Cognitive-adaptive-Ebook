import React, { useState } from 'react';
import { Login } from './Login';
import { SignUp } from './SignUp';
import './Auth.css';

export const AuthPage: React.FC = () => {
    const [view, setView] = useState<'login' | 'signup'>('login');

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <span style={{ fontSize: '2.5rem' }}>🎧</span>
                    <h1>Cognitive Audio</h1>
                </div>

                {view === 'login' ? (
                    <Login onSwitchToSignup={() => setView('signup')} />
                ) : (
                    <SignUp onSwitchToLogin={() => setView('login')} />
                )}
            </div>
        </div>
    );
};
