import express from 'express';
import cors from 'cors';
import { inferCognitiveState } from './cognitiveEngine.js';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const method = req.method.replaceAll(/[\r\n]/g, '');
    const path = req.path.replaceAll(/[\r\n]/g, '');
    console.log(`[COGNITIVE-SERVICE] ${method} ${path}`);
    next();
});

app.post('/analyze', (req, res) => {
    try {
        const { sessionId, events } = req.body;

        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'Missing events array' });
        }

        const sanitizedSessionId = String(sessionId).replaceAll(/[\r\n]/g, '');
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
