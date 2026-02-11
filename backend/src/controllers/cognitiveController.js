/**
 * COGNITIVE STATE CONTROLLER
 * 
 * REST API endpoints for cognitive state queries
 */

import express from 'express';
import { getCurrentCognitiveState, getSession } from '../models/dataStore.js';

export const cognitiveRouter = express.Router();

/**
 * GET /api/cognitive/:sessionId
 * Get current cognitive state for a session
 */
cognitiveRouter.get('/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;

        const cognitiveState = getCurrentCognitiveState(sessionId);

        if (!cognitiveState) {
            return res.json({
                sessionId,
                cognitiveLoad: 'unknown',
                patterns: [],
                message: 'No cognitive state available yet - insufficient data'
            });
        }

        res.json(cognitiveState);

    } catch (error) {
        console.error('Cognitive state retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve cognitive state' });
    }
});

/**
 * GET /api/cognitive/:sessionId/history
 * Get cognitive state history for research analysis
 */
cognitiveRouter.get('/:sessionId/history', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = getSession(sessionId);

        res.json({
            sessionId,
            states: session.cognitiveStates,
            totalStates: session.cognitiveStates.length
        });

    } catch (error) {
        console.error('Cognitive history retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve cognitive history' });
    }
});
