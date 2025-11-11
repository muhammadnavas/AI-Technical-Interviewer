import express from 'express';
import {
    cleanupExpiredSessions,
    completeSession,
    createScheduledSession,
    getAllScheduledSessions,
    getScheduledSessionByCandidate,
    incrementAccessAttempts,
    startSession,
    updateSessionStatus,
    validateSessionTiming
} from '../utils/sessionScheduler.js';

const router = express.Router();

// Get scheduled session by candidate ID (for email system)
router.get('/candidate/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        
        if (!candidateId) {
            return res.status(400).json({
                success: false,
                error: 'Candidate ID is required'
            });
        }

        const session = await getScheduledSessionByCandidate(candidateId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No scheduled session found for this candidate'
            });
        }

        res.json({
            success: true,
            session: {
                sessionId: session.sessionId,
                candidateId: session.candidateId,
                candidateName: session.candidateName,
                scheduledDate: session.startTime,
                scheduledTime: session.startTime,
                duration: session.duration,
                interviewType: session.interviewType || 'Technical Interview',
                notes: session.notes || '',
                status: session.status,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching scheduled session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch scheduled session'
        });
    }
});

// Create a new scheduled session (Admin only)
router.post('/create', async (req, res) => {
    try {
        const sessionData = req.body;
        
        // Validate required fields
        if (!sessionData.candidateId || !sessionData.candidateName || !sessionData.startTime || !sessionData.endTime) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: candidateId, candidateName, startTime, endTime'
            });
        }

        // Validate time window
        const startTime = new Date(sessionData.startTime);
        const endTime = new Date(sessionData.endTime);
        
        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                error: 'Start time must be before end time'
            });
        }

        const now = new Date();
        if (endTime <= now) {
            return res.status(400).json({
                success: false,
                error: 'End time must be in the future'
            });
        }

        // Check if candidate already has a scheduled session
        const existingSession = await getScheduledSessionByCandidate(sessionData.candidateId);
        if (existingSession && ['scheduled', 'active'].includes(existingSession.status)) {
            return res.status(409).json({
                success: false,
                error: 'Candidate already has an active or scheduled session',
                existingSession: {
                    sessionId: existingSession.sessionId,
                    startTime: existingSession.startTime,
                    endTime: existingSession.endTime,
                    status: existingSession.status
                }
            });
        }

        const createdSession = await createScheduledSession(sessionData);
        
        res.json({
            success: true,
            message: 'Scheduled session created successfully',
            session: {
                sessionId: createdSession.sessionId,
                candidateId: createdSession.candidateId,
                candidateName: createdSession.candidateName,
                startTime: createdSession.startTime,
                endTime: createdSession.endTime,
                duration: createdSession.duration,
                status: createdSession.status,
                accessUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?candidateId=${createdSession.candidateId}`
            }
        });
    } catch (error) {
        console.error('Error creating scheduled session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create scheduled session'
        });
    }
});

// Access session by candidate ID (Student access point)
router.post('/access', async (req, res) => {
    try {
        const { candidateId } = req.body;
        
        if (!candidateId) {
            return res.status(400).json({
                success: false,
                error: 'Candidate ID is required'
            });
        }

        // Get scheduled session
        const session = await getScheduledSessionByCandidate(candidateId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No scheduled session found for this candidate ID'
            });
        }

        // Validate timing and access
        const validation = validateSessionTiming(session);
        
        if (!validation.isValid) {
            // Increment access attempts for tracking
            await incrementAccessAttempts(session.sessionId);
            
            return res.status(403).json({
                success: false,
                error: validation.reason,
                sessionInfo: {
                    candidateName: session.candidateName,
                    position: session.position,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    status: session.status,
                    timeToStart: validation.timeToStart,
                    timeToEnd: validation.timeToEnd
                }
            });
        }

        // Session is valid - start it if not already active
        if (session.status === 'scheduled') {
            await startSession(session.sessionId);
            session.status = 'active';
        }

        // Increment access attempts
        await incrementAccessAttempts(session.sessionId);

        // Prepare session data for frontend
        const sessionData = {
            sessionId: session.sessionId,
            candidateId: session.candidateId,
            candidateName: session.candidateName,
            position: session.position,
            interviewerName: session.interviewerName,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            timeRemaining: validation.timeToEnd,
            
            // Interview configuration
            skills: session.interviewConfig?.skills || [],
            experienceLevel: session.interviewConfig?.experienceLevel || 'intermediate',
            focusAreas: session.interviewConfig?.focusAreas || ['technical'],
            allowCodeEditor: session.interviewConfig?.allowCodeEditor !== false,
            customQuestions: session.interviewConfig?.customQuestions || [],
            
            // Session settings
            recordingEnabled: session.metadata?.recordingEnabled !== false,
            language: session.metadata?.language || 'en',
            
            // Status
            status: 'active',
            accessAttempts: session.accessAttempts + 1
        };

        res.json({
            success: true,
            message: 'Session access granted',
            session: sessionData,
            initialMessage: `Hello ${session.candidateName}! Welcome to your scheduled technical interview for the ${session.position} position. You have ${validation.timeToEnd} minutes remaining in your session. Let's begin!`
        });

    } catch (error) {
        console.error('Error accessing scheduled session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to access session'
        });
    }
});

// Get scheduled interview by candidate ID (for email system)
router.get('/candidate/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        
        const session = await getScheduledSessionByCandidate(candidateId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No scheduled interview found for this candidate'
            });
        }

        // Return session data for email system
        res.json({
            success: true,
            sessionId: session.sessionId,
            candidateId: session.candidateId,
            candidateName: session.candidateName,
            position: session.position,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            status: session.status,
            createdAt: session.createdAt
        });
    } catch (error) {
        console.error('Error fetching scheduled interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch scheduled interview'
        });
    }
});

// Check session status (for real-time updates)
router.get('/status/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        
        const session = await getScheduledSessionByCandidate(candidateId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        const validation = validateSessionTiming(session);
        
        res.json({
            success: true,
            sessionStatus: {
                candidateId: session.candidateId,
                candidateName: session.candidateName,
                sessionId: session.sessionId,
                status: session.status,
                startTime: session.startTime,
                endTime: session.endTime,
                timeToStart: validation.timeToStart,
                timeToEnd: validation.timeToEnd,
                isAccessible: validation.isValid,
                reason: validation.reason,
                accessAttempts: session.accessAttempts,
                maxAccessAttempts: session.maxAccessAttempts
            }
        });
    } catch (error) {
        console.error('Error checking session status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check session status'
        });
    }
});

// Complete session (called when interview ends)
router.post('/complete', async (req, res) => {
    try {
        const { sessionId, candidateId, completionData } = req.body;
        
        if (!sessionId && !candidateId) {
            return res.status(400).json({
                success: false,
                error: 'Either sessionId or candidateId is required'
            });
        }

        let session;
        if (candidateId) {
            session = await getScheduledSessionByCandidate(candidateId);
        } else {
            // You'd need to add a function to get session by sessionId
            session = await getScheduledSessionByCandidate(candidateId); // placeholder
        }

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        await completeSession(session.sessionId, completionData);

        res.json({
            success: true,
            message: 'Session completed successfully'
        });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete session'
        });
    }
});

// Get all sessions (Admin endpoint)
router.get('/list', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            candidateId: req.query.candidateId,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        // Remove undefined values
        Object.keys(filters).forEach(key => 
            filters[key] === undefined && delete filters[key]
        );

        const sessions = await getAllScheduledSessions(filters);
        
        res.json({
            success: true,
            count: sessions.length,
            sessions: sessions.map(session => ({
                sessionId: session.sessionId,
                candidateId: session.candidateId,
                candidateName: session.candidateName,
                position: session.position,
                startTime: session.startTime,
                endTime: session.endTime,
                status: session.status,
                accessAttempts: session.accessAttempts,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }))
        });
    } catch (error) {
        console.error('Error listing sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list sessions'
        });
    }
});

// Update session (Admin endpoint)
router.put('/update/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updateData = req.body;
        
        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.sessionId;
        delete updateData.createdAt;
        
        await updateSessionStatus(sessionId, updateData.status || 'scheduled', updateData);
        
        res.json({
            success: true,
            message: 'Session updated successfully'
        });
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update session'
        });
    }
});

// Cleanup expired sessions (Admin/Cron endpoint)
router.post('/cleanup', async (req, res) => {
    try {
        const result = await cleanupExpiredSessions();
        
        res.json({
            success: true,
            message: 'Cleanup completed',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup expired sessions'
        });
    }
});

export default router;