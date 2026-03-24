/**
 * EVENT PROCESSOR
 * 
 * Asynchronous event processing pipeline
 * This is the heart of the COGNITIVE FEEDBACK LOOP
 * 
 * Flow:
 * 1. Receive event
 * 2. Analyze behavioral patterns
 * 3. Infer cognitive state
 * 4. Recommend adaptations
 * 5. Execute adaptations
 * 6. Loop continues
 */

import { getRecentEvents, updateCognitiveState, addAdaptation, getRecentAdaptations, getSession } from '../models/dataStore.js';
import { inferCognitiveState, recommendAdaptations } from '../engines/cognitiveEngine.js';
import { executeAdaptations, shouldApplyAdaptation } from '../services/adaptationService.js';

/**
 * Process a single behavioral event
 * Triggers the cognitive feedback loop
 */
export async function processEvent(event) {
    try {
        const { sessionId } = event;
        const sanitizedType = String(event.eventType).replaceAll(/[\r\n]/g, '');
        const sanitizedSessionId = String(sessionId).replaceAll(/[\r\n]/g, '');

        console.log(`[COGNITIVE LOOP] Processing event: ${sanitizedType} for session ${sanitizedSessionId}`);

        const allRecentEvents = getRecentEvents(sessionId, 50);
        const session = getSession(sessionId);
        const sectionId = session.currentSection;

        const recentEvents = allRecentEvents
            .filter(e => !sectionId || e.metadata.sectionId === sectionId)
            .slice(-20);

        const cognitiveState = inferCognitiveState(recentEvents, sessionId);

        updateCognitiveState(sessionId, cognitiveState);

        console.log(`[COGNITIVE LOOP] Cognitive Load: ${cognitiveState.cognitiveLoad}`);
        console.log(`[COGNITIVE LOOP] Patterns: ${cognitiveState.patterns.join(', ') || 'none'}`);

        const recommendedStrategies = recommendAdaptations(cognitiveState);

        if (recommendedStrategies.length === 0) {
            console.log(`[COGNITIVE LOOP] No adaptations needed - cognitive load is ${cognitiveState.cognitiveLoad}`);
            return;
        }

        console.log(`[COGNITIVE LOOP] Recommended adaptations: ${recommendedStrategies.join(', ')}`);

        const recentAdaptations = getRecentAdaptations(sessionId, 10);
        const applicableStrategies = recommendedStrategies.filter(strategy =>
            shouldApplyAdaptation(recentAdaptations, strategy)
        );

        if (applicableStrategies.length === 0) {
            console.log(`[COGNITIVE LOOP] All recommended adaptations in cooldown`);
            return;
        }

        const context = {
            currentTime: session.currentTime,
            currentSpeed: session.playbackSpeed,
            currentSection: session.currentSection,
            metrics: cognitiveState.behaviorSummary
        };

        const adaptations = executeAdaptations(cognitiveState, applicableStrategies, context);

        adaptations.forEach(adaptation => {
            addAdaptation(sessionId, adaptation);
        });

        console.log(`[COGNITIVE LOOP] Applied ${adaptations.length} adaptation(s)`);


    } catch (error) {
        console.error('[COGNITIVE LOOP] Processing error:', error);
    }
}

/**
 * Process batch of events
 */
export async function processBatchEvents(events) {
    for (const event of events) {
        await processEvent(event);
    }
}
