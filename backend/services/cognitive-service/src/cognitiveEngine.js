/**
 * COGNITIVE INFERENCE ENGINE
 * 
 * Core research component that analyzes behavioral patterns
 * and infers cognitive load states (NON-MEDICAL)
 * 
 * This is a rule-based system designed to be ML-ready for future enhancement
 */

/**
 * Analyzes behavioral event sequences to infer cognitive load
 * 
 * @param {Array} events - Recent behavioral events from session
 * @returns {Object} Inferred cognitive state
 */
export function inferCognitiveState(events, sessionId) {
    if (!events || events.length === 0) {
        return {
            sessionId,
            cognitiveLoad: 'low',
            patterns: [],
            confidence: 0.5,
            timestamp: Date.now(),
            behaviorSummary: {
                pauseFrequency: 0,
                replayCount: 0,
                avgSpeed: 1.0,
                idleTime: 0,
                navigationReversals: 0
            }
        };
    }

    // Calculate behavioral metrics
    const metrics = calculateBehaviorMetrics(events);

    // Detect patterns using rule-based logic
    const patterns = detectBehavioralPatterns(metrics, events);

    // Infer cognitive load level
    const cognitiveLoad = inferCognitiveLoad(patterns, metrics);

    // Calculate confidence based on sample size and pattern consistency
    const confidence = calculateConfidence(events.length, patterns);

    return {
        sessionId,
        cognitiveLoad,
        patterns,
        confidence,
        timestamp: Date.now(),
        behaviorSummary: metrics
    };
}

/**
 * Calculate quantitative metrics from behavioral events
 */
function calculateBehaviorMetrics(events) {
    const totalEvents = events.length;
    const timeWindow = events[events.length - 1].timestamp - events[0].timestamp;
    const timeWindowMinutes = timeWindow / 60000 || 1;

    const pauseEvents = events.filter(e => e.eventType && e.eventType.toUpperCase() === 'AUDIO_PAUSE');
    const replayEvents = events.filter(e => e.eventType && (e.eventType.toUpperCase() === 'AUDIO_REPLAY' || (e.eventType.toUpperCase() === 'AUDIO_SEEK' && e.metadata.seekDuration < 0)));
    const speedEvents = events.filter(e => e.eventType && e.eventType.toUpperCase() === 'AUDIO_SPEED_CHANGE');
    const navReversals = events.filter(e => e.eventType && e.eventType.toUpperCase() === 'NAVIGATION_REVERSAL');
    const idleEvents = events.filter(e => e.eventType && e.eventType.toUpperCase() === 'USER_IDLE');

    // Calculate average playback speed
    const avgSpeed = speedEvents.length > 0
        ? speedEvents.reduce((sum, e) => sum + (e.metadata.speed || 1.0), 0) / speedEvents.length
        : 1.0;

    // Calculate total idle time
    const totalIdleTime = idleEvents.reduce((sum, e) => sum + (e.metadata.idleDuration || 0), 0);

    return {
        pauseFrequency: pauseEvents.length / timeWindowMinutes,
        pauseCount: pauseEvents.length,
        replayCount: replayEvents.length,
        avgSpeed,
        idleTime: totalIdleTime,
        navigationReversals: navReversals.length || replayEvents.length, // Use replays as proxy if explicit events missing
        totalEvents,
        timeWindowMinutes
    };
}

/**
 * PATTERN DETECTION ALGORITHMS
 * 
 * These detect specific behavioral patterns that indicate cognitive states:
 * - Confusion: Navigation reversals + replays
 * - Overload: High pause frequency + slow speed + replays
 * - Fatigue: Increasing idle time + speed reduction
 * - Engagement: Consistent playback + normal speed
 */
function detectBehavioralPatterns(metrics, events) {
    const patterns = [];

    // PATTERN 1: Confusion
    // Indicators: Navigation reversals + replay events
    if (metrics.navigationReversals >= 1 && metrics.replayCount >= 1) {
        patterns.push('confusion');
    }

    // PATTERN 2: Cognitive Overload
    // Indicators: High pause frequency + slow speed + replays
    if (metrics.pauseFrequency > 3 && metrics.avgSpeed < 0.9 && metrics.replayCount >= 1) {
        patterns.push('overload');
    }

    // PATTERN 3: Fatigue
    // Indicators: Increasing idle periods + speed reduction over time
    if (metrics.idleTime > 30000 && metrics.avgSpeed < 0.85) { // 30 seconds idle
        patterns.push('fatigue');
    }

    // PATTERN 4: Navigation Difficulty
    // Indicators: Multiple navigation reversals
    if (metrics.navigationReversals >= 3) {
        patterns.push('navigation_difficulty');
    }

    // PATTERN 5: Engagement (positive pattern)
    // Indicators: Low pauses, normal speed, few reversals
    if (metrics.pauseFrequency < 1 && metrics.avgSpeed >= 0.9 && metrics.navigationReversals === 0) {
        patterns.push('engagement');
    }

    // PATTERN 6: Struggle
    // Indicators: Extreme pausing (even without other markers)
    if (metrics.pauseFrequency > 6) {
        patterns.push('struggle');
    }

    // PATTERN 7: Repetition Spike
    // Indicators: Multiple rapid replays/rewinds
    if (metrics.replayCount >= 2) {
        patterns.push('repetition_spike');
    }

    return patterns;
}

/**
 * Infer overall cognitive load level from detected patterns
 * 
 * LOW: Engaged, minimal pauses
 * MEDIUM: Some difficulty indicators
 * HIGH: Multiple stress/overload patterns
 */
function inferCognitiveLoad(patterns, metrics) {
    // High load indicators
    if (patterns.includes('overload') ||
        patterns.includes('struggle') ||
        (patterns.includes('confusion') && patterns.includes('fatigue'))) {
        return 'high';
    }

    // Medium load indicators
    if (patterns.includes('confusion') ||
        patterns.includes('fatigue') ||
        patterns.includes('navigation_difficulty') ||
        patterns.includes('repetition_spike') ||
        metrics.pauseFrequency > 2) {
        return 'medium';
    }

    // Low load (default or engagement)
    return 'low';
}

/**
 * Calculate confidence score based on data quality
 * More events = higher confidence
 * Consistent patterns = higher confidence
 */
function calculateConfidence(eventCount, patterns) {
    // Base confidence on sample size
    let confidence = Math.min(eventCount / 20, 0.8); // Max 0.8 from sample size

    // Boost confidence if clear patterns detected
    if (patterns.length > 0) {
        confidence += 0.1;
    }

    // Multiple patterns = higher confidence
    if (patterns.length >= 2) {
        confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
}

/**
 * Get recommended adaptations based on cognitive state
 * This bridges the cognitive engine with adaptation service
 */
export function recommendAdaptations(cognitiveState) {
    const recommendations = [];

    // High cognitive load -> Baseline + Patterns
    if (cognitiveState.cognitiveLoad === 'high') {
        recommendations.push('SLOW_NARRATION'); // Baseline for high load
        recommendations.push('SMART_PAUSE');     // Baseline for high load

        if (cognitiveState.patterns.includes('overload')) {
            recommendations.push('SLOW_NARRATION');
        }
        if (cognitiveState.patterns.includes('confusion')) {
            recommendations.push('AUTO_REPEAT');
            recommendations.push('SUMMARY_INJECTION');
        }
    }

    // Medium cognitive load -> Baseline + Targeted
    if (cognitiveState.cognitiveLoad === 'medium') {
        recommendations.push('SLOW_NARRATION'); // Baseline for medium load

        if (cognitiveState.patterns.includes('fatigue')) {
            recommendations.push('SLOW_NARRATION');
        }
        if (cognitiveState.patterns.includes('confusion')) {
            recommendations.push('AUTO_REPEAT');
        }
        if (cognitiveState.patterns.includes('navigation_difficulty')) {
            recommendations.push('SIMPLIFY_INTERACTION');
        }
    }

    // Return unique recommendations
    return [...new Set(recommendations)];
}
