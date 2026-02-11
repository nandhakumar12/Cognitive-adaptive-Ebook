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

        console.log(`[COGNITIVE LOOP] Processing event: ${event.eventType} for session ${sessionId}`);

        // Step 1: Get recent behavioral events for analysis
        const recentEvents = getRecentEvents(sessionId, 20);

        // Step 2: Analyze patterns and infer cognitive state
        const cognitiveState = inferCognitiveState(recentEvents, sessionId);

        // Store cognitive state
        updateCognitiveState(sessionId, cognitiveState);

        console.log(`[COGNITIVE LOOP] Cognitive Load: ${cognitiveState.cognitiveLoad}`);
        console.log(`[COGNITIVE LOOP] Patterns: ${cognitiveState.patterns.join(', ') || 'none'}`);

        // Step 3: Get adaptation recommendations
        const recommendedStrategies = recommendAdaptations(cognitiveState);

        if (recommendedStrategies.length === 0) {
            console.log(`[COGNITIVE LOOP] No adaptations needed - cognitive load is ${cognitiveState.cognitiveLoad}`);
            return;
        }

        console.log(`[COGNITIVE LOOP] Recommended adaptations: ${recommendedStrategies.join(', ')}`);

        // Step 4: Filter based on cooldown and recent history
        const recentAdaptations = getRecentAdaptations(sessionId, 10);
        const applicableStrategies = recommendedStrategies.filter(strategy =>
            shouldApplyAdaptation(recentAdaptations, strategy)
        );

        if (applicableStrategies.length === 0) {
            console.log(`[COGNITIVE LOOP] All recommended adaptations in cooldown`);
            return;
        }

        // Step 5: Execute adaptations
        const session = getSession(sessionId);
        const context = {
            currentTime: session.currentTime,
            currentSpeed: session.playbackSpeed,
            currentSection: session.currentSection
        };

        const adaptations = executeAdaptations(cognitiveState, applicableStrategies, context);

        // Step 6: Store adaptation decisions
        adaptations.forEach(adaptation => {
            addAdaptation(sessionId, adaptation);
        });

        console.log(`[COGNITIVE LOOP] Applied ${adaptations.length} adaptation(s)`);

        // LOOP CONTINUES with next event...

    } catch (error) {
        console.error('[COGNITIVE LOOP] Processing error:', error);
        // Non-fatal - log but don't break the system
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
