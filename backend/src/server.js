/**
 * MSc RESEARCH PROJECT: Adaptive Cognitive-Aware Audio Reading Platform
 * 
 * BACKEND SERVER - Event-Driven Architecture
 * 
 * This is the main server for the cognitive feedback loop system.
 * It processes behavioral events, infers cognitive states, and triggers adaptations.
 * 
 * ARCHITECTURE: Stateless, cloud-ready (AWS Lambda/API Gateway compatible)
 */

import express from 'express';
import cors from 'cors';
import { eventRouter } from './controllers/eventController.js';
import { cognitiveRouter } from './controllers/cognitiveController.js';
import { adaptationRouter } from './controllers/adaptationController.js';
import { verifyToken } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging (for research/debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint (Public)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        service: 'adaptive-cognitive-audio-backend',
        version: '1.0.0',
        auth: process.env.COGNITO_USER_POOL_ID ? 'enabled' : 'mock-mode'
    });
});

// Protected API Routes
// All routes require valid JWT token from Cognito (or mock in dev)
app.use('/api/events', verifyToken, eventRouter);
app.use('/api/cognitive', verifyToken, cognitiveRouter);
app.use('/api/adaptations', verifyToken, adaptationRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  Adaptive Cognitive Audio Platform - Backend Server      ║
║  MSc Research Project                                     ║
╟───────────────────────────────────────────────────────────╢
║  Port: ${PORT}                                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}   ║
║  Auth Mode: ${process.env.COGNITO_USER_POOL_ID ? 'AWS Cognito' : 'Mock/Dev'}      ║
║  Cognitive Feedback Loop: ACTIVE                          ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
