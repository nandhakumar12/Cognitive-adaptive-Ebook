/**
 * ADAPTATION SERVICE
 * 
 * Implements the 5 adaptation strategies:
 * 1. Slow Narration - Reduce playback speed
 * 2. Smart Pause - Auto-pause with cue
 * 
 * All adaptations occur WITHOUT user commands (key research innovation)
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Create adaptation decision based on strategy and cognitive state
 * 
 * @param {string} sessionId - Current listening session
 * @param {string} strategy - Adaptation strategy to apply
 * @param {Array} triggeredBy - Behavioral patterns that triggered this
 * @param {Object} context - Additional context (current time, section, etc.)
 * @returns {Object} Adaptation decision object
 */
export function createAdaptation(sessionId, strategy, triggeredBy, context = {}) {
    const adaptationId = uuidv4();
    const timestamp = Date.now();

    const adaptations = {
        SLOW_NARRATION: {
            adaptationId,
            sessionId,
            strategy: 'SLOW_NARRATION',
            timestamp,
            reason: 'High cognitive load detected - adjusting narration speed',
            parameters: (() => {
                const pauseCount = context.metrics?.pauseCount || 0;
                let targetSpeed = context.currentSpeed || 1.0;

                if (pauseCount >= 6) {
                    targetSpeed = 0.50;
                } else if (pauseCount >= 4) {
                    targetSpeed = 0.56;
                } else if (pauseCount >= 2) {
                    targetSpeed = 0.75;
                }

                return {
                    targetSpeed,
                    duration: 10000
                };
            })(),
            triggeredBy
        },


        SMART_PAUSE: {
            adaptationId,
            sessionId,
            strategy: 'SMART_PAUSE',
            timestamp,
            reason: 'Cognitive overload detected - providing pause for processing',
            parameters: {
                pauseDuration: 5000,
                audioCue: true,
                resumeMessage: 'Resuming audio in 3 seconds...'
            },
            triggeredBy
        }
    };

    return adaptations[strategy] || null;
}

/**
 * Execute multiple adaptations for a given cognitive state
 * 
 * @param {Object} cognitiveState - Current inferred cognitive state
 * @param {Array} strategies - Array of adaptation strategies to apply
 * @param {Object} context - Session context
 * @returns {Array} Array of adaptation decisions
 */
export function executeAdaptations(cognitiveState, strategies, context) {
    const adaptations = [];

    for (const strategy of strategies) {
        const adaptation = createAdaptation(
            cognitiveState.sessionId,
            strategy,
            cognitiveState.patterns,
            context
        );

        if (adaptation) {
            adaptations.push(adaptation);

            console.log(`[ADAPTATION] ${strategy} triggered for session ${cognitiveState.sessionId}`);
            console.log(`  Reason: ${adaptation.reason}`);
            console.log(`  Patterns: ${cognitiveState.patterns.join(', ')}`);
        }
    }

    return adaptations;
}


/**
 * Check if an adaptation should be applied based on recent history
 * Prevents over-adaptation (adaptation fatigue)
 * 
 * @param {Array} recentAdaptations - Recent adaptation history
 * @param {string} strategy - Strategy being considered
 * @returns {boolean} Whether to apply the adaptation
 */
export function shouldApplyAdaptation(recentAdaptations, strategy) {
    const now = Date.now();
    const cooldownPeriod = 5000;

    const effectiveCooldown = strategy === 'SMART_PAUSE' ? 8000 : 5000;
    const recentSameStrategy = recentAdaptations.filter(a =>
        a.strategy === strategy &&
        (now - a.timestamp) < effectiveCooldown
    );

    if (recentSameStrategy.length > 0) {
        console.log(`[ADAPTATION] Skipping ${strategy} - cooldown period active`);
        return false;
    }

    const veryRecentAdaptations = recentAdaptations.filter(a =>
        (now - a.timestamp) < 5000
    );

    if (veryRecentAdaptations.length >= 5) {
        console.log(`[ADAPTATION] Skipping ${strategy} - too many recent adaptations`);
        return false;
    }

    return true;
}
