import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();
const PORT = 3002;

// Service URLs
const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3005';
const COGNITIVE_SERVICE_URL = process.env.COGNITIVE_SERVICE_URL || 'http://localhost:3003';
const ADAPTATION_SERVICE_URL = process.env.ADAPTATION_SERVICE_URL || 'http://localhost:3004';

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[EVENT-SERVICE] ${req.method} ${req.path}`);
    next();
});

/**
 * Process event asynchronously (Orchestration Logic)
 */
async function processEvent(event) {
    try {
        const { sessionId } = event;
        console.log(`[ORCHESTRATOR] Processing event: ${event.eventType} for session ${sessionId}`);

        // 1. Get recent events from Data Service
        const eventsResponse = await axios.get(`${DATA_SERVICE_URL}/sessions/${sessionId}/events?limit=20`);
        const recentEvents = eventsResponse.data;

        // 2. Call Cognitive Service to analyze
        console.log(`[ORCHESTRATOR] Requesting cognitive analysis...`);
        const cognitiveResponse = await axios.post(`${COGNITIVE_SERVICE_URL}/analyze`, {
            sessionId,
            events: recentEvents
        });
        const cognitiveState = cognitiveResponse.data;

        // 3. Store cognitive state
        await axios.post(`${DATA_SERVICE_URL}/sessions/${sessionId}/cognitive`, cognitiveState);
        console.log(`[ORCHESTRATOR] Cognitive State: ${cognitiveState.cognitiveLoad}`);

        // 4. Call Adaptation Service for recommendations
        console.log(`[ORCHESTRATOR] Requesting adaptation recommendations...`);
        const adaptationResponse = await axios.post(`${ADAPTATION_SERVICE_URL}/decide`, {
            cognitiveState
        });
        const adaptations = adaptationResponse.data;

        // 5. Store and log adaptations
        if (adaptations && adaptations.length > 0) {
            console.log(`[ORCHESTRATOR] Applying ${adaptations.length} adaptation(s)`);
            for (const adaptation of adaptations) {
                await axios.post(`${DATA_SERVICE_URL}/sessions/${sessionId}/adaptations`, adaptation);
            }
        } else {
            console.log(`[ORCHESTRATOR] No adaptations recommended.`);
        }

    } catch (error) {
        console.error('[ORCHESTRATOR] Error processing event:', error.message);
    }
}

// --- Endpoints ---

app.post('/ingest', async (req, res) => {
    try {
        const { sessionId, eventType, metadata } = req.body;

        if (!sessionId || !eventType) {
            return res.status(400).json({ error: 'Missing sessionId or eventType' });
        }

        const event = {
            eventId: uuidv4(),
            sessionId,
            eventType,
            timestamp: Date.now(),
            metadata: metadata || {}
        };

        // 1. Store event in Data Service
        await axios.post(`${DATA_SERVICE_URL}/sessions/${sessionId}/events`, event);

        // 2. Update context if needed
        if (metadata && (metadata.currentTime || metadata.speed || metadata.sectionId)) {
            await axios.post(`${DATA_SERVICE_URL}/sessions/${sessionId}/context`, {
                currentTime: metadata.currentTime,
                playbackSpeed: metadata.speed,
                currentSection: metadata.sectionId
            });
        }

        // 3. Trigger async processing (fire and forget)
        processEvent(event).catch(err => console.error(err));

        res.json({ success: true, eventId: event.eventId });

    } catch (error) {
        console.error('Ingest error:', error.message);
        res.status(500).json({ error: 'Ingestion failed' });
    }
});

app.post('/batch', async (req, res) => {
    try {
        const { sessionId, events } = req.body;

        if (!sessionId || !events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'Missing sessionId or events array' });
        }

        console.log(`[EVENT-SERVICE] Processing batch of ${events.length} events for ${sessionId}`);

        for (const eventData of events) {
            const event = {
                eventId: uuidv4(),
                sessionId,
                eventType: eventData.eventType,
                timestamp: eventData.metadata?.timestamp || Date.now(),
                metadata: eventData.metadata || {}
            };

            // 1. Store event
            await axios.post(`${DATA_SERVICE_URL}/sessions/${sessionId}/events`, event);

            // 2. Trigger async processing
            processEvent(event).catch(err => console.error(err));
        }

        res.json({ success: true, count: events.length });
    } catch (error) {
        console.error('Batch error:', error.message);
        res.status(500).json({ error: 'Batch processing failed' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'event-service' });
});

app.listen(PORT, () => {
    console.log(`Event Service running on port ${PORT}`);
});
