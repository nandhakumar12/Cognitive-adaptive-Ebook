import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';

const app = express();
const PORT = 3001;

// Service URLs
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:3002';
const COGNITIVE_SERVICE_URL = process.env.COGNITIVE_SERVICE_URL || 'http://localhost:3003';
const ADAPTATION_SERVICE_URL = process.env.ADAPTATION_SERVICE_URL || 'http://localhost:3004';
const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3005';

import { createProxyMiddleware } from 'http-proxy-middleware';

app.use(cors());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        routes: ['/api/events', '/api/cognitive', '/api/adaptations']
    });
});

// Wrapper to strip /api prefix when forwarding if needed, 
// OR services can just handle the full path. 
// Standard Proxy: 
// /api/events/ingest -> Event Service /ingest

// --- SMART ROUTING ---

// Events: POST -> Event Service (Writes), GET -> Data Service (History)
app.post('/api/events/ingest', createProxyMiddleware({
    target: EVENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/events/ingest': '/ingest' }
}));

app.post('/api/events/batch', createProxyMiddleware({
    target: EVENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/events/batch': '/batch' }
}));

app.get('/api/events/:sessionId', (req, res, next) => {
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    createProxyMiddleware({
        target: DATA_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: () => `/sessions/${req.params.sessionId}/events${query}`
    })(req, res, next);
});

// Cognitive: GET -> Data Service (Current State)
app.get('/api/cognitive/:sessionId', (req, res, next) => {
    createProxyMiddleware({
        target: DATA_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: () => `/sessions/${req.params.sessionId}/cognitive`
    })(req, res, next);
});

// Adaptations: GET -> Data Service (History/Active)
app.get('/api/adaptations/:sessionId/:active?', (req, res, next) => {
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const suffix = req.params.active ? `/${req.params.active}` : '';
    createProxyMiddleware({
        target: DATA_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: () => `/sessions/${req.params.sessionId}/adaptations${suffix}${query}`
    })(req, res, next);
});

// Proxy root and other routes to frontend
app.use(
    '/',
    createProxyMiddleware({
        target: 'http://frontend:3000',
        changeOrigin: true
    })
);

// Fallback
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found at Gateway', path: req.path });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
