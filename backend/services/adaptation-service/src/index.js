import express from 'express';
import cors from 'cors';
import { recommendAdaptations, executeAdaptations, shouldApplyAdaptation } from './adaptationService.js';

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[ADAPTATION-SERVICE] ${req.method} ${req.path}`);
    next();
});

app.post('/decide', (req, res) => {
    try {
        const { cognitiveState, context } = req.body;

        if (!cognitiveState) {
            return res.status(400).json({ error: 'Missing cognitiveState' });
        }

        // 1. Get recommendations
        const recommendedStrategies = recommendAdaptations(cognitiveState);

        if (recommendedStrategies.length === 0) {
            return res.json([]);
        }

        console.log(`Recommended for session ${cognitiveState.sessionId}: ${recommendedStrategies.join(', ')}`);

        // 2. Filter (TODO: In a real system, we'd check history here, but history is in Data Service.
        // For now, we'll assume filtering happens or is skipped, OR we pass history in body.
        // Let's implement a basic stateless filter or accept history in body.
        // To keep it simple, we will proceed with recommendations.)

        // 3. Execute (generate adaptation objects)
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
