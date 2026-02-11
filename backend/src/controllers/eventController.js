/**
 * EVENT CONTROLLER
 * 
 * REST API endpoints for behavioral event ingestion
 * This is the entry point for the cognitive feedback loop
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { addEvent, getSession, updateSessionContext } from '../models/dataStore.js';
import { processEvent } from '../events/eventProcessor.js';

export const eventRouter = express.Router();

/**
 * POST /api/events/ingest
 * Receive and process behavioral events from frontend
 */
eventRouter.post('/ingest', async (req, res) => {
    try {
        const { sessionId, eventType, metadata } = req.body;

        // Validate request
        if (!sessionId || !eventType) {
            return res.status(400).json({
                error: 'Missing required fields: sessionId, eventType'
            });
        }

        // Create event object
        const event = {
            eventId: uuidv4(),
            sessionId,
            eventType,
            timestamp: Date.now(),
            metadata: metadata || {}
        };

        // Store event
        addEvent(sessionId, event);

        // Update session context if provided
        if (metadata.currentTime !== undefined ||
            metadata.speed !== undefined ||
            metadata.sectionId !== undefined) {
            updateSessionContext(sessionId, {
                currentTime: metadata.currentTime,
                playbackSpeed: metadata.speed,
                currentSection: metadata.sectionId
            });
        }

        // Process event asynchronously (triggers cognitive loop)
        processEvent(event).catch(err => {
            console.error('Event processing error:', err);
        });

        res.json({
            success: true,
            eventId: event.eventId,
            timestamp: event.timestamp
        });

    } catch (error) {
        console.error('Event ingestion error:', error);
        res.status(500).json({ error: 'Failed to ingest event' });
    }
});

/**
 * POST /api/events/batch
 * Batch ingestion for multiple events (performance optimization)
 */
eventRouter.post('/batch', async (req, res) => {
    try {
        const { sessionId, events } = req.body;

        if (!sessionId || !Array.isArray(events)) {
            return res.status(400).json({
                error: 'Missing required fields: sessionId, events array'
            });
        }

        const processedEvents = events.map(e => {
            const event = {
                eventId: uuidv4(),
                sessionId,
                eventType: e.eventType,
                timestamp: e.timestamp || Date.now(),
                metadata: e.metadata || {}
            };
            addEvent(sessionId, event);
            return event;
        });

        // Process last event to trigger cognitive analysis
        if (processedEvents.length > 0) {
            const lastEvent = processedEvents[processedEvents.length - 1];
            processEvent(lastEvent).catch(err => {
                console.error('Batch event processing error:', err);
            });
        }

        res.json({
            success: true,
            processedCount: processedEvents.length
        });

    } catch (error) {
        console.error('Batch ingestion error:', error);
        res.status(500).json({ error: 'Failed to ingest batch' });
    }
});

/**
 * GET /api/events/:sessionId
 * Get event history for a session (for research dashboard)
 */
eventRouter.get('/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const session = getSession(sessionId);
        const events = session.events.slice(-limit);

        res.json({
            sessionId,
            events,
            totalEvents: session.events.length
        });

    } catch (error) {
        console.error('Event retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve events' });
    }
});
