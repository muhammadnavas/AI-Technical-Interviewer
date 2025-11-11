import axios from 'axios';
import express from 'express';

const router = express.Router();

// Helper to parse MongoDB date strings
const parseMongoDate = (dateString) => {
  if (dateString && dateString.$date) {
    return new Date(dateString.$date);
  }
  return new Date(dateString);
};

// Helper to parse scheduled slot (e.g., "Monday at 10 AM")
const parseScheduledSlot = (slot) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMatch = slot.toLowerCase().match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  const timeMatch = slot.toLowerCase().match(/(\d+)\s*(am|pm)/);
  
  if (!dayMatch || !timeMatch) {
    throw new Error('Invalid scheduled slot format. Expected format: "Monday at 10 AM"');
  }
  
  const dayName = dayMatch[1];
  const hour = parseInt(timeMatch[1]);
  const meridiem = timeMatch[2];
  
  // Calculate next occurrence of the specified day
  const now = new Date();
  const targetDay = days.indexOf(dayName);
  const currentDay = now.getDay();
  
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }
  
  const targetDate = new Date(now.getTime() + (daysUntilTarget * 24 * 60 * 60 * 1000));
  
  // Set the time
  let targetHour = hour;
  if (meridiem === 'pm' && hour !== 12) {
    targetHour += 12;
  } else if (meridiem === 'am' && hour === 12) {
    targetHour = 0;
  }
  
  targetDate.setHours(targetHour, 0, 0, 0);
  
  return targetDate;
};

// Create session from shortlisted candidate
router.post('/create-from-shortlisted', async (req, res) => {
  try {
    const shortlistedCandidate = req.body;
    
    // Validate required fields
    if (!shortlistedCandidate.candidateId || !shortlistedCandidate.applicationId || 
        !shortlistedCandidate.jobId || !shortlistedCandidate.recruiterId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateId, applicationId, jobId, recruiterId'
      });
    }

    // Extract scheduling information
    let scheduledStartTime;
    let duration = 60; // Default 1 hour

    // Check for interview details in call_tracking
    if (shortlistedCandidate.call_tracking?.interview_details?.scheduled_slot) {
      try {
        scheduledStartTime = parseScheduledSlot(shortlistedCandidate.call_tracking.interview_details.scheduled_slot);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid scheduled slot format: ' + error.message
        });
      }
    } else if (shortlistedCandidate.scheduledInterviewDate) {
      scheduledStartTime = parseMongoDate(shortlistedCandidate.scheduledInterviewDate);
    } else {
      return res.status(400).json({
        success: false,
        error: 'No scheduling information found. Provide call_tracking.interview_details.scheduled_slot or scheduledInterviewDate'
      });
    }

    const scheduledEndTime = new Date(scheduledStartTime.getTime() + (duration * 60000));

    // Prepare session creation payload
    const sessionData = {
      candidateId: shortlistedCandidate.candidateId,
      applicationId: shortlistedCandidate.applicationId,
      jobId: shortlistedCandidate.jobId,
      recruiterId: shortlistedCandidate.recruiterId,
      candidateDetails: {
        candidateName: shortlistedCandidate.candidateName,
        candidateEmail: shortlistedCandidate.candidateEmail,
        phoneNumber: shortlistedCandidate.phoneNumber,
        companyName: shortlistedCandidate.companyName,
        role: shortlistedCandidate.role,
        techStack: shortlistedCandidate.techStack || [],
        experience: shortlistedCandidate.experience
      },
      scheduledDate: scheduledStartTime.toISOString().split('T')[0], // YYYY-MM-DD
      scheduledTime: scheduledStartTime.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
      duration: duration,
      timeZone: 'UTC'
    };

    // Call the main session creation endpoint
    const sessionResponse = await axios.post('http://localhost:3000/api/sessions/create', sessionData);
    
    if (sessionResponse.data.success) {
      res.json({
        success: true,
        message: 'Interview session created from shortlisted candidate',
        sessionData: sessionResponse.data,
        candidateInfo: {
          name: shortlistedCandidate.candidateName,
          email: shortlistedCandidate.candidateEmail,
          role: shortlistedCandidate.role,
          company: shortlistedCandidate.companyName
        },
        emailTemplate: {
          to: shortlistedCandidate.candidateEmail,
          subject: `AI Technical Interview Scheduled - ${shortlistedCandidate.role} Position`,
          html: generateInterviewInviteEmail(shortlistedCandidate, sessionResponse.data, scheduledStartTime)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to create session: ' + sessionResponse.data.error
      });
    }

  } catch (error) {
    console.error('Error creating session from shortlisted candidate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session: ' + (error.response?.data?.error || error.message)
    });
  }
});

// Generate email template for interview invite
function generateInterviewInviteEmail(candidate, sessionData, scheduledStartTime) {
  const accessStart = new Date(scheduledStartTime.getTime() - 15 * 60000);
  const accessEnd = new Date(scheduledStartTime.getTime() + 75 * 60000); // 1hr 15min after start
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .session-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .access-button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>AI Technical Interview Scheduled</h1>
      </div>
      
      <div class="content">
        <p>Dear ${candidate.candidateName},</p>
        
        <p>Your AI technical interview for the <strong>${candidate.role}</strong> position at <strong>${candidate.companyName}</strong> has been scheduled.</p>
        
        <div class="session-details">
          <h3>Interview Details</h3>
          <p><strong>Date & Time:</strong> ${scheduledStartTime.toLocaleString()}</p>
          <p><strong>Duration:</strong> ${sessionData.sessionDetails.duration} minutes</p>
          <p><strong>Position:</strong> ${candidate.role}</p>
          <p><strong>Company:</strong> ${candidate.companyName}</p>
          <p><strong>Tech Stack:</strong> ${candidate.techStack?.join(', ') || 'Not specified'}</p>
        </div>
        
        <h3>Access Information</h3>
        <p><strong>Access Window:</strong> ${accessStart.toLocaleString()} to ${accessEnd.toLocaleString()}</p>
        <p>You can join the interview 15 minutes before the scheduled time and have 15 minutes after the scheduled end time to complete it.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${sessionData.accessUrl}" class="access-button">Join Interview</a>
        </div>
        
        <h3>What to Expect</h3>
        <ul>
          <li>Voice-based AI interview with technical questions</li>
          <li>Coding exercises relevant to your skills</li>
          <li>Questions about your experience and projects</li>
          <li>System design and problem-solving scenarios</li>
        </ul>
        
        <h3>Technical Requirements</h3>
        <ul>
          <li>Stable internet connection</li>
          <li>Modern web browser (Chrome, Firefox, Safari)</li>
          <li>Microphone for voice responses</li>
          <li>Quiet environment</li>
        </ul>
        
        <div class="session-details">
          <p><strong>Session ID:</strong> ${sessionData.sessionId}</p>
          <p><strong>Access Token:</strong> ${sessionData.accessToken}</p>
          <p><em>Keep this information secure. Do not share with others.</em></p>
        </div>
        
        <p>If you have any technical issues or questions, please contact us before your interview time.</p>
        
        <p>Best of luck!</p>
        <p>The ${candidate.companyName} Recruitment Team</p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}

// Batch create sessions for multiple candidates
router.post('/batch-create', async (req, res) => {
  try {
    const { candidates } = req.body;
    
    if (!Array.isArray(candidates)) {
      return res.status(400).json({
        success: false,
        error: 'candidates must be an array'
      });
    }

    const results = [];
    const errors = [];

    for (const candidate of candidates) {
      try {
        const sessionResponse = await axios.post('http://localhost:3000/api/sessions/integrations/create-from-shortlisted', candidate);
        results.push({
          candidateId: candidate.candidateId,
          candidateName: candidate.candidateName,
          success: true,
          sessionData: sessionResponse.data
        });
      } catch (error) {
        errors.push({
          candidateId: candidate.candidateId,
          candidateName: candidate.candidateName,
          success: false,
          error: error.response?.data?.error || error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${candidates.length} candidates`,
      results: {
        successful: results,
        failed: errors
      },
      summary: {
        total: candidates.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error in batch session creation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch session creation'
    });
  }
});

export default router;