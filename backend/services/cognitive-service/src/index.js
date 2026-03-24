import express from 'express';
import cors from 'cors';
import { inferCognitiveState } from './cognitiveEngine.js';

const app = express();
const PORT = 3003;

// Security: disable framework fingerprinting
app.disable('x-powered-by');

// Security: restrict CORS to known trusted origins
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    const method = String(req.method || 'UNKNOWN').trim().replaceAll(/[\r\n]/g, '').slice(0, 10);
    const path = String(req.path || '').trim().replaceAll(/[\r\n]/g, '').slice(0, 100);
    console.log(`[COGNITIVE-SERVICE] ${method} ${path}`);
    next();
});

app.post('/analyze', (req, res) => {
    try {
        const { sessionId, events } = req.body;

        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'Missing events array' });
        }

        const sanitizedSessionId = String(sessionId || 'anonymous').trim().replaceAll(/[\r\n]/g, '').slice(0, 50);
        console.log(`Analyzing ${events.length} events for session ${sanitizedSessionId}`);
        const state = inferCognitiveState(events, sessionId);

        res.json(state);
    } catch (error) {
        const errorMessage = (error.message || 'Analysis failed').replaceAll(/[\r\n]/g, '');
        console.error('Analysis error:', errorMessage);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'cognitive-service' });
});

app.listen(PORT, () => {
    console.log(`Cognitive Service running on port ${PORT}`);
});
