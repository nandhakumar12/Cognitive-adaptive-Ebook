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

// Events: POST -> Event Service, GET -> Data Service (History)
app.use('/api/events', (req, res, next) => {
    const target = req.method === 'POST' ? EVENT_SERVICE_URL : DATA_SERVICE_URL;
    const middleware = createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path) => {
            if (req.method === 'POST') {
                return path.replace('/api/events', ''); // /api/events/ingest -> /ingest
            }
            return path.replace('/api/events', '/sessions') + '/events'; // /api/events/:id -> /sessions/:id/events
        }
    });
    middleware(req, res, next);
});

// Cognitive: GET -> Data Service (Current State)
app.use('/api/cognitive', createProxyMiddleware({
    target: DATA_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => path.replace('/api/cognitive', '/sessions') + '/cognitive'
}));

// Adaptations: GET -> Data Service (History/Active)
app.use('/api/adaptations', createProxyMiddleware({
    target: DATA_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => path.replace('/api/adaptations', '/sessions') + '/adaptations'
}));

// Proxy root and other routes to frontend
app.use(
    '/',
    createProxyMiddleware({
        target: 'http://frontend:3000',
        changeOrigin: true
    })
);

// Fallback (this might be shadowed by the frontend proxy, but kept for safety)
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found at Gateway' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Forwarding /api/events to ${EVENT_SERVICE_URL}`);
    console.log(`Forwarding /api/cognitive to ${COGNITIVE_SERVICE_URL}`);
    console.log(`Forwarding /api/adaptations to ${ADAPTATION_SERVICE_URL}`);
});
