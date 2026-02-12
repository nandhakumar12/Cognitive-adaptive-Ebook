import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE = "CognitiveSessions";
const USER_PROGRESS_TABLE = "UserProgress";

/**
 * Get or create a session
 */
export async function getSession(sessionId, userId = null) {
    const params = {
        TableName: SESSIONS_TABLE,
        Key: { sessionId }
    };

    try {
        const { Item } = await docClient.send(new GetCommand(params));

        if (Item) {
            // Bind user if not bound
            if (userId && !Item.userId) {
                await updateSessionUser(sessionId, userId);
                Item.userId = userId;
            }
            return Item;
        }

        // Create new session
        const newSession = {
            sessionId,
            userId,
            startTime: Date.now(),
            currentSection: 'intro',
            currentTime: 0,
            playbackSpeed: 1.0,
            events: [],
            cognitiveStates: [],
            adaptations: []
        };

        await docClient.send(new PutCommand({
            TableName: SESSIONS_TABLE,
            Item: newSession
        }));

        return newSession;
    } catch (err) {
        console.error("Error in getSession:", err);
        throw err;
    }
}

async function updateSessionUser(sessionId, userId) {
    const params = {
        TableName: SESSIONS_TABLE,
        Key: { sessionId },
        UpdateExpression: "set userId = :u",
        ExpressionAttributeValues: { ":u": userId }
    };
    await docClient.send(new UpdateCommand(params));
}

/**
 * Add event to session
 */
export async function addEvent(sessionId, event) {
    // If event has userId, ensure session is bound (best effort)
    if (event.userId) {
        // We don't await this to keep it fast, but in real app we might want to
        updateSessionUser(sessionId, event.userId).catch(() => { });
    }

    // Append to events list
    // Note: This naive list_append has a limit. For production, use a separate Events table.
    // We limit to 100 on read/write logic in application or here.
    // DynamoDB doesn't support "slice" natively in UpdateExpression easily without complex logic.
    // For now, we allow growing.

    // Actually, to respect the "last 100" logic, we should probably:
    // 1. Get Session
    // 2. Modify
    // 3. Put Session
    // This is safer for specific logic but slower/race-condition prone.
    // Given the low traffic, we'll do Read-Modify-Write for now to maintain logic parity.

    const session = await getSession(sessionId);
    session.events.push(event);
    if (session.events.length > 100) session.events = session.events.slice(-100);

    const params = {
        TableName: SESSIONS_TABLE,
        Key: { sessionId },
        UpdateExpression: "set events = :e",
        ExpressionAttributeValues: { ":e": session.events }
    };

    await docClient.send(new UpdateCommand(params));
    return session;
}

/**
 * Get recent events for analysis
 */
export async function getRecentEvents(sessionId, limit = 20) {
    const session = await getSession(sessionId);
    return session.events.slice(-limit);
}

/**
 * Update cognitive state for session
 */
export async function updateCognitiveState(sessionId, cognitiveState) {
    const session = await getSession(sessionId);
    session.cognitiveStates.push(cognitiveState);
    if (session.cognitiveStates.length > 20) session.cognitiveStates = session.cognitiveStates.slice(-20);

    const params = {
        TableName: SESSIONS_TABLE,
        Key: { sessionId },
        UpdateExpression: "set cognitiveStates = :cs",
        ExpressionAttributeValues: { ":cs": session.cognitiveStates }
    };

    await docClient.send(new UpdateCommand(params));
    return session;
}

/**
 * Get current cognitive state
 */
export async function getCurrentCognitiveState(sessionId) {
    const session = await getSession(sessionId);
    return session.cognitiveStates[session.cognitiveStates.length - 1] || null;
}

/**
 * Add adaptation to session
 */
export async function addAdaptation(sessionId, adaptation) {
    const session = await getSession(sessionId);
    session.adaptations.push(adaptation);

    const params = {
        TableName: SESSIONS_TABLE,
        Key: { sessionId },
        UpdateExpression: "set adaptations = :a",
        ExpressionAttributeValues: { ":a": session.adaptations }
    };

    await docClient.send(new UpdateCommand(params));
    return session;
}

/**
 * Get recent adaptations
 */
export async function getRecentAdaptations(sessionId, limit = 10) {
    const session = await getSession(sessionId);
    return session.adaptations.slice(-limit);
}

/**
 * Update session context
 */
export async function updateSessionContext(sessionId, context) {
    // Construct UpdateExpression dynamically
    let updateExp = "set ";
    const expAttrValues = {};
    const expAttrNames = {};
    let first = true;

    if (context.currentTime !== undefined) {
        updateExp += "currentTime = :t";
        expAttrValues[":t"] = context.currentTime;
        first = false;
    }
    if (context.playbackSpeed !== undefined) {
        if (!first) updateExp += ", ";
        updateExp += "playbackSpeed = :s";
        expAttrValues[":s"] = context.playbackSpeed;
        first = false;
    }
    if (context.currentSection !== undefined) {
        if (!first) updateExp += ", ";
        updateExp += "currentSection = :sec";
        expAttrValues[":sec"] = context.currentSection;
    }

    if (Object.keys(expAttrValues).length > 0) {
        const params = {
            TableName: SESSIONS_TABLE,
            Key: { sessionId },
            UpdateExpression: updateExp,
            ExpressionAttributeValues: expAttrValues
        };
        await docClient.send(new UpdateCommand(params));
    }

    const session = await getSession(sessionId); // Fetch updated

    // Also update user progress if userId present
    if (session.userId && context.currentSection) {
        await saveUserProgress(session.userId, "book-default", context.currentSection, context.currentTime);
        // Note: bookId hardcoded to 'book-default' for now as explicit bookId wasn't in original context
    }

    return session;
}

/**
 * Get all sessions
 */
export async function getAllSessions() {
    const params = {
        TableName: SESSIONS_TABLE
    };
    const { Items } = await docClient.send(new ScanCommand(params));
    return Items || [];
}

/**
 * Save User Progress
 */
export async function saveUserProgress(userId, bookId = "default", sectionId, progressTime) {
    const params = {
        TableName: USER_PROGRESS_TABLE,
        Item: {
            userId,
            bookId,
            progress: sectionId, // Interpreting sectionId as 'progress' from original schema
            lastUpdated: Date.now(),
            currentTime: progressTime
        }
    };
    await docClient.send(new PutCommand(params));
}

/**
 * Get User Progress
 */
export async function getUserProgress(userId, bookId = "default") {
    const params = {
        TableName: USER_PROGRESS_TABLE,
        Key: { userId, bookId }
    };
    const { Item } = await docClient.send(new GetCommand(params));
    return Item || null;
}

