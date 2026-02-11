import express from 'express';
import cors from 'cors';
import {
    getSession,
    addEvent,
    getRecentEvents,
    updateCognitiveState,
    getCurrentCognitiveState,
    addAdaptation,
    getRecentAdaptations,
    updateSessionContext,
    getAllSessions,
    saveUserProgress,
    getUserProgress
} from './dataStore.js';

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[DATA-SERVICE] ${req.method} ${req.path}`);
    next();
});

// --- Sessions & Context ---

app.get('/sessions/:sessionId', (req, res) => {
    const session = getSession(req.params.sessionId);
    res.json(session);
});

app.post('/sessions/:sessionId/context', (req, res) => {
    const session = updateSessionContext(req.params.sessionId, req.body);
    res.json(session);
});

app.get('/sessions', (req, res) => {
    res.json(getAllSessions());
});

// --- Events ---

app.post('/sessions/:sessionId/events', (req, res) => {
    const session = addEvent(req.params.sessionId, req.body);
    res.json({ success: true, count: session.events.length });
});

app.get('/sessions/:sessionId/events', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const events = getRecentEvents(req.params.sessionId, limit);
    res.json(events);
});

// --- Cognitive State ---

app.post('/sessions/:sessionId/cognitive', (req, res) => {
    const session = updateCognitiveState(req.params.sessionId, req.body);
    res.json({ success: true });
});

app.get('/sessions/:sessionId/cognitive', (req, res) => {
    const state = getCurrentCognitiveState(req.params.sessionId);
    res.json(state || {});
});

// --- Adaptations ---

app.post('/sessions/:sessionId/adaptations', (req, res) => {
    const session = addAdaptation(req.params.sessionId, req.body);
    res.json({ success: true });
});

app.get('/sessions/:sessionId/adaptations', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const adaptations = getRecentAdaptations(req.params.sessionId, limit);
    res.json(adaptations);
});

// --- User Progress ---

app.post('/users/:userId/progress', (req, res) => {
    const { bookId, progress } = req.body;
    saveUserProgress(req.params.userId, bookId, progress);
    res.json({ success: true });
});

app.get('/users/:userId/progress/:bookId', (req, res) => {
    const progress = getUserProgress(req.params.userId, req.params.bookId);
    res.json(progress || {});
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'data-service' });
});

app.listen(PORT, () => {
    console.log(`Data Service running on port ${PORT}`);
});
