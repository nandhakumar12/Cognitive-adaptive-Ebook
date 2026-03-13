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
    getUserProgress,
    getAllBooks,
    getBookById,
    createOrUpdateBook,
    deleteBook
} from './dataStore.js';

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[DATA-SERVICE] ${req.method} ${req.path}`);
    next();
});


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


app.post('/sessions/:sessionId/events', async (req, res) => {
    const session = await addEvent(req.params.sessionId, req.body);
    res.json({ success: true, count: session.events.length });
});

app.get('/sessions/:sessionId/events', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const events = await getRecentEvents(req.params.sessionId, limit);
    res.json(events);
});


app.post('/sessions/:sessionId/cognitive', async (req, res) => {
    await updateCognitiveState(req.params.sessionId, req.body);
    res.json({ success: true });
});

app.get('/sessions/:sessionId/cognitive', async (req, res) => {
    const state = await getCurrentCognitiveState(req.params.sessionId);
    res.json(state || {});
});


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


app.post('/users/:userId/progress', async (req, res) => {
    const { bookId, progress } = req.body;
    await saveUserProgress(req.params.userId, bookId, progress);
    res.json({ success: true });
});

app.get('/users/:userId/progress/:bookId', async (req, res) => {
    const progress = await getUserProgress(req.params.userId, req.params.bookId);
    res.json(progress || {});
});


app.get('/books', async (req, res) => {
    const books = await getAllBooks();
    res.json(books);
});

app.get('/books/:id', async (req, res) => {
    const book = await getBookById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
});

app.post('/books', async (req, res) => {
    try {
        console.log(`[DATA-SERVICE] POST /books - Body:`, JSON.stringify(req.body));
        console.log(`[DATA-SERVICE] Attempting to save book: ${req.body?.title} (ID: ${req.body?.id})`);
        const book = await createOrUpdateBook(req.body);
        console.log(`[DATA-SERVICE] Successfully saved book: ${req.body?.id}`);
        res.json(book);
    } catch (err) {
        console.error(`[DATA-SERVICE] ERROR saving book:`, err);
        res.status(500).json({ error: 'Failed to save book to database', details: err.message });
    }
});

app.delete('/books/:id', async (req, res) => {
    await deleteBook(req.params.id);
    res.json({ success: true });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'data-service' });
});

app.listen(PORT, () => {
    console.log(`Data Service running on port ${PORT}`);
});
