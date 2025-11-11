import express from 'express';
import { MongoClient } from 'mongodb';
import emailService from '../utils/emailService.js';

const router = express.Router();

// MongoDB connection
const getDatabase = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGO_DB_NAME || 'test';
    
    console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')} DB: ${dbName}`);
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    return client.db(dbName);
};

/**
 * Send session invite email to candidate
 * POST /api/email/send-session-invite
 * Body: { candidateId, sessionId }
 */
router.post('/send-session-invite', async (req, res) => {
    try {
        const { candidateId, sessionId } = req.body;

        if (!candidateId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: 'candidateId and sessionId are required'
            });
        }

        console.log(`📧 Processing email request for candidate: ${candidateId}, session: ${sessionId}`);

        // Get database connection
        const db = await getDatabase();

        // Find candidate details
        const candidate = await db.collection('candidates').findOne({
            candidateId: candidateId
        });

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        // Find scheduled session
        const scheduledSession = await db.collection('scheduled_sessions').findOne({
            sessionId: sessionId,
            candidateId: candidateId
        });

        if (!scheduledSession) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled session not found'
            });
        }

        // Check if session is still valid (not expired)
        const now = new Date();
        const sessionEndTime = new Date(scheduledSession.endTime);
        
        if (now > sessionEndTime) {
            return res.status(400).json({
                success: false,
                message: 'Session has already expired'
            });
        }

        // Generate session URL - prioritize production URL
        const baseUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
        const sessionUrl = `${baseUrl}?candidateId=${candidateId}&sessionId=${sessionId}`;

        // Prepare candidate data for email
        const candidateData = {
            name: candidate.name || candidate.full_name || 'Dear Candidate',
            email: candidate.email || candidate.candidateEmail,
            candidateId: candidateId
        };

        // Prepare session details
        const sessionDetails = {
            startTime: scheduledSession.startTime,
            endTime: scheduledSession.endTime,
            duration: scheduledSession.duration || 60,
            sessionId: sessionId
        };

        // Validate candidate has email
        if (!candidateData.email) {
            return res.status(400).json({
                success: false,
                message: 'Candidate email not found'
            });
        }

        console.log(`📤 Sending session invite to: ${candidateData.email}`);
        console.log(`🔗 Session URL: ${sessionUrl}`);

        // Send email using emailService
        const emailResult = await emailService.sendSessionInvite(
            candidateData,
            sessionUrl,
            sessionDetails
        );

        if (emailResult.success) {
            // Update scheduled session with email sent status
            await db.collection('scheduled_sessions').updateOne(
                { sessionId: sessionId },
                { 
                    $set: { 
                        emailSent: true,
                        emailSentAt: new Date(),
                        emailMessageId: emailResult.messageId,
                        sessionUrl: sessionUrl
                    }
                }
            );

            console.log(`✅ Email sent successfully to ${candidateData.email}`);

            res.json({
                success: true,
                message: 'Session invite email sent successfully',
                data: {
                    candidateId: candidateId,
                    candidateName: candidateData.name,
                    candidateEmail: candidateData.email,
                    sessionId: sessionId,
                    sessionUrl: sessionUrl,
                    emailMessageId: emailResult.messageId,
                    sessionDetails: sessionDetails
                }
            });
        } else {
            console.error(`❌ Failed to send email to ${candidateData.email}:`, emailResult.error);

            res.status(500).json({
                success: false,
                message: 'Failed to send session invite email',
                error: emailResult.error,
                data: {
                    candidateId: candidateId,
                    candidateEmail: candidateData.email,
                    sessionId: sessionId
                }
            });
        }

    } catch (error) {
        console.error('❌ Error in send-session-invite:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Send session reminder email
 * POST /api/email/send-reminder
 * Body: { candidateId, sessionId, minutesUntilStart }
 */
router.post('/send-reminder', async (req, res) => {
    try {
        const { candidateId, sessionId, minutesUntilStart = 15 } = req.body;

        if (!candidateId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: 'candidateId and sessionId are required'
            });
        }

        const db = await getDatabase();

        // Find candidate and session
        const candidate = await db.collection('candidates').findOne({
            candidateId: candidateId
        });

        const scheduledSession = await db.collection('scheduled_sessions').findOne({
            sessionId: sessionId,
            candidateId: candidateId
        });

        if (!candidate || !scheduledSession) {
            return res.status(404).json({
                success: false,
                message: 'Candidate or session not found'
            });
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const sessionUrl = `${baseUrl}?candidateId=${candidateId}&sessionId=${sessionId}`;

        const candidateData = {
            name: candidate.name || candidate.full_name || 'Dear Candidate',
            email: candidate.email || candidate.candidateEmail,
            candidateId: candidateId
        };

        const sessionDetails = {
            startTime: scheduledSession.startTime,
            endTime: scheduledSession.endTime,
            duration: scheduledSession.duration || 60
        };

        const emailResult = await emailService.sendSessionReminder(
            candidateData,
            sessionUrl,
            sessionDetails,
            minutesUntilStart
        );

        if (emailResult.success) {
            await db.collection('scheduled_sessions').updateOne(
                { sessionId: sessionId },
                { 
                    $push: { 
                        reminders: {
                            sentAt: new Date(),
                            minutesUntilStart: minutesUntilStart,
                            messageId: emailResult.messageId
                        }
                    }
                }
            );

            res.json({
                success: true,
                message: 'Reminder email sent successfully',
                data: {
                    candidateId: candidateId,
                    sessionId: sessionId,
                    minutesUntilStart: minutesUntilStart,
                    messageId: emailResult.messageId
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send reminder email',
                error: emailResult.error
            });
        }

    } catch (error) {
        console.error('❌ Error in send-reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Send bulk session invites
 * POST /api/email/send-bulk-invites
 * Body: { sessions: [{ candidateId, sessionId }] }
 */
router.post('/send-bulk-invites', async (req, res) => {
    try {
        const { sessions } = req.body;

        if (!Array.isArray(sessions) || sessions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'sessions array is required and must not be empty'
            });
        }

        console.log(`📧 Processing bulk email request for ${sessions.length} sessions`);

        const results = [];
        const errors = [];

        for (const session of sessions) {
            try {
                const { candidateId, sessionId } = session;

                // Simulate individual email send request
                const emailRequest = {
                    body: { candidateId, sessionId },
                    // Mock response object
                    status: (code) => ({ json: (data) => ({ statusCode: code, data }) }),
                    json: (data) => ({ statusCode: 200, data })
                };

                // This would normally call the individual send function
                // For now, we'll add to results with pending status
                results.push({
                    candidateId,
                    sessionId,
                    status: 'pending',
                    message: 'Queued for processing'
                });

            } catch (error) {
                errors.push({
                    candidateId: session.candidateId,
                    sessionId: session.sessionId,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Bulk email processing initiated for ${sessions.length} sessions`,
            data: {
                processed: results.length,
                errors: errors.length,
                results: results,
                errors: errors
            }
        });

    } catch (error) {
        console.error('❌ Error in send-bulk-invites:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Test email routes are working
 * GET /api/email/test
 */
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Email routes are working!');
        res.json({
            success: true,
            message: 'Email routes are accessible',
            timestamp: new Date().toISOString(),
            endpoints: [
                'GET /api/email/test',
                'POST /api/email/send-candidate-session',
                'POST /api/email/send-session-invite',
                'GET /api/email/status/:sessionId'
            ]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email routes test failed',
            error: error.message
        });
    }
});

/**
 * Test email configuration
 * GET /api/email/test-config
 */
router.get('/test-config', async (req, res) => {
    try {
        console.log('🧪 Testing email configuration...');
        
        const testResult = await emailService.testEmailConfiguration();

        res.json({
            success: testResult.success,
            message: testResult.success ? 'Email configuration is working' : 'Email configuration failed',
            data: testResult,
            config: {
                hasResendApiKey: !!process.env.RESEND_API_KEY,
                fromEmail: process.env.FROM_EMAIL || 'Not configured'
            }
        });

    } catch (error) {
        console.error('❌ Error testing email config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test email configuration',
            error: error.message
        });
    }
});

/**
 * Get email status for a session
 * GET /api/email/status/:sessionId
 */
router.get('/status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const db = await getDatabase();
        const scheduledSession = await db.collection('scheduled_sessions').findOne({
            sessionId: sessionId
        });

        if (!scheduledSession) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: {
                sessionId: sessionId,
                emailSent: scheduledSession.emailSent || false,
                emailSentAt: scheduledSession.emailSentAt || null,
                emailMessageId: scheduledSession.emailMessageId || null,
                reminders: scheduledSession.reminders || [],
                sessionUrl: scheduledSession.sessionUrl || null
            }
        });

    } catch (error) {
        console.error('❌ Error getting email status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Debug endpoint for send-candidate-session (GET requests)
 */
router.get('/send-candidate-session', (req, res) => {
    console.log('⚠️ GET request received on send-candidate-session endpoint');
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);
    
    res.status(405).json({
        success: false,
        message: 'Method not allowed. This endpoint requires POST method.',
        expectedMethod: 'POST',
        receivedMethod: 'GET',
        correctEndpoint: 'POST /api/email/send-candidate-session'
    });
});

/**
 * Send candidate session URL to candidate's email with their ID
 * POST /api/email/send-candidate-session
 * Body: { candidateId, recruiterEmail, message }
 */
router.post('/send-candidate-session', async (req, res) => {
    try {
        console.log(`📧 Email endpoint called with body:`, req.body);
        
        const { candidateId, recruiterEmail, message } = req.body;

        if (!candidateId) {
            console.log('❌ Missing candidateId in request');
            return res.status(400).json({
                success: false,
                message: 'candidateId is required'
            });
        }

        console.log(`📧 Processing candidate session email request for candidate: ${candidateId}`);

        // Get database connection
        let db;
        try {
            db = await getDatabase();
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Database connection failed',
                error: dbError.message
            });
        }

        // Find candidate details - try multiple collections since recruiter uses different schema
        let candidate = null;
        
        // Try shortlistedcandidates collection first (recruiter system)
        try {
            const { ObjectId } = await import('mongodb');
            candidate = await db.collection('shortlistedcandidates').findOne({
                _id: new ObjectId(candidateId)
            });
            
            if (candidate) {
                console.log('✅ Found candidate in shortlistedcandidates collection');
                // Map recruiter schema to email schema
                candidate = {
                    candidateId: candidateId,
                    name: candidate.candidateName,
                    email: candidate.candidateEmail,
                    full_name: candidate.candidateName,
                    candidateEmail: candidate.candidateEmail,
                    phoneNumber: candidate.phoneNumber,
                    role: candidate.role,
                    companyName: candidate.companyName
                };
            }
        } catch (error) {
            console.log('⚠️ Error checking shortlistedcandidates:', error.message);
        }
        
        // Fallback to candidates collection (interview system)
        if (!candidate) {
            try {
                candidate = await db.collection('candidates').findOne({
                    candidateId: candidateId
                });
                if (candidate) {
                    console.log('✅ Found candidate in candidates collection');
                }
            } catch (error) {
                console.log('⚠️ Error checking candidates:', error.message);
            }
        }

        if (!candidate) {
            console.log(`❌ Candidate ${candidateId} not found in any collection`);
            return res.status(404).json({
                success: false,
                message: 'Candidate not found in database'
            });
        }

        // Find active scheduled session for this candidate
        const scheduledSession = await db.collection('scheduled_sessions').findOne({
            candidateId: candidateId,
            endTime: { $gte: new Date() } // Only active sessions
        });

        let sessionUrl;
        let sessionDetails = null;

        if (scheduledSession) {
            // Use existing session - prioritize production URL
            const baseUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            sessionUrl = `${baseUrl}?candidateId=${candidateId}&sessionId=${scheduledSession.sessionId}`;
            sessionDetails = {
                startTime: scheduledSession.startTime,
                endTime: scheduledSession.endTime,
                duration: scheduledSession.duration || 60,
                sessionId: scheduledSession.sessionId
            };
        } else {
            // Create direct access URL without session timing restrictions - prioritize production URL
            const baseUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            sessionUrl = `${baseUrl}?candidateId=${candidateId}`;
            sessionDetails = {
                startTime: new Date(),
                endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                duration: 120,
                sessionId: 'direct-access'
            };
        }

        // Prepare candidate data for email
        const candidateData = {
            name: candidate.name || candidate.full_name || 'Dear Candidate',
            email: candidate.email || candidate.candidateEmail,
            candidateId: candidateId
        };

        // Validate candidate has email
        if (!candidateData.email) {
            return res.status(400).json({
                success: false,
                message: 'Candidate email not found'
            });
        }

        console.log(`📤 Sending session URL to candidate: ${candidateData.email}`);
        console.log(`🔗 Session URL: ${sessionUrl}`);

        // Send email using emailService
        const emailResult = await emailService.sendSessionInvite(
            candidateData,
            sessionUrl,
            sessionDetails
        );

        if (emailResult.success) {
            // Save email log to database
            await db.collection('email_logs').insertOne({
                type: 'candidate_session_invite',
                candidateId: candidateId,
                candidateEmail: candidateData.email,
                candidateName: candidateData.name,
                sessionUrl: sessionUrl,
                recruiterEmail: recruiterEmail || 'system',
                customMessage: message || '',
                emailSent: true,
                emailSentAt: new Date(),
                emailMessageId: emailResult.messageId,
                sessionDetails: sessionDetails,
                createdAt: new Date()
            });

            console.log(`✅ Email sent successfully to ${candidateData.email}`);

            res.json({
                success: true,
                message: 'Session URL sent successfully to candidate',
                data: {
                    candidateId: candidateId,
                    candidateName: candidateData.name,
                    candidateEmail: candidateData.email,
                    sessionUrl: sessionUrl,
                    emailMessageId: emailResult.messageId,
                    sessionDetails: sessionDetails
                }
            });
        } else {
            console.error(`❌ Failed to send email to ${candidateData.email}:`, emailResult.error);

            // Save failed attempt to database
            await db.collection('email_logs').insertOne({
                type: 'candidate_session_invite',
                candidateId: candidateId,
                candidateEmail: candidateData.email,
                candidateName: candidateData.name,
                sessionUrl: sessionUrl,
                recruiterEmail: recruiterEmail || 'system',
                customMessage: message || '',
                emailSent: false,
                emailError: emailResult.error,
                attemptedAt: new Date(),
                sessionDetails: sessionDetails,
                createdAt: new Date()
            });

            res.status(500).json({
                success: false,
                message: 'Failed to send session URL to candidate',
                error: emailResult.error,
                data: {
                    candidateId: candidateId,
                    candidateEmail: candidateData.email
                }
            });
        }

    } catch (error) {
        console.error('❌ Error in send-candidate-session:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Get email logs for a candidate
 * GET /api/email/logs/:candidateId
 */
router.get('/logs/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;

        const db = await getDatabase();
        const logs = await db.collection('email_logs').find({
            candidateId: candidateId
        }).sort({ createdAt: -1 }).toArray();

        res.json({
            success: true,
            data: {
                candidateId: candidateId,
                totalEmails: logs.length,
                emails: logs.map(log => ({
                    id: log._id,
                    type: log.type,
                    emailSent: log.emailSent,
                    sentAt: log.emailSentAt || log.attemptedAt,
                    recipientEmail: log.candidateEmail,
                    recruiterEmail: log.recruiterEmail,
                    sessionUrl: log.sessionUrl,
                    customMessage: log.customMessage,
                    error: log.emailError || null
                }))
            }
        });

    } catch (error) {
        console.error('❌ Error getting email logs:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

export default router;