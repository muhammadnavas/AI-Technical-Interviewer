import dotenv from 'dotenv';
import { Resend } from 'resend';

// Load environment variables
dotenv.config();

class EmailService {
    constructor() {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is required but not found in environment variables');
        }
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
        // Prioritize production URL for email links
        this.frontendBaseUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    /**
     * Get the appropriate frontend base URL for email links
     * Always use production URL for better user experience
     */
    getFrontendUrl() {
        return this.frontendBaseUrl;
    }

    /**
     * Send session URL and candidate ID to candidate's email
     * @param {Object} candidateData - Candidate information
     * @param {string} sessionUrl - Interview session URL
     * @param {Object} sessionDetails - Session timing details
     */
    async sendSessionInvite(candidateData, sessionUrl, sessionDetails) {
        try {
            const { name, email, candidateId } = candidateData;
            const { startTime, endTime, duration } = sessionDetails;

            const emailTemplate = this.generateSessionEmailTemplate(
                name, 
                candidateId, 
                sessionUrl, 
                sessionDetails
            );

            const emailData = {
                from: this.fromEmail,
                to: [email],
                subject: `Your Interview Session - Access Details Inside`,
                html: emailTemplate.html,
                text: emailTemplate.text,
                headers: {
                    'X-Entity-Ref-ID': candidateId,
                },
                tags: [
                    { name: 'category', value: 'interview-session' },
                    { name: 'candidate_id', value: candidateId }
                ]
            };

            console.log(`📧 Sending session invite to ${email} for candidate ${candidateId}`);
            const result = await this.resend.emails.send(emailData);

            console.log(`✅ Email sent successfully to ${email}. Message ID: ${result.data?.id}`);
            
            return {
                success: true,
                messageId: result.data?.id,
                recipient: email,
                candidateId: candidateId,
                sessionUrl: sessionUrl
            };

        } catch (error) {
            console.error('❌ Failed to send session email:', error);
            return {
                success: false,
                error: error.message,
                recipient: candidateData.email,
                candidateId: candidateData.candidateId
            };
        }
    }

    /**
     * Generate professional email template for session invite
     */
    generateSessionEmailTemplate(candidateName, candidateId, sessionUrl, sessionDetails) {
        const { startTime, endTime, duration } = sessionDetails;
        
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Interview Session</title>
            <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 0; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 30px; }
                .session-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .access-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .access-button:hover { background: #218838; }
                .candidate-id { background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; text-align: center; margin: 10px 0; }
                .instructions { background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #666; }
                .warning { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Your Interview Session is Ready!</h1>
                    <p>Hi ${candidateName}, your time-bound interview session has been scheduled</p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>${candidateName}</strong>,</p>
                    
                    <p>Your interview session has been successfully scheduled! Please find your access details below:</p>
                    
                    <div class="session-details">
                        <h3>📅 Session Details</h3>
                        <p><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
                        <p><strong>End Time:</strong> ${new Date(endTime).toLocaleString()}</p>
                        <p><strong>Duration:</strong> ${duration} minutes</p>
                        <p><strong>Access Window:</strong> Available only during the specified time</p>
                    </div>
                    
                    <div class="candidate-id">
                        <strong>Your Candidate ID:</strong> ${candidateId}
                    </div>
                    
                    <div class="instructions">
                        <h4>📝 Access Instructions:</h4>
                        <ol>
                            <li>Click the access button below during your scheduled time window</li>
                            <li>Enter your Candidate ID when prompted</li>
                            <li>The session will be available only during the specified time</li>
                            <li>Make sure you have a stable internet connection</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${sessionUrl}" class="access-button">🚀 Access Your Interview Session</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong> This session is time-bound and will only be accessible during your scheduled window. Please join on time.
                    </div>
                    
                    <div class="session-details">
                        <h4>🔗 Direct Access Link:</h4>
                        <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
                            <a href="${sessionUrl}" style="color: #667eea;">${sessionUrl}</a>
                        </p>
                    </div>
                    
                    <p>If you have any technical issues or need to reschedule, please contact us immediately.</p>
                    
                    <p>Best of luck with your interview!</p>
                </div>
                
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>Interview Session ID: ${candidateId} | Generated on ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const text = `
Your Interview Session - Access Details

Hi ${candidateName},

Your interview session has been successfully scheduled!

Session Details:
- Start Time: ${new Date(startTime).toLocaleString()}
- End Time: ${new Date(endTime).toLocaleString()}
- Duration: ${duration} minutes

Your Candidate ID: ${candidateId}

Access Instructions:
1. Visit: ${sessionUrl}
2. Enter your Candidate ID: ${candidateId}
3. Join during your scheduled time window only

IMPORTANT: This session is time-bound and will only be accessible during your scheduled window.

Direct Access Link: ${sessionUrl}

Best of luck with your interview!

---
This is an automated message. Please do not reply to this email.
Interview Session ID: ${candidateId} | Generated on ${new Date().toLocaleString()}
        `;

        return { html, text };
    }

    /**
     * Send reminder email before session starts
     */
    async sendSessionReminder(candidateData, sessionUrl, sessionDetails, minutesUntilStart) {
        try {
            const { name, email, candidateId } = candidateData;

            const reminderTemplate = this.generateReminderEmailTemplate(
                name, 
                candidateId, 
                sessionUrl, 
                sessionDetails,
                minutesUntilStart
            );

            const emailData = {
                from: this.fromEmail,
                to: [email],
                subject: `⏰ Reminder: Your Interview Session Starts in ${minutesUntilStart} Minutes`,
                html: reminderTemplate.html,
                text: reminderTemplate.text,
                tags: [
                    { name: 'category', value: 'session-reminder' },
                    { name: 'candidate_id', value: candidateId }
                ]
            };

            const result = await this.resend.emails.send(emailData);
            
            return {
                success: true,
                messageId: result.data?.id,
                recipient: email,
                candidateId: candidateId
            };

        } catch (error) {
            console.error('❌ Failed to send reminder email:', error);
            return {
                success: false,
                error: error.message,
                recipient: candidateData.email,
                candidateId: candidateData.candidateId
            };
        }
    }

    generateReminderEmailTemplate(candidateName, candidateId, sessionUrl, sessionDetails, minutesUntilStart) {
        const { startTime } = sessionDetails;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 500px; margin: 0 auto; padding: 20px; background: white; border-radius: 8px; }
                .urgent { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; }
                .access-button { display: inline-block; background: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="urgent">
                    <h2>⏰ Your Interview Session Starts Soon!</h2>
                    <p>Hi <strong>${candidateName}</strong>,</p>
                    <p>This is a friendly reminder that your interview session will start in <strong>${minutesUntilStart} minutes</strong>.</p>
                    
                    <p><strong>Session Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
                    <p><strong>Your Candidate ID:</strong> ${candidateId}</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${sessionUrl}" class="access-button">Join Now</a>
                    </div>
                    
                    <p>Please ensure you have a stable internet connection and join on time.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const text = `
⏰ Your Interview Session Starts Soon!

Hi ${candidateName},

This is a friendly reminder that your interview session will start in ${minutesUntilStart} minutes.

Session Start Time: ${new Date(startTime).toLocaleString()}
Your Candidate ID: ${candidateId}

Access Link: ${sessionUrl}

Please ensure you have a stable internet connection and join on time.
        `;

        return { html, text };
    }

    /**
     * Test email configuration
     */
    async testEmailConfiguration() {
        try {
            const testEmail = {
                from: this.fromEmail,
                to: ['test@example.com'],
                subject: 'Test Email Configuration',
                html: '<p>This is a test email to verify Resend configuration.</p>',
                text: 'This is a test email to verify Resend configuration.'
            };

            console.log('🧪 Testing email configuration...');
            // Note: This will fail with test@example.com but will validate API key
            const result = await this.resend.emails.send(testEmail);
            
            return {
                success: true,
                message: 'Email configuration is working',
                result: result.data
            };

        } catch (error) {
            console.error('❌ Email configuration test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new EmailService();