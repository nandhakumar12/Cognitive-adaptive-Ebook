import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, null);
        } else {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        }
    });
}

export const verifyToken = (req, res, next) => {
    // If no Pool ID set, mock auth mode
    if (!process.env.COGNITO_USER_POOL_ID) {
        req.user = { sub: 'mock-user-123', email: 'mock@example.com' };
        return next();
    }

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = decoded;
        next();
    });
};
