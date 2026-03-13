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

    const metrics = calculateBehaviorMetrics(events);

    const patterns = detectBehavioralPatterns(metrics, events);

    const cognitiveLoad = inferCognitiveLoad(patterns, metrics);

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
    const speedEvents = events.filter(e => e.eventType && e.eventType.toUpperCase() === 'AUDIO_SPEED_CHANGE');
    const navReversals = events.filter(e => e.eventType && e.eventType.toUpperCase() === 'NAVIGATION_REVERSAL');
    const idleEvents = events.filter(e => e.eventType && e.eventType.toUpperCase() === 'USER_IDLE');

    const forwardSeekEvents = events.filter(e =>
        e.eventType && e.eventType.toUpperCase() === 'AUDIO_SEEK' && e.metadata && e.metadata.seekDuration > 0
    );
    const backwardSeekEvents = events.filter(e =>
        (e.eventType && e.eventType.toUpperCase() === 'AUDIO_SEEK' && e.metadata && e.metadata.seekDuration < 0) ||
        (e.eventType && e.eventType.toUpperCase() === 'AUDIO_REPLAY')
    );

    const avgSpeed = speedEvents.length > 0
        ? speedEvents.reduce((sum, e) => sum + (e.metadata.speed || 1.0), 0) / speedEvents.length
        : 1.0;

    const totalIdleTime = idleEvents.reduce((sum, e) => sum + (e.metadata.idleDuration || 0), 0);

    return {
        pauseFrequency: pauseEvents.length / timeWindowMinutes,
        pauseCount: pauseEvents.length,
        replayCount: backwardSeekEvents.length,
        forwardSeekCount: forwardSeekEvents.length,
        avgSpeed,
        idleTime: totalIdleTime,
        navigationReversals: navReversals.length,
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

    if (metrics.navigationReversals >= 1 && metrics.replayCount >= 1) {
        patterns.push('confusion');
    } else if (metrics.replayCount >= 3) {
        patterns.push('confusion');
    }

    if (metrics.pauseFrequency > 3 && metrics.avgSpeed < 0.9 && metrics.replayCount >= 1) {
        patterns.push('overload');
    }

    if (metrics.idleTime > 30000 && metrics.avgSpeed < 0.85) {
        patterns.push('fatigue');
    }

    if (metrics.navigationReversals >= 3 || metrics.replayCount >= 4) {
        patterns.push('navigation_difficulty');
    }

    if ((metrics.pauseFrequency < 1 && metrics.avgSpeed >= 0.9 && metrics.navigationReversals === 0) ||
        metrics.forwardSeekCount >= 2) {
        patterns.push('engagement');
    }

    if (metrics.pauseFrequency > 6) {
        patterns.push('struggle');
    }

    if (metrics.replayCount >= 3) {
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
    if (patterns.includes('overload') ||
        patterns.includes('struggle') ||
        (patterns.includes('confusion') && patterns.includes('fatigue'))) {
        return 'high';
    }

    if (patterns.includes('confusion') ||
        patterns.includes('fatigue') ||
        patterns.includes('navigation_difficulty') ||
        patterns.includes('repetition_spike') ||
        metrics.pauseFrequency > 2) {
        return 'medium';
    }

    return 'low';
}

/**
 * Calculate confidence score based on data quality
 * More events = higher confidence
 * Consistent patterns = higher confidence
 */
function calculateConfidence(eventCount, patterns) {
    let confidence = Math.min(eventCount / 20, 0.8);

    if (patterns.length > 0) {
        confidence += 0.1;
    }

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

    if (cognitiveState.cognitiveLoad === 'high') {
        recommendations.push('SLOW_NARRATION');
        recommendations.push('SMART_PAUSE');

        if (cognitiveState.patterns.includes('overload')) {
            recommendations.push('SLOW_NARRATION');
        }
    }

    if (cognitiveState.cognitiveLoad === 'medium') {
        recommendations.push('SLOW_NARRATION');

        if (cognitiveState.patterns.includes('fatigue')) {
            recommendations.push('SLOW_NARRATION');
        }
    }

    return [...new Set(recommendations)];
}
