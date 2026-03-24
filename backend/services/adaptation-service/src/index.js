import express from 'express';
import cors from 'cors';
import { recommendAdaptations, executeAdaptations, shouldApplyAdaptation } from './adaptationService.js';

const app = express();
const PORT = 3004;

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
    // Sanitize user-controlled input to prevent log injection (S5145)
    const method = req.method.replaceAll(/[\r\n]/g, '');
    const path = req.path.replaceAll(/[\r\n]/g, '');
    console.log(`[ADAPTATION-SERVICE] ${method} ${path}`);
    next();
});

app.post('/decide', (req, res) => {
    try {
        const { cognitiveState, context, recentAdaptations } = req.body;

        if (!cognitiveState) {
            return res.status(400).json({ error: 'Missing cognitiveState' });
        }

        const rawStrategies = recommendAdaptations(cognitiveState);

        const recommendedStrategies = rawStrategies.filter(strategy =>
            shouldApplyAdaptation(recentAdaptations || [], strategy)
        );

        if (recommendedStrategies.length === 0) {
            return res.json([]);
        }

        // Sanitize sessionId before logging (S5145)
        const sanitizedSessionId = String(cognitiveState.sessionId).replaceAll(/[\r\n]/g, '');
        console.log(`Final recommendations for session ${sanitizedSessionId}: ${recommendedStrategies.join(', ')}`);

        const adaptations = executeAdaptations(cognitiveState, recommendedStrategies, context || {});

        res.json(adaptations);

    } catch (error) {
        console.error('Decision error:', error);
        res.status(500).json({ error: 'Decision failed' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'adaptation-service' });
});

app.listen(PORT, () => {
    console.log(`Adaptation Service running on port ${PORT}`);
});
