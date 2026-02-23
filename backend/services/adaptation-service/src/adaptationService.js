/**
 * ADAPTATION SERVICE
 * 
 * Implements the 5 adaptation strategies:
 * 1. Slow Narration - Reduce playback speed
 * 2. Auto-Repeat - Replay recent segments
 * 3. Smart Pause - Auto-pause with cue
 * 4. Summary Injection - Provide recaps
 * 5. Simplify Interaction - Reduce control complexity
 * 
 * All adaptations occur WITHOUT user commands (key research innovation)
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Get recommended adaptations based on cognitive state
 */
export function recommendAdaptations(cognitiveState) {
    const recommendations = [];

    // High cognitive load -> Targeted Patterns
    if (cognitiveState.cognitiveLoad === 'high') {
        recommendations.push('SMART_PAUSE');     // Baseline for high load

        const pauseCount = cognitiveState.behaviorSummary?.pauseCount || 0;
        // Trigger SLOW_NARRATION if load is high and user is pausing or struggling
        if (pauseCount >= 2 || cognitiveState.patterns.includes('overload') || cognitiveState.patterns.includes('struggle')) {
            recommendations.push('SLOW_NARRATION');
        }

        if (cognitiveState.patterns.includes('overload') || cognitiveState.patterns.includes('struggle')) {
            recommendations.push('SMART_PAUSE');
        }
        if (cognitiveState.patterns.includes('confusion') || cognitiveState.patterns.includes('repetition_spike')) {
            recommendations.push('AUTO_REPEAT');
            recommendations.push('SUMMARY_INJECTION');
        }
    }

    // Medium cognitive load -> Targeted Patterns
    if (cognitiveState.cognitiveLoad === 'medium') {
        const pauseCount = cognitiveState.behaviorSummary?.pauseCount || 0;
        // Trigger SLOW_NARRATION if pausing frequently or showing fatigue
        if (pauseCount >= 3 || cognitiveState.patterns.includes('fatigue')) {
            recommendations.push('SLOW_NARRATION');
        }
        if (cognitiveState.patterns.includes('confusion')) {
            recommendations.push('AUTO_REPEAT');
        }
        if (cognitiveState.patterns.includes('navigation_difficulty') || cognitiveState.patterns.includes('repetition_spike')) {
            recommendations.push('SIMPLIFY_INTERACTION');
            recommendations.push('SUMMARY_INJECTION');
        }
    }

    // Return unique recommendations
    return [...new Set(recommendations)];
}

/**
 * Create adaptation decision based on strategy and cognitive state
 * 
 * @param {Object} cognitiveState - Current inferred cognitive state
 * @param {string} strategy - Adaptation strategy to apply
 * @param {Array} triggeredBy - Behavioral patterns that triggered this
 * @param {Object} context - Additional context (current time, section, etc.)
 * @returns {Object} Adaptation decision object
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
                let targetSpeed = currentSpeed;

                // TWO-STAGE SLOWDOWN LOGIC
                // Stage 1: Automatic drop to 0.75x (silent in frontend if > 0.75)
                // Stage 2: Prompted drop to 0.50x (if already at 0.75 or lower)
                if (currentSpeed > 0.75) {
                    targetSpeed = 0.75;
                } else {
                    targetSpeed = 0.50;
                }

                return {
                    targetSpeed,
                    duration: 15000 // 15 seconds for testing
                };
            })(),
            triggeredBy
        },

        AUTO_REPEAT: {
            adaptationId,
            sessionId,
            strategy: 'AUTO_REPEAT',
            timestamp,
            reason: 'Confusion pattern detected - replaying recent content for reinforcement',
            parameters: {
                replayDuration: 30, // Go back 30 seconds
                currentTime: context.currentTime || 0,
                targetTime: Math.max(0, (context.currentTime || 30) - 30)
            },
            triggeredBy
        },

        SMART_PAUSE: {
            adaptationId,
            sessionId,
            strategy: 'SMART_PAUSE',
            timestamp,
            reason: 'Cognitive overload detected - providing pause for processing',
            parameters: {
                pauseDuration: 3000, // 3 second pause
                audioCue: true, // Gentle chime to indicate pause
                resumeMessage: 'Resuming audio in 3 seconds...'
            },
            triggeredBy
        },

        SUMMARY_INJECTION: {
            adaptationId,
            sessionId,
            strategy: 'SUMMARY_INJECTION',
            timestamp,
            reason: triggeredBy.includes('repetition_spike')
                ? 'Multiple rewinds detected - providing section summary for clarity'
                : 'Disorientation detected - providing section summary',
            parameters: {
                summaryText: generateSummary(context.currentSection),
                insertBefore: true, // Insert before continuing
                summaryDuration: 10000 // 10 seconds for summary
            },
            triggeredBy
        },

        SIMPLIFY_INTERACTION: {
            adaptationId,
            sessionId,
            strategy: 'SIMPLIFY_INTERACTION',
            timestamp,
            reason: 'High cognitive load - reducing interface complexity',
            parameters: {
                hideControls: ['skip', 'rewind', 'chapters'], // Hide non-essential controls
                showEssentialOnly: ['play', 'pause'],
                duration: 120000 // Apply for 2 minutes
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

    const patterns = (cognitiveState.patterns && cognitiveState.patterns.length > 0)
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

            // Log for research purposes
            console.log(`[ADAPTATION] ${strategy} triggered for session ${cognitiveState.sessionId}`);
            console.log(`  Reason: ${adaptation.reason}`);
            console.log(`  Patterns: ${patterns.join(', ')}`);
        }
    }

    return adaptations;
}

/**
 * Generate contextual summary for current section
 * (In production, this would use actual content analysis or pre-generated summaries)
 */
function generateSummary(sectionId) {
    // Placeholder - in real system, fetch from content database
    const summaries = {
        'chapter-1': 'Summary: This chapter introduced the main character and setting.',
        'chapter-2': 'Summary: The conflict was established and key relationships formed.',
        'chapter-3': 'Summary: The protagonist faced their first major challenge.',
        'default': 'Summary: Let\'s recap what we\'ve covered so far in this section.'
    };

    return summaries[sectionId] || summaries.default;
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
    const cooldownPeriod = 5000; // 5 seconds as requested

    // Check if same strategy was recently applied
    const recentSameStrategy = recentAdaptations.filter(a =>
        a.strategy === strategy &&
        (now - a.timestamp) < cooldownPeriod
    );

    if (recentSameStrategy.length > 0) {
        console.log(`[ADAPTATION] Skipping ${strategy} - cooldown period active`);
        return false;
    }

    // Prevent excessive spam (increased for testing)
    const veryRecentAdaptations = recentAdaptations.filter(a =>
        (now - a.timestamp) < 60000
    );

    if (veryRecentAdaptations.length >= 20) { // Limit to 20 per minute for testing
        console.log(`[ADAPTATION] Skipping ${strategy} - too many recent adaptations`);
        return false;
    }

    return true;
}
