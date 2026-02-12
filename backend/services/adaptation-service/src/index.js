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
        const { cognitiveState, context, recentAdaptations } = req.body;

        if (!cognitiveState) {
            return res.status(400).json({ error: 'Missing cognitiveState' });
        }

        // 1. Get raw recommendations
        const rawStrategies = recommendAdaptations(cognitiveState);

        // 2. Filter using cooldown logic
        const recommendedStrategies = rawStrategies.filter(strategy =>
            shouldApplyAdaptation(recentAdaptations || [], strategy)
        );

        if (recommendedStrategies.length === 0) {
            return res.json([]);
        }

        console.log(`Final recommendations for session ${cognitiveState.sessionId}: ${recommendedStrategies.join(', ')}`);

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
