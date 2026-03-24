import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';

const app = express();
const PORT = process.env.PORT || 3001;

const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:3002';
const COGNITIVE_SERVICE_URL = process.env.COGNITIVE_SERVICE_URL || 'http://localhost:3003';
const ADAPTATION_SERVICE_URL = process.env.ADAPTATION_SERVICE_URL || 'http://localhost:3004';
const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3005';

import { createProxyMiddleware } from 'http-proxy-middleware';

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    const method = req.method.replace(/[\r\n]/g, '');
    const path = req.path.replace(/[\r\n]/g, '');
    console.log(`[GATEWAY] ${method} ${path}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        routes: ['/api/events', '/api/cognitive', '/api/adaptations']
    });
});



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

app.get('/api/cognitive/:sessionId', (req, res, next) => {
    createProxyMiddleware({
        target: DATA_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: () => `/sessions/${req.params.sessionId}/cognitive`
    })(req, res, next);
});

app.get('/api/adaptations/:sessionId/active', (req, res, next) => {
    createProxyMiddleware({
        target: DATA_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: () => `/sessions/${req.params.sessionId}/adaptations/active`
    })(req, res, next);
});

app.get('/api/adaptations/:sessionId', (req, res, next) => {
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    createProxyMiddleware({
        target: DATA_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: () => `/sessions/${req.params.sessionId}/adaptations${query}`
    })(req, res, next);
});

app.use('/api/books', proxy(DATA_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
        return '/books' + (req.url === '/' ? '' : req.url);
    }
}));

app.use((err, req, res, next) => {
    console.error('[GATEWAY ERROR]', err);
    res.status(500).json({ error: 'Gateway Proxy Error', details: err.message });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found at Gateway', path: req.path });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
