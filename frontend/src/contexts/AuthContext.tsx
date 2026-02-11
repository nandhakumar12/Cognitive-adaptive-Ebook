import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, signOut, fetchAuthSession } from 'aws-amplify/auth';
import type { AuthUser } from 'aws-amplify/auth';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    logout: async () => { },
    isAuthenticated: false,
    token: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        // Dev Bypass
        if (import.meta.env.VITE_DEV_BYPASS === 'true') {
            console.log('[AuthContext] Dev bypass enabled');
            setUser({
                userId: 'dev-user-id',
                username: 'DevUser'
            } as AuthUser);
            setToken('mock-dev-token');
            setIsLoading(false);
            return;
        }

        try {
            const currentUser = await getCurrentUser();
            const session = await fetchAuthSession();

            setUser(currentUser);
            setToken(session.tokens?.idToken?.toString() || null);
        } catch (error) {
            console.log('[Auth] No user signed in');
            setUser(null);
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function logout() {
        try {
            await signOut();
            setUser(null);
            setToken(null);
        } catch (error) {
            console.error('[Auth] Error signing out:', error);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            logout,
            isAuthenticated: !!user,
            token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
