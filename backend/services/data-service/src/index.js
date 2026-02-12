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

app.get('/sessions/:sessionId', async (req, res) => {
    const session = await getSession(req.params.sessionId);
    res.json(session);
});

app.post('/sessions/:sessionId/context', async (req, res) => {
    const session = await updateSessionContext(req.params.sessionId, req.body);
    res.json(session);
});

app.get('/sessions', async (req, res) => {
    const sessions = await getAllSessions();
    res.json(sessions);
});

// --- Events ---

app.post('/sessions/:sessionId/events', async (req, res) => {
    const session = await addEvent(req.params.sessionId, req.body);
    res.json({ success: true, count: session.events.length });
});

app.get('/sessions/:sessionId/events', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const events = await getRecentEvents(req.params.sessionId, limit);
    res.json(events);
});

// --- Cognitive State ---

app.post('/sessions/:sessionId/cognitive', async (req, res) => {
    await updateCognitiveState(req.params.sessionId, req.body);
    res.json({ success: true });
});

app.get('/sessions/:sessionId/cognitive', async (req, res) => {
    const state = await getCurrentCognitiveState(req.params.sessionId);
    res.json(state || {});
});

// --- Adaptations ---

app.post('/sessions/:sessionId/adaptations', async (req, res) => {
    await addAdaptation(req.params.sessionId, req.body);
    res.json({ success: true });
});

app.get('/sessions/:sessionId/adaptations', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const adaptations = await getRecentAdaptations(req.params.sessionId, limit);
    res.json(adaptations);
});

app.get('/sessions/:sessionId/adaptations/active', async (req, res) => {
    const adaptations = await getRecentAdaptations(req.params.sessionId, 5);
    res.json({ activeAdaptations: adaptations });
});

// --- User Progress ---

app.post('/users/:userId/progress', async (req, res) => {
    const { bookId, progress } = req.body;
    await saveUserProgress(req.params.userId, bookId, progress);
    res.json({ success: true });
});

app.get('/users/:userId/progress/:bookId', async (req, res) => {
    const progress = await getUserProgress(req.params.userId, req.params.bookId);
    res.json(progress || {});
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'data-service' });
});

app.listen(PORT, () => {
    console.log(`Data Service running on port ${PORT}`);
});
