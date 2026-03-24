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
 * Get recommended adaptations based on cognitive state
 */
export function recommendAdaptations(cognitiveState) {
    const recommendations = [];

    if (cognitiveState.cognitiveLoad === 'high') {
        recommendations.push('SMART_PAUSE');

        const pauseCount = cognitiveState.behaviorSummary?.pauseCount || 0;
        if (pauseCount >= 2 || cognitiveState.patterns?.includes('overload') || cognitiveState.patterns?.includes('struggle') || cognitiveState.patterns?.includes('repetition_spike')) {
            recommendations.push('SLOW_NARRATION');
        }

        if (cognitiveState.patterns?.includes('overload') || cognitiveState.patterns?.includes('struggle')) {
            recommendations.push('SMART_PAUSE');
        }
    }

    if (cognitiveState.cognitiveLoad === 'medium') {
        const pauseCount = cognitiveState.behaviorSummary?.pauseCount || 0;
        if (pauseCount >= 3 || cognitiveState.patterns?.includes('fatigue')) {
            recommendations.push('SLOW_NARRATION');
        }
    }

    return [...new Set(recommendations)];
}

/**
 * Create adaptation decision based on strategy and cognitive state
 * 
 * @param cognitiveState - Current inferred cognitive state
 * @param strategy - Adaptation strategy to apply
 * @param triggeredBy - Behavioral patterns that triggered this
 * @param context - Additional context (current time, section, etc.)
 * @returns Adaptation decision object
 */
export function createAdaptation(cognitiveState, strategy, triggeredBy, context = {}) {
    const sessionId = cognitiveState.sessionId;
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
                const currentSpeed = context.currentSpeed || 1.0;
                // Ternary for cleaner logic and to avoid useless initial assignment (S1854)
                const targetSpeed = currentSpeed > 0.75 ? 0.75 : 0.50;

                return {
                    targetSpeed,
                    duration: 15000
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
                pauseDuration: 3000,
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
 * @param cognitiveState - Current inferred cognitive state
 * @param strategies - Array of adaptation strategies to apply
 * @param context - Session context
 * @returns Array of adaptation decisions
 */
export function executeAdaptations(cognitiveState, strategies, context) {
    const adaptations = [];

    const patterns = cognitiveState.patterns?.length > 0
        ? cognitiveState.patterns
        : ['behavioral-signals'];

    for (const strategy of strategies) {
        const adaptation = createAdaptation(
            cognitiveState,
            strategy,
            patterns,
            context
        );

        if (adaptation) {
            adaptations.push(adaptation);

            console.log(`[ADAPTATION] ${strategy} triggered for session ${cognitiveState.sessionId}`);
            console.log(`  Reason: ${adaptation.reason}`);
            console.log(`  Patterns: ${patterns.join(', ')}`);
        }
    }

    return adaptations;
}


/**
 * Check if an adaptation should be applied based on recent history
 * Prevents over-adaptation (adaptation fatigue)
 * 
 * @param recentAdaptations - Recent adaptation history
 * @param strategy - Strategy being considered
 * @returns Whether to apply the adaptation
 */
export function shouldApplyAdaptation(recentAdaptations, strategy) {
    const now = Date.now();
    // Removed unused variable cooldownPeriod (S1854)
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
        (now - a.timestamp) < 60000
    );

    if (veryRecentAdaptations.length >= 20) {
        console.log(`[ADAPTATION] Skipping ${strategy} - too many recent adaptations`);
        return false;
    }

    return true;
}
