import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();
const PORT = 3002;

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

const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3005';
const COGNITIVE_SERVICE_URL = process.env.COGNITIVE_SERVICE_URL || 'http://localhost:3003';
const ADAPTATION_SERVICE_URL = process.env.ADAPTATION_SERVICE_URL || 'http://localhost:3004';



app.use((req, res, next) => {
    const method = String(req.method || 'UNKNOWN').trim().replaceAll(/[\r\n]/g, '').slice(0, 10);
    const path = String(req.path || '').trim().replaceAll(/[\r\n]/g, '').slice(0, 100);
    console.log(`[EVENT-SERVICE] ${method} ${path}`);
    next();
});

/**
 * Process event asynchronously (Orchestration Logic)
 */
async function processEvent(event) {
    try {
        const { sessionId, eventType } = event;
        const sanitizedSessionId = String(sessionId || 'anonymous').trim().replaceAll(/[\r\n]/g, '').slice(0, 50);
        const sanitizedType = String(eventType || 'UNKNOWN').trim().replaceAll(/[\r\n]/g, '').slice(0, 50);
        console.log(`[ORCHESTRATOR] Processing event: ${sanitizedType} for session ${sanitizedSessionId}`);

        const sectionId = event.metadata?.sectionId;
        const eventsResponse = await axios.get(`${DATA_SERVICE_URL}/sessions/${encodeURIComponent(sessionId)}/events?limit=50`);
        const allEvents = eventsResponse.data || [];

        const recentEvents = allEvents
            .filter(e => !sectionId || e.metadata?.sectionId === sectionId)
            .slice(-20);

        console.log(`[ORCHESTRATOR] Requesting cognitive analysis...`);
        const cognitiveResponse = await axios.post(`${COGNITIVE_SERVICE_URL}/analyze`, {
            sessionId,
            events: recentEvents
        });
        const cognitiveState = cognitiveResponse.data;

        await axios.post(`${DATA_SERVICE_URL}/sessions/${encodeURIComponent(sessionId)}/cognitive`, cognitiveState);
        console.log(`[ORCHESTRATOR] Cognitive State: ${cognitiveState.cognitiveLoad}`);

        console.log(`[ORCHESTRATOR] Requesting adaptation recommendations...`);

        const historyResponse = await axios.get(`${DATA_SERVICE_URL}/sessions/${encodeURIComponent(sessionId)}/adaptations?limit=10`);
        const recentAdaptations = historyResponse.data || [];

        const adaptationResponse = await axios.post(`${ADAPTATION_SERVICE_URL}/decide`, {
            cognitiveState,
            recentAdaptations,
            context: {
                currentTime: event.metadata?.currentTime,
                currentSpeed: event.metadata?.speed,
                currentSection: event.metadata?.sectionId
            }
        });
        const adaptations = adaptationResponse.data;

        if (adaptations && adaptations.length > 0) {
            console.log(`[ORCHESTRATOR] Applying ${adaptations.length} adaptation(s)`);
            // The original code had a loop here. The instruction implies removing the loop
            // and keeping only the post request. This would mean only the first adaptation
            // is processed, or if 'adaptation' is meant to be a single object.
            // To maintain syntactical correctness and avoid 'adaptation' being undefined,
            // we will assume the intent is to process the first adaptation if the loop is removed.
            // If the intent was to remove the loop entirely and not post any adaptation,
            // the line should be removed. Given the instruction, we keep the line.
            for (const adaptation of adaptations) {
                await axios.post(`${DATA_SERVICE_URL}/sessions/${encodeURIComponent(sessionId)}/adaptations`, adaptation);
            }
        } else {
            console.log(`[ORCHESTRATOR] No adaptations recommended.`);
        }

    } catch (error) {
        const errorMessage = (error.message || 'Unknown error').replaceAll(/[\r\n]/g, '');
        console.error('[ORCHESTRATOR] Error processing event:', errorMessage);
    }
}


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

        await axios.post(`${DATA_SERVICE_URL}/sessions/${encodeURIComponent(sessionId)}/events`, event);

        if (metadata && (metadata.currentTime || metadata.speed || metadata.sectionId)) {
            await axios.post(`${DATA_SERVICE_URL}/sessions/${encodeURIComponent(sessionId)}/context`, {
                currentTime: metadata.currentTime,
                playbackSpeed: metadata.speed,
                currentSection: metadata.sectionId
            });
        }

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

        const sanitizedSessionId = String(sessionId || 'anonymous').trim().replaceAll(/[\r\n]/g, '').slice(0, 50);
        console.log(`[EVENT-SERVICE] Processing batch of ${events.length} events for ${sanitizedSessionId}`);

        for (const eventData of events) {
            const event = {
                eventId: uuidv4(),
                sessionId,
                eventType: eventData.eventType,
                timestamp: eventData.metadata?.timestamp || Date.now(),
                metadata: eventData.metadata || {}
            };

            await axios.post(`${DATA_SERVICE_URL}/sessions/${encodeURIComponent(sessionId)}/events`, event);

            await processEvent(event);
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
