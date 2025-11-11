// Session scheduler for time-bound interview sessions

let scheduledSessionsCollection = null;

// Initialize the collection (called from main server.js)
export function initializeScheduledSessions(db) {
    scheduledSessionsCollection = db.collection('scheduled_sessions');
    
    // Create indexes for efficient querying
    scheduledSessionsCollection.createIndex({ candidateId: 1 });
    scheduledSessionsCollection.createIndex({ sessionId: 1 });
    scheduledSessionsCollection.createIndex({ startTime: 1 });
    scheduledSessionsCollection.createIndex({ endTime: 1 });
    scheduledSessionsCollection.createIndex({ status: 1 });
}

// Create a new scheduled session
export async function createScheduledSession(sessionData) {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduledSession = {
        sessionId,
        candidateId: sessionData.candidateId,
        candidateName: sessionData.candidateName,
        position: sessionData.position || 'Software Developer',
        interviewerName: sessionData.interviewerName || 'AI Interviewer',
        startTime: new Date(sessionData.startTime), // ISO string or Date object
        endTime: new Date(sessionData.endTime), // ISO string or Date object
        duration: sessionData.duration || 60, // minutes
        status: 'scheduled', // scheduled, active, completed, expired, cancelled
        accessAttempts: 0,
        maxAccessAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Interview configuration
        interviewConfig: {
            skills: sessionData.skills || [],
            experienceLevel: sessionData.experienceLevel || 'intermediate',
            focusAreas: sessionData.focusAreas || ['technical', 'problem-solving'],
            allowCodeEditor: sessionData.allowCodeEditor !== false,
            customQuestions: sessionData.customQuestions || []
        },
        
        // Session metadata
        metadata: {
            timeZone: sessionData.timeZone || 'UTC',
            language: sessionData.language || 'en',
            recordingEnabled: sessionData.recordingEnabled !== false,
            notes: sessionData.notes || ''
        }
    };

    const result = await scheduledSessionsCollection.insertOne(scheduledSession);
    return { ...scheduledSession, _id: result.insertedId };
}

// Get scheduled session by candidate ID
export async function getScheduledSessionByCandidate(candidateId) {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    return await scheduledSessionsCollection.findOne({ candidateId });
}

// Validate if session is accessible at current time
export function validateSessionTiming(session) {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    const validation = {
        isValid: false,
        reason: '',
        timeToStart: 0,
        timeToEnd: 0,
        status: session.status
    };

    // Calculate time differences in minutes
    validation.timeToStart = Math.ceil((startTime - now) / (1000 * 60));
    validation.timeToEnd = Math.ceil((endTime - now) / (1000 * 60));

    // Check session status
    if (session.status === 'cancelled') {
        validation.reason = 'Session has been cancelled';
        return validation;
    }

    if (session.status === 'completed') {
        validation.reason = 'Session has already been completed';
        return validation;
    }

    if (session.status === 'expired') {
        validation.reason = 'Session has expired';
        return validation;
    }

    // Check timing
    if (now < startTime) {
        validation.reason = `Session hasn't started yet. Please come back at ${startTime.toLocaleString()}`;
        return validation;
    }

    if (now > endTime) {
        validation.reason = `Session time has expired. Session was valid until ${endTime.toLocaleString()}`;
        // Auto-expire the session
        updateSessionStatus(session.sessionId, 'expired');
        return validation;
    }

    // Check access attempts
    if (session.accessAttempts >= session.maxAccessAttempts) {
        validation.reason = `Maximum access attempts (${session.maxAccessAttempts}) exceeded`;
        return validation;
    }

    // Session is valid
    validation.isValid = true;
    validation.reason = 'Session is active and accessible';
    return validation;
}

// Update session status
export async function updateSessionStatus(sessionId, status, additionalData = {}) {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    const updateData = {
        status,
        updatedAt: new Date(),
        ...additionalData
    };

    return await scheduledSessionsCollection.updateOne(
        { sessionId },
        { $set: updateData }
    );
}

// Increment access attempts
export async function incrementAccessAttempts(sessionId) {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    return await scheduledSessionsCollection.updateOne(
        { sessionId },
        { 
            $inc: { accessAttempts: 1 },
            $set: { updatedAt: new Date() }
        }
    );
}

// Start a session (mark as active)
export async function startSession(sessionId) {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    return await updateSessionStatus(sessionId, 'active', {
        actualStartTime: new Date()
    });
}

// Complete a session
export async function completeSession(sessionId, completionData = {}) {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    return await updateSessionStatus(sessionId, 'completed', {
        actualEndTime: new Date(),
        completionData
    });
}

// Get all scheduled sessions (for admin)
export async function getAllScheduledSessions(filters = {}) {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    const query = {};
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.candidateId) query.candidateId = filters.candidateId;
    if (filters.dateFrom) query.startTime = { $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) query.startTime = { ...query.startTime, $lte: new Date(filters.dateTo) };

    return await scheduledSessionsCollection.find(query).sort({ startTime: 1 }).toArray();
}

// Delete expired sessions (cleanup job)
export async function cleanupExpiredSessions() {
    if (!scheduledSessionsCollection) {
        throw new Error('Scheduled sessions collection not initialized');
    }

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago

    // Mark expired sessions
    await scheduledSessionsCollection.updateMany(
        { 
            endTime: { $lt: now },
            status: { $in: ['scheduled', 'active'] }
        },
        { 
            $set: { 
                status: 'expired',
                updatedAt: now
            }
        }
    );

    // Optionally delete very old expired sessions (older than 24 hours)
    const deleteResult = await scheduledSessionsCollection.deleteMany({
        status: 'expired',
        updatedAt: { $lt: oneDayAgo }
    });

    return deleteResult;
}