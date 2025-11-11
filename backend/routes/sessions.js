import crypto from 'crypto';
import express from 'express';
import { ObjectId } from 'mongodb';
import InterviewSession from '../models/InterviewSession.js';

const router = express.Router();

// Initialize OpenAI (will be available from the main server context)
let openai;
let candidatesCollection;
let codeQuestionsCollection;

// Initialize collections and OpenAI from main server
export function initializeSessionRoutes(collections, openaiInstance) {
  candidatesCollection = collections.candidatesCollection;
  codeQuestionsCollection = collections.codeQuestionsCollection;
  openai = openaiInstance;
}

// Helper function to generate secure access token
const generateAccessToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to load candidate profile from database
async function loadCandidateProfile(candidateId) {
  if (!candidatesCollection) {
    console.warn('candidatesCollection not available for profile loading');
    return null;
  }

  try {
    const doc = await candidatesCollection.findOne({ candidateId: candidateId.toString() });
    if (doc) {
      const { _id, ...rest } = doc;
      return rest;
    }
  } catch (err) {
    console.error('Error loading candidate profile:', err);
  }
  return null;
}

// Helper function to generate interview questions for a candidate
async function generateQuestionsForCandidate(profile) {
  if (!openai) return getDefaultQuestions();

  try {
    const prompt = `You are an expert technical interviewer. Based on the following candidate profile, generate an array (JSON) of 6-10 relevant interview questions that focus on the candidate's skills, projects, and likely junior-to-mid level expectations. Return ONLY a JSON array of strings.

Candidate Profile:
Name: ${profile.candidateName}
Position: ${profile.position || 'Full Stack Developer'}
Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
Projects: ${profile.projectDetails || profile.githubProjects || 'N/A'}
Experience: ${profile.experience || 'N/A'}

Requirements:
- Produce 6 to 10 clear, distinct interview questions
- Include at least 1 coding or implementation task-style question
- Include at least 1 question about system design or architecture appropriate to the role
- Keep questions concise and practical`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert technical interviewer and question writer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    let content = completion.choices[0].message.content.trim();
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const questions = JSON.parse(content);
      if (Array.isArray(questions)) return questions;
    } catch (err) {
      console.warn('Failed to parse AI-generated questions, using fallback');
    }

    return getDefaultQuestions();
  } catch (error) {
    console.error('Error generating questions:', error);
    return getDefaultQuestions();
  }
}

// Helper function to generate coding tasks for a candidate
async function generateCodingTasksForCandidate(profile) {
  if (!openai) return getDefaultCodingTasks();

  try {
    const prompt = `You are an expert coding-question writer. Given the following candidate profile, produce a JSON array of 1-3 coding tasks suitable for a live coding editor. Each task should be an object with the fields: id (short string), title, description, languageHints (array), exampleInputOutput (optional), and a small set of unit tests described as strings. Return ONLY valid JSON.

Candidate Profile:
Name: ${profile.candidateName}
Position: ${profile.position || 'Full Stack Developer'}
Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
Projects: ${profile.projectDetails || profile.githubProjects || 'N/A'}
Experience: ${profile.experience || 'N/A'}

Requirements:
- Create 1 to 3 practical coding tasks, each with clear instructions and input/output examples when appropriate.
- Include at least one task that can be evaluated with small unit tests.
- Keep tasks concise and focused for a 20-45 minute coding exercise.
- Return only JSON (array of objects).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a senior engineer who writes clear, testable coding tasks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 1200
    });

    let content = completion.choices[0].message.content.trim();
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const tasks = JSON.parse(content);
      if (Array.isArray(tasks) && tasks.length > 0) return tasks;
    } catch (err) {
      console.warn('Failed to parse AI-generated coding tasks, using fallback');
    }

    return getDefaultCodingTasks();
  } catch (error) {
    console.error('Error generating coding tasks:', error);
    return getDefaultCodingTasks();
  }
}

// Helper function to load existing coding questions from database
async function loadCodingQuestions(candidateId) {
  if (!codeQuestionsCollection) return null;

  try {
    const doc = await codeQuestionsCollection.findOne({ candidateId: candidateId.toString() });
    if (doc && doc.tasks) {
      return doc.tasks;
    }
  } catch (err) {
    console.error('Error loading coding questions:', err);
  }
  return null;
}

// Convert codingAssessment from profile to tasks format
function convertCodingAssessmentToTasks(profile) {
  try {
    if (!profile || !profile.codingAssessment || !Array.isArray(profile.codingAssessment.questions)) return null;
    
    const qa = profile.codingAssessment.questions;
    const tasks = qa.map(q => {
      const sample = Array.isArray(q.sampleTests) && q.sampleTests.length > 0 ? q.sampleTests[0] : null;
      const exampleInputOutput = sample ? { input: sample.input, output: sample.expected } : null;
      const tests = [];
      
      if (Array.isArray(q.sampleTests)) {
        q.sampleTests.forEach((t, i) => tests.push(`${q.id || i}-sample: input=${JSON.stringify(t.input)} expected=${JSON.stringify(t.expected)}`));
      }
      if (Array.isArray(q.hiddenTests)) {
        q.hiddenTests.forEach((t, i) => tests.push(`${q.id || 'hidden'}-hidden: input=${JSON.stringify(t.input)} expected=${JSON.stringify(t.expected)}`));
      }

      return {
        id: q.id || (q.title || '').toLowerCase().replace(/\s+/g, '_'),
        title: q.title || q.id || 'Coding Task',
        description: (q.prompt ? q.prompt + '\n\n' : '') + (q.signature || ''),
        languageHints: q.language ? [q.language] : (q.languageHints || []),
        exampleInputOutput,
        tests
      };
    });
    return tasks;
  } catch (err) {
    console.warn('Failed to convert codingAssessment to tasks:', err.message);
    return null;
  }
}

// Fallback questions and tasks
function getDefaultQuestions() {
  return [
    'Tell me about a project you built that you are most proud of and what you learned from it.',
    'Explain your typical approach to debugging a production issue.',
    'Write a function to reverse a string and explain its time complexity.',
    'How would you design a simple REST API for a todo app? Describe endpoints and data models.',
    'What are the differences between SQL and NoSQL databases and when to use each?',
    'Explain the event loop in JavaScript and how asynchronous code executes.'
  ];
}

function getDefaultCodingTasks() {
  return [
    {
      id: 'sum-array',
      title: 'Sum of Array',
      description: 'Write a function `sumArray(arr)` that returns the sum of numeric elements in the array.',
      languageHints: ['javascript', 'python'],
      exampleInputOutput: { input: '[1,2,3]', output: '6' },
      tests: ['sumArray([1,2,3]) === 6', 'sumArray([-1,1]) === 0']
    }
  ];
}

// Comprehensive interview data preparation
async function prepareInterviewData(candidateId, sessionData) {
  console.log(`📋 Preparing interview data for candidate: ${candidateId}`);
  
  const interviewData = {
    candidateProfile: null,
    interviewQuestions: [],
    codingTasks: [],
    systemPrompt: '',
    metadata: {
      preparationTime: new Date().toISOString(),
      dataSource: 'fallback'
    }
  };

  try {
    // 1. Load candidate profile from database
    const profile = await loadCandidateProfile(candidateId);
    
    if (profile) {
      interviewData.candidateProfile = profile;
      interviewData.metadata.dataSource = 'database';
      console.log(`✅ Loaded candidate profile for: ${profile.candidateName}`);

      // 2. Generate or load interview questions
      if (Array.isArray(profile.customQuestions) && profile.customQuestions.length > 0) {
        interviewData.interviewQuestions = profile.customQuestions;
        console.log(`✅ Using custom questions (${profile.customQuestions.length})`);
      } else {
        interviewData.interviewQuestions = await generateQuestionsForCandidate(profile);
        console.log(`✅ Generated AI questions (${interviewData.interviewQuestions.length})`);
      }

      // 3. Load or generate coding tasks
      let codingTasks = await loadCodingQuestions(candidateId);
      
      if (!codingTasks) {
        // Try to convert existing codingAssessment
        codingTasks = convertCodingAssessmentToTasks(profile);
      }
      
      if (!codingTasks) {
        // Generate new coding tasks
        codingTasks = await generateCodingTasksForCandidate(profile);
        
        // Save generated tasks to database
        if (codeQuestionsCollection && codingTasks) {
          try {
            await codeQuestionsCollection.updateOne(
              { candidateId: candidateId.toString() },
              { $set: { candidateId: candidateId.toString(), tasks: codingTasks, updatedAt: new Date().toISOString() } },
              { upsert: true }
            );
            console.log(`✅ Saved generated coding tasks to database`);
          } catch (err) {
            console.warn('Failed to save coding tasks:', err);
          }
        }
      }
      
      interviewData.codingTasks = codingTasks || getDefaultCodingTasks();
      console.log(`✅ Prepared coding tasks (${interviewData.codingTasks.length})`);

      // 4. Generate system prompt for the AI interviewer
      interviewData.systemPrompt = generateSystemPrompt(profile, sessionData, interviewData.interviewQuestions);
      
    } else {
      // Fallback to session data if no profile found
      console.log(`⚠️ No profile found, using session data for: ${sessionData.candidateDetails.candidateName}`);
      
      const fallbackProfile = {
        candidateName: sessionData.candidateDetails.candidateName,
        position: sessionData.candidateDetails.role,
        skills: sessionData.candidateDetails.techStack || [],
        experience: sessionData.candidateDetails.experience
      };
      
      interviewData.candidateProfile = fallbackProfile;
      interviewData.interviewQuestions = await generateQuestionsForCandidate(fallbackProfile);
      interviewData.codingTasks = await generateCodingTasksForCandidate(fallbackProfile);
      interviewData.systemPrompt = generateSystemPrompt(fallbackProfile, sessionData, interviewData.interviewQuestions);
    }

  } catch (error) {
    console.error('Error preparing interview data:', error);
    
    // Ultimate fallback
    interviewData.candidateProfile = sessionData.candidateDetails;
    interviewData.interviewQuestions = getDefaultQuestions();
    interviewData.codingTasks = getDefaultCodingTasks();
    interviewData.systemPrompt = generateSystemPrompt(sessionData.candidateDetails, sessionData, interviewData.interviewQuestions);
    interviewData.metadata.dataSource = 'fallback_error';
  }

  console.log(`🎯 Interview data prepared: ${interviewData.interviewQuestions.length} questions, ${interviewData.codingTasks.length} coding tasks`);
  return interviewData;
}

// Generate system prompt for the AI interviewer
function generateSystemPrompt(profile, sessionData, questions) {
  const candidateName = profile.candidateName || sessionData.candidateDetails.candidateName;
  const position = profile.position || sessionData.candidateDetails.role;
  const skills = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || sessionData.candidateDetails.techStack?.join(', ') || '');
  const projectDetails = profile.projectDetails || profile.githubProjects || '';

  return `You are an expert technical interviewer conducting an interview for a ${position} position.

Candidate Information:
- Name: ${candidateName}
- Skills: ${skills}
${projectDetails ? `- Project Experience: ${projectDetails}` : ''}

Your responsibilities:
1. Ask relevant technical questions based on the candidate's skills and experience
2. Follow up on their answers with deeper technical questions
3. Assess their problem-solving approach
4. Be professional, encouraging, and constructive
5. Keep questions clear and concise
6. Adapt difficulty based on their responses

${questions && questions.length > 0 ? `
Priority Questions to Cover:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
` : ''}

Interview Guidelines:
- Start with an introduction and ask about their background
- Progress from general to specific technical questions
- Ask about real-world scenarios and problem-solving
- Evaluate code quality, best practices, and system design thinking
- Be conversational but professional

Important Interview Flow for Coding Exercises:
- If at any point you ask the candidate to complete a coding exercise, the system will open a coding editor for the candidate. When the candidate starts the coding exercise, you MUST pause asking further questions and wait for the coding submission. Do NOT speculate or continue with follow-ups while the candidate is actively working on the test.
- Once the candidate submits their solution, the system will notify you and include a short summary of the submission. At that point, resume the interview: evaluate the submission, ask follow-ups about approach and trade-offs, and continue the normal interview flow.
- Keep your responses concise and focus on evaluating the candidate's reasoning, code correctness, and design choices after the submission.

Remember: You're speaking to them via voice, so keep responses natural and concise.`;
}

// Helper function to parse date/time strings
const parseDateTime = (dateStr, timeStr) => {
  // Handle different date formats
  const date = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
};

// Create interview session for a candidate
router.post('/create', async (req, res) => {
  try {
    const {
      candidateId,
      applicationId,
      jobId,
      recruiterId,
      candidateDetails,
      scheduledDate,
      scheduledTime,
      duration = 60, // default 60 minutes
      timeZone = 'UTC',
      accessWindow = { beforeStart: 15, afterEnd: 15 }
    } = req.body;

    // Validate required fields
    if (!candidateId || !applicationId || !jobId || !recruiterId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateId, applicationId, jobId, recruiterId'
      });
    }

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        error: 'scheduledDate and scheduledTime are required'
      });
    }

    // Check if session already exists for this candidate and job
    const existingSession = await InterviewSession.findOne({
      candidateId: new ObjectId(candidateId),
      jobId: new ObjectId(jobId),
      sessionStatus: { $in: ['scheduled', 'active'] }
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        error: 'Active session already exists for this candidate and job',
        existingSessionId: existingSession.sessionId
      });
    }

    // Parse scheduled date and time
    const scheduledStartTime = parseDateTime(scheduledDate, scheduledTime);
    const scheduledEndTime = new Date(scheduledStartTime.getTime() + (duration * 60000));

    // Generate unique session ID and access token
    const sessionId = `interview_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const accessToken = generateAccessToken();

    // Create session
    const session = new InterviewSession({
      sessionId,
      candidateId: new ObjectId(candidateId),
      applicationId: new ObjectId(applicationId),
      jobId: new ObjectId(jobId),
      recruiterId: new ObjectId(recruiterId),
      candidateDetails: {
        candidateName: candidateDetails.candidateName || candidateDetails.name,
        candidateEmail: candidateDetails.candidateEmail || candidateDetails.email,
        phoneNumber: candidateDetails.phoneNumber || candidateDetails.phone,
        companyName: candidateDetails.companyName,
        role: candidateDetails.role,
        techStack: candidateDetails.techStack || [],
        experience: candidateDetails.experience
      },
      sessionConfig: {
        scheduledStartTime,
        scheduledEndTime,
        timeZone,
        duration,
        accessWindow
      },
      security: {
        accessToken,
        maxLoginAttempts: 3,
        loginAttempts: 0
      },
      sessionStatus: 'scheduled'
    });

    await session.save();

    res.json({
      success: true,
      message: 'Interview session created successfully',
      sessionId: session.sessionId,
      accessToken: session.security.accessToken,
      sessionDetails: {
        scheduledStartTime: session.sessionConfig.scheduledStartTime,
        scheduledEndTime: session.sessionConfig.scheduledEndTime,
        duration: session.sessionConfig.duration,
        accessWindow: session.sessionConfig.accessWindow
      },
      accessUrl: `/interview/session/${session.sessionId}?token=${session.security.accessToken}`
    });

  } catch (error) {
    console.error('Error creating interview session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create interview session'
    });
  }
});

// Create session from shortlisted candidate data
router.post('/create-from-shortlisted', async (req, res) => {
  try {
    const {
      shortlistedCandidateId,
      scheduledDate,
      scheduledTime,
      duration = 60,
      timeZone = 'UTC'
    } = req.body;

    if (!shortlistedCandidateId) {
      return res.status(400).json({
        success: false,
        error: 'shortlistedCandidateId is required'
      });
    }

    // In a real scenario, you would fetch from the ShortlistedCandidate collection
    // For now, I'll create based on the provided data structure
    const candidateData = {
      candidateId: shortlistedCandidateId,
      applicationId: req.body.applicationId,
      jobId: req.body.jobId,
      recruiterId: req.body.recruiterId,
      candidateDetails: {
        candidateName: req.body.candidateName,
        candidateEmail: req.body.candidateEmail,
        phoneNumber: req.body.phoneNumber,
        companyName: req.body.companyName,
        role: req.body.role,
        techStack: req.body.techStack || [],
        experience: req.body.experience
      }
    };

    // Use the create endpoint logic
    req.body = {
      ...candidateData,
      scheduledDate,
      scheduledTime,
      duration,
      timeZone
    };

    // Forward to create endpoint
    return router.handle({ ...req, url: '/create', method: 'POST' }, res);

  } catch (error) {
    console.error('Error creating session from shortlisted candidate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session from shortlisted candidate'
    });
  }
});

// Validate and access session
router.post('/access', async (req, res) => {
  try {
    const { sessionId, accessToken } = req.body;

    if (!sessionId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and accessToken are required'
      });
    }

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check access token
    if (session.security.accessToken !== accessToken) {
      // Increment login attempts
      session.security.loginAttempts += 1;
      session.security.lastLoginAttempt = new Date();
      await session.save();

      if (session.security.loginAttempts >= session.security.maxLoginAttempts) {
        return res.status(423).json({
          success: false,
          error: 'Session locked due to too many failed attempts'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid access token',
        attemptsRemaining: session.security.maxLoginAttempts - session.security.loginAttempts
      });
    }

    // Reset login attempts on successful access
    session.security.loginAttempts = 0;

    // Check if session is accessible based on time
    const now = new Date();
    const startTime = new Date(session.sessionConfig.scheduledStartTime);
    const endTime = new Date(session.sessionConfig.scheduledEndTime);
    const accessStart = new Date(startTime.getTime() - (session.sessionConfig.accessWindow.beforeStart * 60000));
    const accessEnd = new Date(endTime.getTime() + (session.sessionConfig.accessWindow.afterEnd * 60000));

    if (now < accessStart) {
      return res.status(403).json({
        success: false,
        error: 'Interview session not yet accessible',
        accessibleFrom: accessStart,
        timeUntilAccess: Math.ceil((accessStart - now) / (1000 * 60)) // minutes
      });
    }

    if (now > accessEnd && session.sessionStatus !== 'active') {
      session.sessionStatus = 'expired';
      await session.save();
      return res.status(403).json({
        success: false,
        error: 'Interview session has expired'
      });
    }

    // Activate session if it's the first access during the window
    if (session.sessionStatus === 'scheduled') {
      await session.activateSession();
    }

    // Prepare comprehensive interview data
    console.log(`🎯 Preparing interview data for session: ${session.sessionId}`);
    const interviewData = await prepareInterviewData(session.candidateId, session);

    // Store interview data in session for future reference
    session.interviewData = {
      ...session.interviewData,
      candidateProfile: interviewData.candidateProfile,
      interviewQuestions: interviewData.interviewQuestions,
      codingTasks: interviewData.codingTasks,
      systemPrompt: interviewData.systemPrompt,
      metadata: {
        ...session.interviewData.metadata,
        ...interviewData.metadata,
        dataLoadedAt: new Date().toISOString()
      }
    };

    await session.save();

    res.json({
      success: true,
      message: 'Session access granted',
      session: {
        sessionId: session.sessionId,
        candidateName: session.candidateDetails.candidateName,
        role: session.candidateDetails.role,
        companyName: session.candidateDetails.companyName,
        scheduledStartTime: session.sessionConfig.scheduledStartTime,
        scheduledEndTime: session.sessionConfig.scheduledEndTime,
        duration: session.sessionConfig.duration,
        status: session.sessionStatus,
        timeRemaining: Math.max(0, Math.ceil((accessEnd - now) / (1000 * 60))) // minutes
      },
      interviewData: {
        candidateProfile: interviewData.candidateProfile,
        interviewQuestions: interviewData.interviewQuestions,
        codingTasks: interviewData.codingTasks,
        systemPrompt: interviewData.systemPrompt,
        metadata: interviewData.metadata
      }
    });

  } catch (error) {
    console.error('Error accessing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to access session'
    });
  }
});

// Access session by candidate ID (user-friendly access)
router.post('/access-by-candidate', async (req, res) => {
  try {
    const { candidateId } = req.body;
    console.log(`🔍 Access by candidate ID request: ${candidateId}`);

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId is required'
      });
    }

    // First check for scheduled sessions (new system)
    try {
      const { getScheduledSessionByCandidate, validateSessionTiming, incrementAccessAttempts, startSession } = await import('../utils/sessionScheduler.js');
      
      const scheduledSession = await getScheduledSessionByCandidate(candidateId);
      
      if (scheduledSession) {
        console.log(`🕐 Found scheduled session for candidate: ${candidateId}`);
        
        // Validate timing and access
        const validation = validateSessionTiming(scheduledSession);
        
        if (!validation.isValid) {
          await incrementAccessAttempts(scheduledSession.sessionId);
          
          return res.status(403).json({
            success: false,
            error: validation.reason,
            sessionType: 'scheduled',
            sessionInfo: {
              candidateName: scheduledSession.candidateName,
              position: scheduledSession.position,
              startTime: scheduledSession.startTime,
              endTime: scheduledSession.endTime,
              status: scheduledSession.status,
              timeToStart: validation.timeToStart,
              timeToEnd: validation.timeToEnd
            }
          });
        }

        // Session is valid - start it if not already active
        if (scheduledSession.status === 'scheduled') {
          await startSession(scheduledSession.sessionId);
          scheduledSession.status = 'active';
        }

        await incrementAccessAttempts(scheduledSession.sessionId);

        // Return scheduled session data
        return res.json({
          success: true,
          message: 'Scheduled session access granted',
          sessionType: 'scheduled',
          session: {
            sessionId: scheduledSession.sessionId,
            candidateId: scheduledSession.candidateId,
            candidateName: scheduledSession.candidateName,
            position: scheduledSession.position,
            skills: scheduledSession.interviewConfig?.skills || [],
            timeRemaining: validation.timeToEnd,
            isScheduled: true,
            startTime: scheduledSession.startTime,
            endTime: scheduledSession.endTime,
            duration: scheduledSession.duration
          },
          initialMessage: `Hello ${scheduledSession.candidateName}! Welcome to your scheduled technical interview for the ${scheduledSession.position} position. You have ${validation.timeToEnd} minutes remaining. Let's begin!`
        });
      }
    } catch (error) {
      console.log('📝 No scheduled session found, checking legacy sessions...');
    }

    // Fall back to legacy session system
    console.log(`🔍 Searching for legacy session with candidateId: ${candidateId}`);
    const session = await InterviewSession.findOne({
      candidateId: new ObjectId(candidateId),
      sessionStatus: { $in: ['scheduled', 'active'] }
    }).sort({ 'sessionConfig.scheduledStartTime': -1 }); // Get the most recent session
    
    console.log(`🔍 Legacy session found:`, !!session);
    if (session) {
      console.log(`🔍 Session details: ${session.sessionId}, status: ${session.sessionStatus}`);
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No active interview session found for this candidate',
        message: 'Please contact your recruiter to schedule an interview session.'
      });
    }

    // Check if session is accessible based on time
    const now = new Date();
    const startTime = new Date(session.sessionConfig.scheduledStartTime);
    const endTime = new Date(session.sessionConfig.scheduledEndTime);
    const accessStart = new Date(startTime.getTime() - (session.sessionConfig.accessWindow.beforeStart * 60000));
    const accessEnd = new Date(endTime.getTime() + (session.sessionConfig.accessWindow.afterEnd * 60000));

    if (now < accessStart) {
      return res.status(403).json({
        success: false,
        error: 'Interview session not yet accessible',
        message: `Your interview is scheduled for ${startTime.toLocaleString()}. You can access it starting ${accessStart.toLocaleString()}.`,
        sessionInfo: {
          candidateName: session.candidateDetails.candidateName,
          role: session.candidateDetails.role,
          companyName: session.candidateDetails.companyName,
          scheduledStartTime: session.sessionConfig.scheduledStartTime,
          accessibleFrom: accessStart,
          timeUntilAccess: Math.ceil((accessStart - now) / (1000 * 60)) // minutes
        }
      });
    }

    if (now > accessEnd && session.sessionStatus !== 'active') {
      session.sessionStatus = 'expired';
      await session.save();
      return res.status(403).json({
        success: false,
        error: 'Interview session has expired',
        message: 'The access window for your interview has closed. Please contact your recruiter to reschedule.'
      });
    }

    // Activate session if it's the first access during the window
    if (session.sessionStatus === 'scheduled') {
      await session.activateSession();
    }

    // Prepare comprehensive interview data
    console.log(`🎯 Preparing interview data for candidate: ${candidateId}`);
    const interviewData = await prepareInterviewData(session.candidateId, session);

    // Store interview data in session for future reference
    // Initialize interviewData if it doesn't exist or has undefined fields
    if (!session.interviewData) {
      session.interviewData = {};
    }
    if (!session.interviewData.metadata) {
      session.interviewData.metadata = {};
    }
    if (!session.interviewData.conversationHistory) {
      session.interviewData.conversationHistory = [];
    }

    // Update the interview data without overriding schema-required fields
    session.interviewData.candidateProfile = interviewData.candidateProfile;
    session.interviewData.interviewQuestions = interviewData.interviewQuestions;
    session.interviewData.codingTasks = interviewData.codingTasks;
    session.interviewData.systemPrompt = interviewData.systemPrompt;
    
    // Merge metadata safely
    session.interviewData.metadata = {
      ...session.interviewData.metadata,
      ...interviewData.metadata,
      dataLoadedAt: new Date().toISOString()
    };

    // Don't touch results field unless we have actual results to save
    session.markModified('interviewData');
    await session.save();

    res.json({
      success: true,
      message: 'Session access granted',
      session: {
        sessionId: session.sessionId,
        candidateName: session.candidateDetails.candidateName,
        role: session.candidateDetails.role,
        companyName: session.candidateDetails.companyName,
        scheduledStartTime: session.sessionConfig.scheduledStartTime,
        scheduledEndTime: session.sessionConfig.scheduledEndTime,
        duration: session.sessionConfig.duration,
        status: session.sessionStatus,
        timeRemaining: Math.max(0, Math.ceil((accessEnd - now) / (1000 * 60))), // minutes
        accessToken: session.security.accessToken // Provide token for subsequent requests
      },
      interviewData: {
        candidateProfile: interviewData.candidateProfile,
        interviewQuestions: interviewData.interviewQuestions,
        codingTasks: interviewData.codingTasks,
        systemPrompt: interviewData.systemPrompt,
        metadata: interviewData.metadata
      },
      accessUrl: `/interview-session?sessionId=${session.sessionId}&token=${session.security.accessToken}`
    });

  } catch (error) {
    console.error('Error accessing session by candidate ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to access session'
    });
  }
});

// Get session status
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { token } = req.query;

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Basic status check without token
    if (!token) {
      return res.json({
        success: true,
        status: {
          sessionId: session.sessionId,
          status: session.sessionStatus,
          scheduledStartTime: session.sessionConfig.scheduledStartTime,
          scheduledEndTime: session.sessionConfig.scheduledEndTime,
          isAccessible: session.isAccessible
        }
      });
    }

    // Detailed status with valid token
    if (session.security.accessToken === token) {
      const now = new Date();
      const endTime = new Date(session.sessionConfig.scheduledEndTime);
      const accessEnd = new Date(endTime.getTime() + (session.sessionConfig.accessWindow.afterEnd * 60000));

      return res.json({
        success: true,
        status: {
          sessionId: session.sessionId,
          candidateName: session.candidateDetails.candidateName,
          role: session.candidateDetails.role,
          status: session.sessionStatus,
          scheduledStartTime: session.sessionConfig.scheduledStartTime,
          scheduledEndTime: session.sessionConfig.scheduledEndTime,
          timeRemaining: Math.max(0, Math.ceil((accessEnd - now) / (1000 * 60))),
          isActive: session.accessControl.isActive,
          joinedAt: session.accessControl.candidateJoinedAt,
          totalTimeSpent: session.accessControl.totalTimeSpent
        }
      });
    }

    res.status(401).json({
      success: false,
      error: 'Invalid access token'
    });

  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session status'
    });
  }
});

// End session
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { accessToken } = req.body;

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.security.accessToken !== accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    await session.completeSession();

    res.json({
      success: true,
      message: 'Session ended successfully',
      summary: {
        sessionId: session.sessionId,
        candidateName: session.candidateDetails.candidateName,
        totalTimeSpent: session.accessControl.totalTimeSpent,
        startedAt: session.accessControl.candidateJoinedAt,
        endedAt: session.accessControl.candidateLeftAt
      }
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// List sessions (for admin/recruiter)
router.get('/list', async (req, res) => {
  try {
    const { recruiterId, status, candidateId, date } = req.query;
    
    const query = {};
    
    if (recruiterId) query.recruiterId = new ObjectId(recruiterId);
    if (status) query.sessionStatus = status;
    if (candidateId) query.candidateId = new ObjectId(candidateId);
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000)); // Next day
      query['sessionConfig.scheduledStartTime'] = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const sessions = await InterviewSession.find(query)
      .select('sessionId candidateDetails sessionConfig sessionStatus accessControl createdAt')
      .sort({ 'sessionConfig.scheduledStartTime': 1 });

    res.json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        candidateName: session.candidateDetails.candidateName,
        candidateEmail: session.candidateDetails.candidateEmail,
        role: session.candidateDetails.role,
        companyName: session.candidateDetails.companyName,
        scheduledStartTime: session.sessionConfig.scheduledStartTime,
        scheduledEndTime: session.sessionConfig.scheduledEndTime,
        status: session.sessionStatus,
        isActive: session.accessControl.isActive,
        totalTimeSpent: session.accessControl.totalTimeSpent,
        createdAt: session.createdAt
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

// Update session (reschedule)
router.put('/update/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      scheduledDate,
      scheduledTime,
      duration,
      accessToken
    } = req.body;

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.security.accessToken !== accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    if (session.sessionStatus !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Can only update scheduled sessions'
      });
    }

    // Update scheduling if provided
    if (scheduledDate && scheduledTime) {
      const newStartTime = parseDateTime(scheduledDate, scheduledTime);
      const newDuration = duration || session.sessionConfig.duration;
      const newEndTime = new Date(newStartTime.getTime() + (newDuration * 60000));

      session.sessionConfig.scheduledStartTime = newStartTime;
      session.sessionConfig.scheduledEndTime = newEndTime;
      session.sessionConfig.duration = newDuration;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Session updated successfully',
      sessionDetails: {
        sessionId: session.sessionId,
        scheduledStartTime: session.sessionConfig.scheduledStartTime,
        scheduledEndTime: session.sessionConfig.scheduledEndTime,
        duration: session.sessionConfig.duration
      }
    });

  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
});

// Get interview data for a session
router.get('/interview-data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { token } = req.query;

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.security.accessToken !== token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    // If interview data hasn't been prepared yet, prepare it now
    let interviewData;
    if (!session.interviewData?.candidateProfile || !session.interviewData?.interviewQuestions) {
      console.log(`📋 Interview data not found in session, preparing now...`);
      interviewData = await prepareInterviewData(session.candidateId, session);
      
      // Update session with prepared data
      session.interviewData = {
        ...session.interviewData,
        candidateProfile: interviewData.candidateProfile,
        interviewQuestions: interviewData.interviewQuestions,
        codingTasks: interviewData.codingTasks,
        systemPrompt: interviewData.systemPrompt,
        metadata: {
          ...session.interviewData.metadata,
          ...interviewData.metadata,
          dataLoadedAt: new Date().toISOString()
        }
      };
      await session.save();
    } else {
      // Use existing data from session
      interviewData = {
        candidateProfile: session.interviewData.candidateProfile,
        interviewQuestions: session.interviewData.interviewQuestions,
        codingTasks: session.interviewData.codingTasks,
        systemPrompt: session.interviewData.systemPrompt,
        metadata: session.interviewData.metadata
      };
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      candidateName: session.candidateDetails.candidateName,
      interviewData
    });

  } catch (error) {
    console.error('Error getting interview data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get interview data'
    });
  }
});

// Initialize interview session for AI interviewer
router.post('/initialize-interview/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { accessToken } = req.body;

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.security.accessToken !== accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    // Prepare interview data if not already done
    let interviewData;
    if (!session.interviewData?.systemPrompt) {
      interviewData = await prepareInterviewData(session.candidateId, session);
      
      // Initialize interviewData safely to avoid undefined fields
      if (!session.interviewData) {
        session.interviewData = {};
      }
      if (!session.interviewData.metadata) {
        session.interviewData.metadata = {};
      }
      if (!session.interviewData.conversationHistory) {
        session.interviewData.conversationHistory = [];
      }

      // Update fields safely
      session.interviewData.candidateProfile = interviewData.candidateProfile;
      session.interviewData.interviewQuestions = interviewData.interviewQuestions;
      session.interviewData.codingTasks = interviewData.codingTasks;
      session.interviewData.systemPrompt = interviewData.systemPrompt;
      
      // Merge metadata safely
      session.interviewData.metadata = {
        ...session.interviewData.metadata,
        ...interviewData.metadata,
        dataLoadedAt: new Date().toISOString()
      };

      session.markModified('interviewData');
    } else {
      interviewData = {
        candidateProfile: session.interviewData.candidateProfile,
        interviewQuestions: session.interviewData.interviewQuestions,
        codingTasks: session.interviewData.codingTasks,
        systemPrompt: session.interviewData.systemPrompt,
        metadata: session.interviewData.metadata
      };
    }

    // Initialize conversation with system prompt and welcome message
    const welcomeMessage = `Hello ${session.candidateDetails.candidateName}! Welcome to your technical interview for the ${session.candidateDetails.role} position at ${session.candidateDetails.companyName}. I'll be asking you some questions today to understand your technical skills and experience better. Let's start with: Can you tell me about yourself and your technical background?`;

    const conversation = [
      { 
        role: 'system', 
        content: interviewData.systemPrompt,
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }
    ];

    // Store conversation in session
    session.interviewData.conversationHistory = conversation;
    session.interviewData.metadata = {
      ...session.interviewData.metadata,
      interviewStarted: true,
      startTime: new Date(),
      questionsAsked: 0,
      answersReceived: 0,
      codingTestsCompleted: 0
    };

    await session.save();

    res.json({
      success: true,
      message: 'Interview session initialized',
      sessionId: session.sessionId,
      initialMessage: welcomeMessage,
      sessionInfo: {
        sessionId: session.sessionId,
        accessToken: session.security.accessToken,
        candidateName: session.candidateDetails.candidateName,
        candidateId: session.candidateId,
        role: session.candidateDetails.role,
        companyName: session.candidateDetails.companyName
      },
      interviewData: {
        candidateProfile: interviewData.candidateProfile,
        interviewQuestions: interviewData.interviewQuestions,
        codingTasks: interviewData.codingTasks,
        systemPrompt: interviewData.systemPrompt,
        metadata: interviewData.metadata
      }
    });

  } catch (error) {
    console.error('Error initializing interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize interview session'
    });
  }
});

// Send message to AI interviewer
router.post('/message/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, accessToken } = req.body;

    if (!message || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'message and accessToken are required'
      });
    }

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.security.accessToken !== accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    // Check if session is active
    if (session.sessionStatus !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Session is not active'
      });
    }

    // Initialize conversation history if not exists
    if (!session.interviewData) {
      session.interviewData = {};
    }
    if (!session.interviewData.conversationHistory) {
      session.interviewData.conversationHistory = [];
    }

    // Add user message to conversation history
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    session.interviewData.conversationHistory.push(userMessage);

    // Generate AI response using OpenAI
    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'AI service not available'
      });
    }

    try {
      // Prepare conversation context for OpenAI
      const messages = [
        {
          role: 'system',
          content: session.interviewData.systemPrompt || generateSystemPrompt(
            session.interviewData.candidateProfile || session.candidateDetails,
            session,
            session.interviewData.interviewQuestions || []
          )
        }
      ];

      // Add recent conversation history (last 10 messages to keep context manageable)
      const recentMessages = session.interviewData.conversationHistory
        .slice(-10)
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      messages.push(...recentMessages);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = completion.choices[0].message.content.trim();

      // Add AI response to conversation history
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      session.interviewData.conversationHistory.push(assistantMessage);

      // Update metadata
      if (!session.interviewData.metadata) {
        session.interviewData.metadata = {};
      }
      session.interviewData.metadata.lastMessageAt = new Date();
      session.interviewData.metadata.answersReceived = (session.interviewData.metadata.answersReceived || 0) + 1;

      // Save session
      session.markModified('interviewData');
      await session.save();

      res.json({
        success: true,
        message: aiResponse,
        conversationId: session.interviewData.conversationHistory.length,
        metadata: {
          timestamp: assistantMessage.timestamp,
          messageCount: session.interviewData.conversationHistory.length
        }
      });

    } catch (aiError) {
      console.error('AI response error:', aiError);
      
      // Fallback response
      const fallbackResponse = "I apologize, but I'm having trouble processing your response right now. Could you please repeat your answer?";
      
      const assistantMessage = {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };

      session.interviewData.conversationHistory.push(assistantMessage);
      session.markModified('interviewData');
      await session.save();

      res.json({
        success: true,
        message: fallbackResponse,
        conversationId: session.interviewData.conversationHistory.length,
        metadata: {
          timestamp: assistantMessage.timestamp,
          messageCount: session.interviewData.conversationHistory.length,
          fallback: true
        }
      });
    }

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Cancel session
router.delete('/cancel/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { accessToken } = req.body;

    const session = await InterviewSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.security.accessToken !== accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    session.sessionStatus = 'cancelled';
    session.accessControl.isActive = false;
    await session.save();

    res.json({
      success: true,
      message: 'Session cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel session'
    });
  }
});

export default router;