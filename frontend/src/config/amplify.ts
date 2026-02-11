import { Amplify } from 'aws-amplify';

// Configure with environment variables
// Fallback to empty strings to prevent crash on load if env missing
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
            userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
        }
    }
});

export const checkAuthConfig = () => {
    if (!import.meta.env.VITE_COGNITO_USER_POOL_ID) {
        console.warn('⚠️ AWS Cognito config missing! Features will use mock mode.');
        return false;
    }
    return true;
};
