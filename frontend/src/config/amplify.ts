import { Amplify } from 'aws-amplify';

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
