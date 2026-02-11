/**
 * BEHAVIORAL COGNITIVE INDICATORS - Event Types
 * These events represent observable interaction patterns
 * NOT user commands or explicit inputs
 */

export type BehavioralEventType =
    | 'AUDIO_PLAY'
    | 'AUDIO_PAUSE'
    | 'AUDIO_SPEED_CHANGE'
    | 'AUDIO_REPLAY'
    | 'AUDIO_SEEK'
    | 'NAVIGATION_REVERSAL'
    | 'USER_IDLE'
    | 'SECTION_COMPLETE'
    | 'SESSION_START'
    | 'SESSION_END';

/**
 * Cognitive load levels inferred from behavioral patterns
 * NON-MEDICAL: These are behavioral states, not medical diagnoses
 */
export type CognitiveLoadLevel = 'low' | 'medium' | 'high';

/**
 * Detected behavioral patterns (for research purposes)
 */
export type BehavioralPattern =
    | 'confusion'
    | 'overload'
    | 'engagement'
    | 'fatigue'
    | 'navigation_difficulty';

/**
 * Adaptation strategies that can be automatically triggered
 */
export type AdaptationStrategy =
    | 'SLOW_NARRATION'
    | 'AUTO_REPEAT'
    | 'SMART_PAUSE'
    | 'SUMMARY_INJECTION'
    | 'SIMPLIFY_INTERACTION';

/**
 * Behavioral Event Schema
 * Emitted by frontend, processed by backend
 */
export interface BehavioralEvent {
    eventId: string;
    sessionId: string;
    eventType: BehavioralEventType;
    timestamp: number;
    metadata: {
        currentTime?: number;
        previousTime?: number;
        speed?: number;
        sectionId?: string;
        duration?: number;
        idleDuration?: number;
        [key: string]: any;
    };
}

/**
 * Cognitive State Schema
 * Inferred state based on behavioral analysis (NON-MEDICAL)
 */
export interface CognitiveState {
    sessionId: string;
    cognitiveLoad: CognitiveLoadLevel;
    patterns: BehavioralPattern[];
    confidence: number; // 0-1
    timestamp: number;
    behaviorSummary: {
        pauseFrequency: number;
        replayCount: number;
        avgSpeed: number;
        idleTime: number;
        navigationReversals: number;
    };
}

/**
 * Adaptation Decision Schema
 * Decisions made by cognitive engine to adapt content delivery
 */
export interface AdaptationDecision {
    adaptationId: string;
    sessionId: string;
    strategy: AdaptationStrategy;
    timestamp: number;
    reason: string;
    parameters: {
        speedAdjustment?: number;
        replayDuration?: number;
        pauseDuration?: number;
        summaryText?: string;
        [key: string]: any;
    };
    triggeredBy: BehavioralPattern[];
}

/**
 * Session data for tracking user listening sessions
 */
export interface ListeningSession {
    sessionId: string;
    startTime: number;
    endTime?: number;
    currentSection: string;
    currentTime: number;
    playbackSpeed: number;
    events: BehavioralEvent[];
    cognitiveStates: CognitiveState[];
    adaptations: AdaptationDecision[];
}
