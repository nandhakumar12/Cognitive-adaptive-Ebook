/**
 * IN-MEMORY DATA STORE
 * 
 * Temporary storage for sessions, events, and cognitive states
 * In production: Replace with DynamoDB or similar
 * 
 * This design allows easy migration to cloud databases
 */

// Session-based storage (NoSQL-ready structure)
const sessions = new Map();

// User progress storage (mock DynamoDB UserProgress table)
const userProgress = new Map();

/**
 * Get or create a session
 */
export function getSession(sessionId, userId = null) {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            sessionId,
            userId,
            startTime: Date.now(),
            currentSection: 'intro',
            currentTime: 0,
            playbackSpeed: 1.0,
            events: [],
            cognitiveStates: [],
            adaptations: []
        });
    }
    const session = sessions.get(sessionId);
    // Bind user to session if not already bound
    if (userId && !session.userId) {
        session.userId = userId;
    }
    return session;
}

/**
 * Add event to session
 */
export function addEvent(sessionId, event) {
    // If event has userId, pass it to getSession
    const session = getSession(sessionId, event.userId);
    session.events.push(event);

    // Keep only last 100 events for performance (rolling window)
    if (session.events.length > 100) {
        session.events = session.events.slice(-100);
    }

    return session;
}

/**
 * Get recent events for analysis
 */
export function getRecentEvents(sessionId, limit = 20) {
    const session = getSession(sessionId);
    return session.events.slice(-limit);
}

/**
 * Update cognitive state for session
 */
export function updateCognitiveState(sessionId, cognitiveState) {
    const session = getSession(sessionId);
    session.cognitiveStates.push(cognitiveState);

    // Keep only last 20 states
    if (session.cognitiveStates.length > 20) {
        session.cognitiveStates = session.cognitiveStates.slice(-20);
    }

    return session;
}

/**
 * Get current cognitive state
 */
export function getCurrentCognitiveState(sessionId) {
    const session = getSession(sessionId);
    return session.cognitiveStates[session.cognitiveStates.length - 1] || null;
}

/**
 * Add adaptation to session
 */
export function addAdaptation(sessionId, adaptation) {
    const session = getSession(sessionId);
    session.adaptations.push(adaptation);
    return session;
}

/**
 * Get recent adaptations
 */
export function getRecentAdaptations(sessionId, limit = 10) {
    const session = getSession(sessionId);
    return session.adaptations.slice(-limit);
}

/**
 * Update session context (current time, speed, section)
 */
export function updateSessionContext(sessionId, context) {
    const session = getSession(sessionId);
    if (context.currentTime !== undefined) session.currentTime = context.currentTime;
    if (context.playbackSpeed !== undefined) session.playbackSpeed = context.playbackSpeed;
    if (context.currentSection !== undefined) session.currentSection = context.currentSection;

    // Also update user progress if userId present (for library view)
    if (session.userId && context.currentSection) {
        saveUserProgress(session.userId, context.currentSection, context.currentTime);
    }

    return session;
}

/**
 * Get all sessions (for research dashboard)
 */
export function getAllSessions() {
    return Array.from(sessions.values());
}

/**
 * Save User Progress (Book/Chapter level)
 */
export function saveUserProgress(userId, bookId, progress) {
    const key = `${userId}:${bookId}`;
    userProgress.set(key, {
        userId,
        bookId,
        progress,
        lastUpdated: Date.now()
    });
}

/**
 * Get User Progress
 */
export function getUserProgress(userId, bookId) {
    return userProgress.get(`${userId}:${bookId}`) || null;
}
