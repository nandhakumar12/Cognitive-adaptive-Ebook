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
            reason: 'High cognitive load detected - reducing narration speed to improve comprehension',
            parameters: {
                speedAdjustment: 0.75, // Reduce to 75% speed
                targetSpeed: Math.max(0.5, (context.currentSpeed || 1.0) * 0.75),
                duration: 60000 // Apply for 60 seconds
            },
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
                pauseDuration: 5000, // 5 second pause
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
            reason: 'Disorientation detected - providing section summary',
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

    for (const strategy of strategies) {
        const adaptation = createAdaptation(
            cognitiveState.sessionId,
            strategy,
            cognitiveState.patterns,
            context
        );

        if (adaptation) {
            adaptations.push(adaptation);

            // Log for research purposes
            console.log(`[ADAPTATION] ${strategy} triggered for session ${cognitiveState.sessionId}`);
            console.log(`  Reason: ${adaptation.reason}`);
            console.log(`  Patterns: ${cognitiveState.patterns.join(', ')}`);
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
    const cooldownPeriod = 60000; // 1 minute cooldown per strategy

    // Check if same strategy was recently applied
    const recentSameStrategy = recentAdaptations.filter(a =>
        a.strategy === strategy &&
        (now - a.timestamp) < cooldownPeriod
    );

    if (recentSameStrategy.length > 0) {
        console.log(`[ADAPTATION] Skipping ${strategy} - cooldown period active`);
        return false;
    }

    // Prevent too many adaptations in short time (max 3 per minute)
    const veryRecentAdaptations = recentAdaptations.filter(a =>
        (now - a.timestamp) < 60000
    );

    if (veryRecentAdaptations.length >= 3) {
        console.log(`[ADAPTATION] Skipping ${strategy} - too many recent adaptations`);
        return false;
    }

    return true;
}
