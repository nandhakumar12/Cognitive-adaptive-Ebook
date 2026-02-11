/**
 * ADAPTATION CONTROLLER
 * 
 * REST API endpoints for adaptation management and history
 */

import express from 'express';
import { getRecentAdaptations, getSession } from '../models/dataStore.js';

export const adaptationRouter = express.Router();

/**
 * GET /api/adaptations/:sessionId
 * Get adaptation history for a session
 */
adaptationRouter.get('/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const adaptations = getRecentAdaptations(sessionId, limit);

        res.json({
            sessionId,
            adaptations,
            totalAdaptations: adaptations.length
        });

    } catch (error) {
        console.error('Adaptation retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve adaptations' });
    }
});

/**
 * GET /api/adaptations/:sessionId/active
 * Get currently active adaptations
 */
adaptationRouter.get('/:sessionId/active', (req, res) => {
    try {
        const { sessionId } = req.params;
        const now = Date.now();
        const adaptations = getRecentAdaptations(sessionId, 10);

        // Filter adaptations that are still within their duration window
        const activeAdaptations = adaptations.filter(a => {
            const duration = a.parameters.duration || 60000; // Default 60s
            return (now - a.timestamp) < duration;
        });

        res.json({
            sessionId,
            activeAdaptations,
            count: activeAdaptations.length
        });

    } catch (error) {
        console.error('Active adaptation retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve active adaptations' });
    }
});

/**
 * GET /api/adaptations/stats/:sessionId
 * Get adaptation statistics for research analysis
 */
adaptationRouter.get('/stats/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = getSession(sessionId);

        // Calculate statistics
        const strategyCount = {};
        session.adaptations.forEach(a => {
            strategyCount[a.strategy] = (strategyCount[a.strategy] || 0) + 1;
        });

        res.json({
            sessionId,
            totalAdaptations: session.adaptations.length,
            strategyBreakdown: strategyCount,
            averageAdaptationsPerMinute: calculateAdaptationRate(session)
        });

    } catch (error) {
        console.error('Adaptation stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve adaptation stats' });
    }
});

/**
 * Calculate adaptation rate (per minute)
 */
function calculateAdaptationRate(session) {
    if (session.adaptations.length === 0) return 0;

    const sessionDuration = Date.now() - session.startTime;
    const sessionMinutes = sessionDuration / 60000;

    return sessionMinutes > 0
        ? (session.adaptations.length / sessionMinutes).toFixed(2)
        : 0;
}
