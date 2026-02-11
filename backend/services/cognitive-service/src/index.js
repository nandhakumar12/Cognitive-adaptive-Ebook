import express from 'express';
import cors from 'cors';
import { inferCognitiveState } from './cognitiveEngine.js';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[COGNITIVE-SERVICE] ${req.method} ${req.path}`);
    next();
});

app.post('/analyze', (req, res) => {
    try {
        const { sessionId, events } = req.body;

        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'Missing events array' });
        }

        console.log(`Analyzing ${events.length} events for session ${sessionId}`);
        const state = inferCognitiveState(events, sessionId);

        res.json(state);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'cognitive-service' });
});

app.listen(PORT, () => {
    console.log(`Cognitive Service running on port ${PORT}`);
});
