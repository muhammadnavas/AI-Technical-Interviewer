import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import sessionRoutes from './routes/sessions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Optional MongoDB client (used when MONGO_URI is set in .env)
let mongoClient = null;
let db = null;
let candidatesCollection = null;
let codeQuestionsCollection = null;
let interviewResultsCollection = null;
let mongoConnected = false;
let mongoError = null;

async function initMongo() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.log('ℹ️ MONGO_URI not provided — skipping MongoDB initialization.');
        mongoConnected = false;
        return;
    }

    const maxAttempts = 3;
    const baseDelayMs = 1500; // incremental backoff

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Initialize mongoose connection for schema-based operations
            await mongoose.connect(uri, {
                dbName: process.env.MONGO_DB_NAME || 'ai_interviewer'
            });
            console.log(`✅ Mongoose connected (attempt ${attempt})`);

            // Use default options for MongoClient v4+ (avoid deprecated options)
            mongoClient = new MongoClient(uri);
            await mongoClient.connect();
            db = mongoClient.db(process.env.MONGO_DB_NAME || 'ai_interviewer');
            candidatesCollection = db.collection('candidates');
            codeQuestionsCollection = db.collection('code_questions');
            interviewResultsCollection = db.collection('interview_results');
            mongoConnected = true;
            mongoError = null;
            console.log(`✅ Connected to MongoDB (attempt ${attempt})`);
            break;
        } catch (err) {
            mongoError = err;
            mongoConnected = false;
            console.warn(`⚠️ MongoDB connection attempt ${attempt} failed:`, err.message);
            // If last attempt, clear client and keep going (filesystem will be used)
            if (attempt === maxAttempts) {
                try {
                    if (mongoClient) {
                        await mongoClient.close();
                    }
                    if (mongoose.connection.readyState !== 0) {
                        await mongoose.disconnect();
                    }
                } catch (closeErr) {
                    // ignore
                }
                mongoClient = null;
                console.warn('⚠️ Could not connect to MongoDB after retries. Falling back to filesystem storage.');
            } else {
                // wait with simple backoff
                const delay = baseDelayMs * attempt;
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
}

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:3002', // Recruiter frontend
    'http://localhost:4000', // Alternative recruiter frontend port
    'https://ai-technical-interviewer.onrender.com',
    'https://ai-code-editor-psi-two.vercel.app',
    'https://ai-technical-interviewer.vercel.app', // Main frontend
    'https://ai-technical-interviewer-seven.vercel.app' // Current Vercel deployment
];

// Add FRONTEND_URL from environment if provided
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add PRODUCTION_FRONTEND_URL from environment if provided
if (process.env.PRODUCTION_FRONTEND_URL) {
    allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// Initialize session routes with required dependencies
import scheduledSessionsRoutes from './routes/scheduledSessions.js';
import { initializeSessionRoutes } from './routes/sessions.js';
import { initializeScheduledSessions } from './utils/sessionScheduler.js';

async function initializeRoutes() {
  // Wait for MongoDB to be initialized
  if (mongoConnected) {
    initializeSessionRoutes({
      candidatesCollection,
      codeQuestionsCollection
    }, openai);
    
    // Initialize scheduled sessions
    initializeScheduledSessions(db);
  }
  
  // Routes
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/sessions/integrations', (await import('./routes/integrations.js')).default);
  app.use('/api/scheduled-sessions', scheduledSessionsRoutes);
}

// Initialize email routes separately - they handle their own database connections
async function initializeEmailRoutes() {
  try {
    const emailRoutes = await import('./routes/email.js');
    app.use('/api/email', emailRoutes.default);
    console.log('✅ Email routes initialized');
  } catch (error) {
    console.error('❌ Failed to initialize email routes:', error);
  }
}

// Store conversation history for each session
const conversationSessions = new Map();

// Store interview metadata
const interviewMetadata = new Map();

// Simple test sessions storage (for code editor flows)
const testSessions = new Map();

// Ensure results directory exists
const resultsDir = path.join(__dirname, 'interview-results');
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

// Ensure candidate profiles directory exists
const candidatesDir = path.join(__dirname, 'candidate-profiles');
if (!fs.existsSync(candidatesDir)) {
    fs.mkdirSync(candidatesDir);
}

// Initialize Mongo (if MONGO_URI provided) before starting the server
// This makes sure `candidatesCollection` and `codeQuestionsCollection` are set
// (if MONGO_URI is configured) before any requests are handled.
async function startServer() {
    try {
        await initMongo();
    } catch (err) {
        console.warn('Mongo init error:', err);
    }

    // Initialize routes after MongoDB connection
    await initializeRoutes();
    
    // Initialize email routes separately (they don't depend on MongoDB connection state)
    await initializeEmailRoutes();

    app.listen(port, () => {
        console.log(`🚀 AI Interviewer Backend running on port ${port}`);
        console.log(`📡 Health check: http://localhost:${port}/api/health`);
        console.log(`🌐 CORS allowed origins:`, allowedOrigins);
        console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
        console.log(`📁 Results saved to: ${resultsDir}`);
        console.log(`👤 Candidate profiles saved to: ${candidatesDir}`);
        if (mongoConnected && candidatesCollection) {
            console.log('✅ MongoDB enabled for candidate/profile storage');
            console.log('✅ Session management initialized with database integration');
        } else if (!process.env.MONGO_URI) {
            console.log('ℹ️ MongoDB not configured - using filesystem for storage');
        } else {
            console.log('⚠️ MongoDB configured but not connected - using filesystem for storage');
            if (mongoError) console.log('   Mongo error:', mongoError.message || mongoError.toString());
        }
    });
}

startServer();

// Function to refine conversation for recruiter review
async function refineConversationForRecruiter(qaList, metadata) {
    try {
        // Create a prompt for AI to refine the conversation
        const refinementPrompt = `You are an expert editor preparing interview transcripts for recruiter review. 

Candidate: ${metadata.candidateName}
Position: ${metadata.position}

Your task is to refine the following Q&A conversation:
1. Fix speech-to-text errors and typos
2. Improve grammar and sentence structure
3. Make the language professional and clear
4. Preserve the candidate's original meaning and technical details
5. Keep the technical terminology accurate
6. Maintain the conversational flow
7. Do NOT add information that wasn't said
8. Do NOT change the substance of the answers

Original Conversation:
${qaList.map((qa, idx) => `
Q${idx + 1}: ${qa.question}
A${idx + 1}: ${qa.answer}
`).join('\n')}

Please return a JSON array with this exact structure:
[
  {
    "question": "refined question text",
    "answer": "refined answer text",
    "originalAnswer": "original answer for reference",
    "refinementNotes": "brief note about what was improved (e.g., 'Fixed grammar, clarified technical terms')"
  }
]

Return ONLY the JSON array, no other text.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert editor who refines interview transcripts while preserving accuracy and meaning. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: refinementPrompt
                }
            ],
            temperature: 0.3, // Lower temperature for more consistent refinement
            max_tokens: 3000
        });

        const refinedContent = completion.choices[0].message.content.trim();
        
        // Try to parse the JSON response
        let refinedQA;
        try {
            // Remove markdown code blocks if present
            const jsonContent = refinedContent
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            refinedQA = JSON.parse(jsonContent);
        } catch (parseError) {
            console.error('Error parsing refined conversation, using original:', parseError);
            // If parsing fails, return original with note
            return qaList.map(qa => ({
                question: qa.question,
                answer: qa.answer,
                originalAnswer: qa.answer,
                refinementNotes: 'Original transcript (AI refinement unavailable)'
            }));
        }

        return refinedQA;

    } catch (error) {
        console.error('Error refining conversation:', error);
        // On error, return original conversation
        return qaList.map(qa => ({
            question: qa.question,
            answer: qa.answer,
            originalAnswer: qa.answer,
            refinementNotes: 'Original transcript (refinement failed)'
        }));
    }
}

// Generate targeted interview questions for a candidate using OpenAI
async function generateQuestionsForCandidate(profile) {
    try {
        const prompt = `You are an expert technical interviewer. Based on the following candidate profile, generate an array (JSON) of 6-10 relevant interview questions that focus on the candidate's skills, projects, and likely junior-to-mid level expectations. Return ONLY a JSON array of strings.\n\nCandidate Profile:\nName: ${profile.candidateName}\nPosition: ${profile.position || 'Full Stack Developer'}\nSkills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}\nProjects: ${profile.projectDetails || profile.githubProjects || 'N/A'}\nExperience: ${profile.experience || 'N/A'}\n\nRequirements:\n- Produce 6 to 10 clear, distinct interview questions\n- Include at least 1 coding or implementation task-style question\n- Include at least 1 question about system design or architecture appropriate to the role\n- Keep questions concise and practical`;

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
        // Strip possible markdown code fences
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const questions = JSON.parse(content);
            if (Array.isArray(questions)) return questions;
        } catch (err) {
            // If not JSON, try to split by newlines and extract numbered list
            const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
            const extracted = lines
                .map(l => l.replace(/^\d+\.|^-\s*/,'').trim())
                .filter(Boolean);
            if (extracted.length >= 3) return extracted.slice(0, 10);
        }

        // Fallback default questions
        return [
            'Tell me about a project you built that you are most proud of and what you learned from it.',
            'Explain your typical approach to debugging a production issue.',
            'Write a function to reverse a string and explain its time complexity.',
            'How would you design a simple REST API for a todo app? Describe endpoints and data models.',
            'What are the differences between SQL and NoSQL databases and when to use each?',
            'Explain the event loop in JavaScript and how asynchronous code executes.'
        ];
    } catch (error) {
        console.error('Error generating questions:', error);
        return [
            'Tell me about a project you built that you are most proud of and what you learned from it.',
            'Explain your typical approach to debugging a production issue.',
            'Write a function to reverse a string and explain its time complexity.',
            'How would you design a simple REST API for a todo app? Describe endpoints and data models.',
            'What are the differences between SQL and NoSQL databases and when to use each?',
            'Explain the event loop in JavaScript and how asynchronous code executes.'
        ];
    }
}

// Generate coding task(s) for the code editor specific to a candidate
async function generateCodingTasksForCandidate(profile) {
    try {
        const prompt = `You are an expert coding-question writer. Given the following candidate profile, produce a JSON array of 1-3 coding tasks suitable for a live coding editor. Each task should be an object with the fields: id (short string), title, description, languageHints (array), exampleInputOutput (optional), and a small set of unit tests described as strings. Return ONLY valid JSON.

Candidate Profile:\nName: ${profile.candidateName}\nPosition: ${profile.position || 'Full Stack Developer'}\nSkills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}\nProjects: ${profile.projectDetails || profile.githubProjects || 'N/A'}\nExperience: ${profile.experience || 'N/A'}\n\nRequirements:\n- Create 1 to 3 practical coding tasks, each with clear instructions and input/output examples when appropriate.\n- Include at least one task that can be evaluated with small unit tests.\n- Keep tasks concise and focused for a 20-45 minute coding exercise.\n- Return only JSON (array of objects).`;

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
            // Fallback: try to extract JSON-like segments
            console.error('Failed to parse coding tasks JSON:', err);
        }

        // Fallback simple task
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
    } catch (error) {
        console.error('Error generating coding tasks:', error);
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
}

// Convert an existing `codingAssessment` block from an uploaded profile into editor tasks
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

// Generate and save coding questions for a candidate profile
app.post('/api/candidate/generate-code-questions', async (req, res) => {
    try {
        const { candidateId } = req.body;
        if (!candidateId) return res.status(400).json({ success: false, error: 'candidateId is required' });

        // DB-only: load profile from MongoDB
        if (!candidatesCollection) {
            console.warn('Attempted to generate code questions but MongoDB candidates collection is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to load candidate profiles: MongoDB not available' });
        }

        let profile = null;
        try {
            const doc = await candidatesCollection.findOne({ candidateId });
            if (doc) {
                const { _id, ...rest } = doc;
                profile = rest;
            }
        } catch (err) {
            console.error('MongoDB fetch error for profile:', err);
            return res.status(500).json({ success: false, error: 'Failed to load candidate profile from DB' });
        }

        if (!profile) return res.status(404).json({ success: false, error: 'Candidate profile not found' });

        // If the uploaded profile contains a codingAssessment block, prefer converting it
        // into editor tasks instead of calling the AI generator.
        let tasks = null;
        try {
            const converted = convertCodingAssessmentToTasks(profile);
            if (converted && Array.isArray(converted) && converted.length > 0) {
                tasks = converted;
            }
        } catch (e) {
            console.warn('Error converting codingAssessment to tasks:', e.message || e);
        }

        if (!tasks) {
            tasks = await generateCodingTasksForCandidate(profile);
        }

        // Persist generated tasks to MongoDB only (no filesystem writes)
        if (!codeQuestionsCollection) {
            console.warn('Attempted to generate code questions but MongoDB code_questions collection is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to persist code questions: MongoDB not available' });
        }

        try {
            await codeQuestionsCollection.updateOne(
                { candidateId },
                { $set: { candidateId, tasks, updatedAt: new Date().toISOString() } },
                { upsert: true }
            );
        } catch (err) {
            console.error('Failed to save code questions to MongoDB:', err);
            return res.status(500).json({ success: false, error: 'Failed to persist code questions to database' });
        }

        res.json({ success: true, candidateId, tasks });
    } catch (error) {
        console.error('Error generating code questions:', error);
        res.status(500).json({ success: false, error: 'Failed to generate code questions' });
    }
});

// Serve coding questions JSON for a candidate
app.get('/api/candidate/code-questions/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;

        // DB-only: require MongoDB collection to serve code questions
        if (!codeQuestionsCollection) {
            console.warn('Attempted to fetch code questions but MongoDB code_questions collection is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to serve code questions: MongoDB not available' });
        }

        try {
            const doc = await codeQuestionsCollection.findOne({ candidateId });
            if (!doc || !doc.tasks) return res.status(404).json({ success: false, error: 'Code questions not found' });
            return res.json({ success: true, tasks: doc.tasks });
        } catch (err) {
            console.error('Error fetching code questions from MongoDB:', err);
            return res.status(500).json({ success: false, error: 'Failed to load code questions from database' });
        }
    } catch (error) {
        console.error('Error serving code questions:', error);
        res.status(500).json({ success: false, error: 'Failed to load code questions' });
    }
});

// Start a test session for the code editor. Returns sessionId, candidateId and the first question.
app.post('/api/test/start-session', async (req, res) => {
    try {
        const body = req.body || {};
        const { candidateId, testConfig, difficulty = 'easy', language = 'javascript', totalQuestions: requestedTotal } = body;

        // Generate a session id
        const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;

        let questions = [];
        let candidateName = body.candidateName || 'Candidate';

        // If a testConfig (uploaded) is provided, normalize and use it
        if (testConfig && Array.isArray(testConfig.questions) && testConfig.questions.length > 0) {
            questions = testConfig.questions.map((q, idx) => ({
                id: q.id || `q_${idx}`,
                title: q.title || q.name || `Question ${idx + 1}`,
                description: q.description || q.prompt || '',
                signature: q.signature || '',
                sampleTests: q.sampleTests || q.samples || q.examples || [],
                hiddenTests: q.hiddenTests || q.hidden || [],
                testCases: q.testCases || q.tests || [],
                language: (q.language || testConfig.language || language).toLowerCase(),
                timeLimit: q.timeLimit || testConfig.timePerQuestion || 300,
            }));
            candidateName = testConfig.candidateName || candidateName;
        }

        // If no uploaded config, try candidateId-based loading
        if ((!questions || questions.length === 0) && candidateId) {
            // Try DB stored code questions first
            if (codeQuestionsCollection) {
                try {
                    const doc = await codeQuestionsCollection.findOne({ candidateId });
                    if (doc && Array.isArray(doc.tasks) && doc.tasks.length > 0) {
                        questions = doc.tasks.map((t, idx) => ({
                            id: t.id || `q_${idx}`,
                            title: t.title || `Question ${idx + 1}`,
                            description: t.description || t.prompt || '',
                            signature: t.signature || '',
                            sampleTests: t.sampleTests || [],
                            hiddenTests: t.hiddenTests || [],
                            testCases: t.testCases || t.tests || [],
                            language: (t.languageHints && t.languageHints[0]) || t.language || language,
                            timeLimit: t.timeLimit || 300
                        }));
                    }
                } catch (err) {
                    console.warn('MongoDB code-questions fetch error in start-session:', err.message);
                }
            }

            // If still empty, try to load candidate profile from DB and convert/generate tasks (DB-only)
            if ((!questions || questions.length === 0)) {
                if (!candidatesCollection) {
                    console.warn('No DB available to load candidate profile for start-session. Rejecting to avoid filesystem fallback.');
                } else {
                    try {
                        const doc = await candidatesCollection.findOne({ candidateId });
                        let profile = doc || null;
                        if (profile) {
                            candidateName = profile.candidateName || candidateName;
                            // Prefer converting any provided codingAssessment
                            try {
                                const converted = convertCodingAssessmentToTasks(profile);
                                if (converted && Array.isArray(converted) && converted.length > 0) {
                                    questions = converted.map((t, idx) => ({
                                        id: t.id || `q_${idx}`,
                                        title: t.title || `Question ${idx + 1}`,
                                        description: t.description || '',
                                        signature: t.signature || '',
                                        sampleTests: t.sampleTests || [],
                                        hiddenTests: t.hiddenTests || [],
                                        testCases: t.testCases || [],
                                        language: (t.languageHints && t.languageHints[0]) || (t.language || language),
                                        timeLimit: t.timeLimit || 300
                                    }));
                                }
                            } catch (e) {
                                console.warn('Error converting codingAssessment in start-session:', e.message || e);
                            }

                            if ((!questions || questions.length === 0)) {
                                try {
                                    const gen = await generateCodingTasksForCandidate(profile);
                                    if (gen && Array.isArray(gen) && gen.length > 0) {
                                        questions = gen.map((t, idx) => ({
                                            id: t.id || `q_${idx}`,
                                            title: t.title || `Question ${idx + 1}`,
                                            description: t.description || '',
                                            signature: t.signature || '',
                                            sampleTests: t.sampleTests || [],
                                            hiddenTests: t.hiddenTests || [],
                                            testCases: t.testCases || [],
                                            language: (t.languageHints && t.languageHints[0]) || (t.language || language),
                                            timeLimit: t.timeLimit || 300
                                        }));
                                    }
                                } catch (err) {
                                    console.warn('Error generating coding tasks in start-session:', err.message);
                                }
                            }

                            // Persist generated tasks to DB if available (no filesystem writes)
                            if (questions && questions.length > 0 && codeQuestionsCollection) {
                                try {
                                    await codeQuestionsCollection.updateOne({ candidateId }, { $set: { candidateId, tasks: questions, updatedAt: new Date().toISOString() } }, { upsert: true });
                                } catch (err) {
                                    console.warn('Failed to upsert generated code questions to MongoDB:', err.message);
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('MongoDB profile fetch error in start-session:', err.message);
                    }
                }
            }
        }

        if (!questions || questions.length === 0) {
            return res.status(404).json({ success: false, error: 'No test questions available for this request. Provide testConfig or candidateId with stored questions.' });
        }

        const totalQuestions = Number.isInteger(requestedTotal) ? requestedTotal : questions.length;

        const session = {
            id: sessionId,
            candidateId: candidateId || null,
            candidateName,
            difficulty,
            language,
            startTime: new Date().toISOString(),
            currentQuestion: 0,
            totalQuestions,
            questions,
            results: [],
            isActive: true
        };

        testSessions.set(sessionId, session);

        const firstQuestion = session.questions[0];

        res.json({ success: true, sessionId, candidateId: session.candidateId, question: firstQuestion, questionNumber: 1, totalQuestions: session.totalQuestions, timeLimit: firstQuestion.timeLimit || 300 });

    } catch (error) {
        console.error('start-session error:', error);
        res.status(500).json({ success: false, error: 'Failed to start test session' });
    }
});

// Interview setup endpoint
app.post('/api/interview/setup', async (req, res) => {
    try {
        const {
            sessionId,
            candidateId,
            candidateName: reqCandidateName,
            skills: reqSkills,
            projectDetails: reqProjectDetails,
            customQuestions: reqCustomQuestions,
            position: reqPosition = 'Full Stack Developer'
        } = req.body;

        let candidateName = reqCandidateName || 'Candidate';
        let skills = Array.isArray(reqSkills) ? reqSkills : (reqSkills ? reqSkills : []);
        let projectDetails = reqProjectDetails || '';
        let customQuestions = Array.isArray(reqCustomQuestions) ? reqCustomQuestions : (reqCustomQuestions ? reqCustomQuestions : []);
        let position = reqPosition;

        // If a candidateId is provided, load the profile from MongoDB (DB-only)
        if (candidateId) {
            if (!candidatesCollection) {
                console.warn('Attempted to load candidate profile for interview setup but DB is not available. Rejecting to avoid filesystem fallback.');
                return res.status(503).json({ success: false, error: 'Server not configured to load candidate profiles: MongoDB not available' });
            }

            let profile = null;
            try {
                const doc = await candidatesCollection.findOne({ candidateId });
                if (doc) {
                    const { _id, ...rest } = doc;
                    profile = rest;
                }
            } catch (err) {
                console.error('MongoDB load error for interview setup:', err);
                return res.status(500).json({ success: false, error: 'Failed to load candidate profile from DB' });
            }

            if (!profile) return res.status(404).json({ success: false, error: 'Candidate profile not found' });

            candidateName = profile.candidateName || candidateName;
            position = profile.position || position;
            skills = Array.isArray(profile.skills) ? profile.skills : (profile.skills ? profile.skills.split(',').map(s => s.trim()) : []);
            projectDetails = profile.projectDetails || profile.githubProjects || projectDetails;
            customQuestions = Array.isArray(profile.customQuestions) ? profile.customQuestions : (profile.customQuestions ? profile.customQuestions.split('\n').map(q => q.trim()) : []);

            // If no customQuestions provided in profile, generate questions using AI
            if (!customQuestions || customQuestions.length === 0) {
                console.log(`🧠 No custom questions found for ${candidateId}, generating questions via AI...`);
                customQuestions = await generateQuestionsForCandidate(profile);
                console.log('✅ Generated questions:', customQuestions.length);
            }
        }

        // Create system prompt with candidate context
        const systemPrompt = `You are an expert technical interviewer conducting an interview for a ${position} position.

Candidate Information:
- Name: ${candidateName}
- Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
${projectDetails ? `- Project Experience: ${projectDetails}` : ''}

Your responsibilities:
1. Ask relevant technical questions based on the candidate's skills and experience
2. Follow up on their answers with deeper technical questions
3. Assess their problem-solving approach
4. Be professional, encouraging, and constructive
5. Keep questions clear and concise
6. Adapt difficulty based on their responses

${customQuestions && customQuestions.length > 0 ? `
Priority Questions to Cover:
${customQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
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

        // Initialize conversation with system prompt
        const conversation = [
            { role: 'system', content: systemPrompt },
            {
                role: 'assistant',
                content: `Hello ${candidateName}! Welcome to your technical interview for the ${position} position. I'll be asking you some questions today to understand your technical skills and experience better. Let's start with: Can you tell me about yourself and your technical background?`
            }
        ];

        // Store conversation in session
        conversationSessions.set(sessionId, conversation);

        // Store metadata
        interviewMetadata.set(sessionId, {
            candidateName,
            position,
            skills,
            projectDetails,
            customQuestions,
            startTime: new Date().toISOString(),
            endTime: null,
            totalQuestions: 0,
            totalAnswers: 0,
            codingTests: [] // track coding test events (start/submission)
        });

        res.json({
            success: true,
            message: 'Interview session initialized',
            initialMessage: conversation[1].content
        });
    } catch (error) {
        console.error('Error setting up interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize interview session'
        });
    }
});

// Get AI response endpoint
app.post('/api/interview/message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and message are required'
            });
        }

        // Get conversation history
        let conversation = conversationSessions.get(sessionId);
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Interview session not found. Please start a new interview.'
            });
        }

        // Add user message to conversation
        conversation.push({ role: 'user', content: message });

        // If the interview is waiting for a coding submission, do not call OpenAI for follow-ups.
        const metadata = interviewMetadata.get(sessionId) || {};
        if (metadata.awaitingCodingSubmission) {
            // We still record the message but inform the frontend that the interviewer is paused.
            conversationSessions.set(sessionId, conversation);
            return res.json({
                success: true,
                response: "The interviewer is currently waiting for the coding test submission and will resume after it's submitted.",
                paused: true
            });
        }

        // Get AI response from OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: conversation,
            temperature: 0.7,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.3
        });

        const aiResponse = completion.choices[0].message.content;

        // Add AI response to conversation
        conversation.push({
            role: 'assistant',
            content: aiResponse
        });

        // Update conversation in session
        conversationSessions.set(sessionId, conversation);

        // Update metadata
        const meta = interviewMetadata.get(sessionId);
        if (meta) {
            meta.totalQuestions++;
            meta.totalAnswers++;
            interviewMetadata.set(sessionId, meta);
        }

        res.json({
            success: true,
            response: aiResponse,
            messageCount: conversation.length
        });

    } catch (error) {
        console.error('Error getting AI response:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get AI response'
        });
    }
});

// Receive coding test results from frontend (iframe) and forward to AI interviewer
app.post('/api/interview/code-result', async (req, res) => {
    try {
        const { sessionId, code, language, passed, result, details } = req.body;
        console.log(`[code-result] Received submission for sessionId=${sessionId} language=${language} passed=${passed}`);

        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        const conversation = conversationSessions.get(sessionId);
        if (!conversation) {
            return res.status(404).json({ success: false, error: 'Interview session not found' });
        }

        // Create a user message summarizing the coding submission
        const parts = ['Candidate submitted a coding test.'];
        if (language) parts.push(`Language: ${language}.`);
        if (typeof passed !== 'undefined') parts.push(`Passed: ${passed}.`);
        if (result) {
            const summary = (typeof result === 'string' && result.length > 400)
                ? result.slice(0, 400) + '... (truncated)'
                : result;
            parts.push(`Result summary: ${summary}`);
        }
        if (details) parts.push(`Details: ${details}`);
        const submissionSummary = parts.join(' ');

        // Push the candidate submission as a user message into the conversation
        conversation.push({ role: 'user', content: submissionSummary });

        // Record submission in metadata.codingTests
        try {
            const metadata = interviewMetadata.get(sessionId) || {};
            metadata.codingTests = metadata.codingTests || [];
            metadata.codingTests.push({
                submittedAt: new Date().toISOString(),
                language: language || null,
                passed: typeof passed !== 'undefined' ? passed : null,
                resultSummary: result || null,
                details: details || null
            });
            interviewMetadata.set(sessionId, metadata);
        } catch (e) {
            console.warn('Unable to record coding test submission in metadata:', e);
        }

        // Optionally include the full code as a separate system message (keeps assistant aware)
        if (code) {
            const codeMessage = `---BEGIN_CANDIDATE_CODE---\n${code}\n---END_CANDIDATE_CODE---`;
            conversation.push({ role: 'user', content: codeMessage });
        }

        // Clear awaiting flag — candidate has submitted the coding test
        try {
            const metadata = interviewMetadata.get(sessionId) || {};
            metadata.awaitingCodingSubmission = false;
            // mark the latest coding test record as submitted
            if (metadata.codingTests && metadata.codingTests.length > 0) {
                const latest = metadata.codingTests[metadata.codingTests.length - 1];
                latest.submittedAt = new Date().toISOString();
                latest.passed = typeof passed !== 'undefined' ? passed : latest.passed;
            }
            interviewMetadata.set(sessionId, metadata);
        } catch (e) {
            console.warn('Failed to clear awaitingCodingSubmission flag:', e);
        }

        // Call OpenAI to get the interviewer's reaction/evaluation or next question
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: conversation,
            temperature: 0.3,
            max_tokens: 600
        });

        const aiResponse = completion.choices[0].message.content;

        // Append AI response to conversation
        conversation.push({ role: 'assistant', content: aiResponse });

        // Update stored conversation
        conversationSessions.set(sessionId, conversation);

        res.json({ success: true, aiResponse });
    } catch (error) {
        console.error('Error processing code result:', error);
        res.status(500).json({ success: false, error: 'Failed to process code result' });
    }
});

// Mark coding test started for a session (called when editor opens)
// If a candidateId is provided, return the coding assessment data for that candidate
app.post('/api/interview/code-start', async (req, res) => {
    try {
        const { sessionId, testName, candidateId } = req.body;
        console.log(`[code-start] Received code-start request for sessionId=${sessionId} candidateId=${candidateId} testName=${testName}`);
        if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required' });

        const metadata = interviewMetadata.get(sessionId);
        if (!metadata) return res.status(404).json({ success: false, error: 'Interview session not found' });

        metadata.codingTests = metadata.codingTests || [];
        const testRecord = { startedAt: new Date().toISOString(), testName: testName || 'Coding Test', submittedAt: null, candidateId: candidateId || null };
        metadata.codingTests.push(testRecord);
        // Mark interview as awaiting coding submission so the AI pauses asking further questions
        metadata.awaitingCodingSubmission = true;
        interviewMetadata.set(sessionId, metadata);

        // Insert a message into the conversation indicating interviewer will wait
        try {
            const conv = conversationSessions.get(sessionId) || [];
            conv.push({ role: 'assistant', content: `The candidate has started a coding exercise (${testName || 'Coding Test'}). I'll pause the live interview and wait until the test is submitted. When you finish, please submit the test in the editor; I'll review the results and then continue the interview with follow-up questions.` });
            conversationSessions.set(sessionId, conv);
        } catch (e) {
            console.warn('Failed to push pause message into conversation:', e);
        }

    // If a candidateId is provided, attempt to load their coding questions/tasks
        let tasks = null;
        if (candidateId) {
            // Try MongoDB first
            if (codeQuestionsCollection) {
                try {
                    const doc = await codeQuestionsCollection.findOne({ candidateId });
                    if (doc && doc.tasks) tasks = doc.tasks;
                } catch (err) {
                    console.warn('MongoDB code-questions fetch error on code-start:', err.message);
                }
            }

            // If still no tasks, attempt to generate them from the candidate profile (DB-only)
            if (!tasks) {
                if (!candidatesCollection) {
                    console.warn('No DB available to load candidate profile for code-start. Rejecting to avoid filesystem fallback.');
                } else {
                    try {
                        const doc = await candidatesCollection.findOne({ candidateId });
                        const profile = doc || null;
                        if (profile) {
                            // Prefer converting any provided codingAssessment -> tasks first
                            try {
                                const converted = convertCodingAssessmentToTasks(profile);
                                if (converted && Array.isArray(converted) && converted.length > 0) {
                                    tasks = converted;
                                }
                            } catch (e) {
                                console.warn('Error converting codingAssessment to tasks on code-start:', e.message || e);
                            }

                            if (!tasks) {
                                tasks = await generateCodingTasksForCandidate(profile);
                            }

                            // Persist generated tasks to DB (no filesystem writes)
                            if (tasks && tasks.length > 0 && codeQuestionsCollection) {
                                try {
                                    await codeQuestionsCollection.updateOne({ candidateId }, { $set: { candidateId, tasks, updatedAt: new Date().toISOString() } }, { upsert: true });
                                } catch (err) {
                                    console.warn('Failed to upsert generated code questions to MongoDB:', err.message);
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('Error generating code tasks on code-start:', err.message);
                    }
                }
            }
        }

    console.log(`[code-start] Responding with tasks for candidateId=${candidateId} tasksCount=${tasks ? tasks.length : 0}`);
    res.json({ success: true, message: 'Coding test started recorded', candidateId: candidateId || null, tasks });
    } catch (error) {
        console.error('Error recording code-start:', error);
        res.status(500).json({ success: false, error: 'Failed to record code-start' });
    }
});

// End interview endpoint
app.post('/api/interview/end', async (req, res) => {
    try {
        const { sessionId } = req.body;

        // Get final conversation
        const conversation = conversationSessions.get(sessionId);
        const metadata = interviewMetadata.get(sessionId);
        
        if (conversation && metadata) {
            // Update end time
            metadata.endTime = new Date().toISOString();
            
            // Calculate duration
            const startTime = new Date(metadata.startTime);
            const endTime = new Date(metadata.endTime);
            const durationMs = endTime - startTime;
            const durationMinutes = Math.floor(durationMs / 60000);
            const durationSeconds = Math.floor((durationMs % 60000) / 1000);
            
            // Extract raw Q&A pairs from conversation
            const rawQAList = [];
            for (let i = 2; i < conversation.length; i += 2) {
                if (conversation[i] && conversation[i + 1]) {
                    rawQAList.push({
                        question: conversation[i - 1]?.content || '',
                        answer: conversation[i]?.content || '',
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Refine conversation using AI for recruiter readability
            console.log('🔄 Refining conversation for recruiter review...');
            const refinedQAList = await refineConversationForRecruiter(rawQAList, metadata);
            console.log('✅ Conversation refined successfully');
            
            // Prepare interview result
            const interviewResult = {
                sessionId,
                candidateInfo: {
                    name: metadata.candidateName,
                    position: metadata.position,
                    skills: metadata.skills,
                    projectDetails: metadata.projectDetails,
                    customQuestions: metadata.customQuestions
                },
                interviewDetails: {
                    startTime: metadata.startTime,
                    endTime: metadata.endTime,
                    duration: `${durationMinutes}m ${durationSeconds}s`,
                    totalQuestions: metadata.totalQuestions,
                    totalAnswers: metadata.totalAnswers,
                    totalMessages: conversation.length - 1 // Exclude system prompt
                },
                conversationRefined: refinedQAList, // AI-refined for recruiters
                conversationRaw: rawQAList, // Original transcription
                fullTranscript: conversation.slice(1).map((msg, idx) => ({
                    sequence: idx + 1,
                    role: msg.role === 'assistant' ? 'AI Interviewer' : 'Candidate',
                    message: msg.content,
                    timestamp: new Date().toISOString()
                })),
                recruitersNote: "The 'conversationRefined' section has been processed by AI to correct speech-to-text errors, improve grammar, and enhance readability while preserving the candidate's actual meaning and technical knowledge.",
                savedAt: new Date().toISOString()
            };
            
            // Persist interview result to MongoDB (no filesystem writes)
            if (!interviewResultsCollection) {
                console.warn('Attempted to save interview result but interviewResultsCollection is not available. Rejecting to avoid filesystem fallback.');
                return res.status(503).json({ success: false, error: 'Server not configured to persist interview results: MongoDB not available' });
            }

            const fileName = `interview_${(metadata.candidateName || 'candidate').replace(/\s+/g, '_')}_${Date.now()}.json`;
            try {
                const dbDoc = { ...interviewResult, fileName };
                await interviewResultsCollection.insertOne(dbDoc);
                console.log(`✅ Interview result persisted to MongoDB: ${fileName}`);
            } catch (err) {
                console.error('Failed to save interview result to MongoDB:', err);
                return res.status(500).json({ success: false, error: 'Failed to persist interview result to database' });
            }

            // Delete session from memory
            conversationSessions.delete(sessionId);
            interviewMetadata.delete(sessionId);

            res.json({
                success: true,
                message: 'Interview session ended and saved to database',
                fileName: fileName,
                summary: {
                    candidateName: metadata.candidateName,
                    duration: `${durationMinutes}m ${durationSeconds}s`,
                    questionsAsked: metadata.totalQuestions
                }
            });
        } else {
            res.json({
                success: true,
                message: 'Interview session ended (no data to save)'
            });
        }

    } catch (error) {
        console.error('Error ending interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end interview session'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'AI Interviewer Backend is running',
        openaiConfigured: !!process.env.OPENAI_API_KEY
    });
});

// DB health endpoint for debugging Mongo connection
app.get('/api/db-health', (req, res) => {
    res.json({
        success: true,
        mongo: {
            configured: !!process.env.MONGO_URI,
            connected: !!mongoConnected,
            error: mongoError ? (mongoError.message || String(mongoError)) : null
        }
    });
});

// Get all saved interview results
app.get('/api/interview/results', async (req, res) => {
    try {
        if (!interviewResultsCollection) {
            console.warn('Attempted to list interview results but DB is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to list interview results: MongoDB not available' });
        }

        const cursor = interviewResultsCollection.find({});
        const docs = await cursor.toArray();
        const results = docs.map(doc => ({
            fileName: doc.fileName || null,
            sessionId: doc.sessionId || null,
            candidateName: doc.candidateInfo?.name || null,
            position: doc.candidateInfo?.position || null,
            date: doc.savedAt || doc.createdAt || null,
            duration: doc.interviewDetails?.duration || null,
            questionsAsked: doc.interviewDetails?.totalQuestions || null
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, count: results.length, results });
    } catch (error) {
        console.error('Error fetching results from DB:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch interview results' });
    }
});

// Get specific interview result
app.get('/api/interview/results/:fileName', async (req, res) => {
    try {
        if (!interviewResultsCollection) {
            console.warn('Attempted to fetch interview result but DB is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to fetch interview results: MongoDB not available' });
        }

        const { fileName } = req.params;
        const doc = await interviewResultsCollection.findOne({ fileName });
        if (!doc) return res.status(404).json({ success: false, error: 'Interview result not found' });
        res.json({ success: true, data: doc });
    } catch (error) {
        console.error('Error fetching result from DB:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch interview result' });
    }
});

// ============================================
// CANDIDATE PROFILE MANAGEMENT ENDPOINTS
// ============================================

// Save candidate profile
app.post('/api/candidate/save', async (req, res) => {
    try {
        const {
            candidateId,
            candidateName,
            position,
            skills,
            projectDetails,
            customQuestions,
            githubProjects,
            experience,
            education,
            metadata
        } = req.body;

        if (!candidateId || !candidateName) {
            return res.status(400).json({
                success: false,
                error: 'Candidate ID and name are required'
            });
        }

        // Create candidate profile object (merge any rawProfile sent by the frontend)
        let candidateProfile = {
            candidateId,
            candidateName,
            position: position || 'Full Stack Developer',
            skills: Array.isArray(skills) ? skills : [],
            projectDetails: projectDetails || '',
            customQuestions: Array.isArray(customQuestions) ? customQuestions : [],
            githubProjects: githubProjects || '',
            experience: experience || '',
            education: education || '',
            metadata: metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // If frontend provided the original parsed JSON (rawProfile), merge it so fields like
        // descriptions, codingAssessment, projects, etc. are preserved in storage.
        if (req.body.rawProfile && typeof req.body.rawProfile === 'object') {
            const raw = { ...req.body.rawProfile };
            // Ensure candidateId and candidateName are set from the primary fields
            raw.candidateId = candidateId;
            raw.candidateName = candidateName;
            // Merge raw over the base candidateProfile so explicit fields aren't lost
            candidateProfile = { ...candidateProfile, ...raw, updatedAt: new Date().toISOString() };
            // Keep createdAt from raw if present
            if (raw.createdAt) candidateProfile.createdAt = raw.createdAt;
        }

        // If Mongo is available, prefer upserting into MongoDB and skip filesystem write
        const fileName = `candidate_${candidateId}.json`;
        const filePath = path.join(candidatesDir, fileName);

        if (!candidatesCollection) {
            console.warn('Attempted to save candidate profile but MongoDB candidates collection is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to persist candidate profiles: MongoDB not available' });
        }

        try {
            await candidatesCollection.updateOne(
                { candidateId: candidateId },
                { $set: { ...candidateProfile, updatedAt: new Date().toISOString() } },
                { upsert: true }
            );
            console.log(`✅ Candidate profile upserted to MongoDB: ${candidateId}`);
            return res.json({ success: true, message: 'Candidate profile saved to MongoDB', candidateId, fileName: null });
        } catch (err) {
            console.error('Failed to upsert candidate to MongoDB:', err);
            return res.status(500).json({ success: false, error: 'Failed to save candidate profile to MongoDB' });
        }

    } catch (error) {
        console.error('Error saving candidate profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save candidate profile'
        });
    }
});

// Upload a candidate JSON file (accepts either a parsed object in `rawProfile`,
// a JSON string in `fileContent`, or a base64-encoded JSON in `fileBase64`).
// This endpoint will parse the uploaded content and save it to MongoDB (if configured)
// or fall back to writing to disk under `candidate-profiles`.
app.post('/api/candidate/upload', async (req, res) => {
    try {
        let profile = null;

        // Accept already-parsed object
        if (req.body && req.body.rawProfile && typeof req.body.rawProfile === 'object') {
            profile = req.body.rawProfile;
        }

        // Accept a JSON string payload
        else if (req.body && req.body.fileContent && typeof req.body.fileContent === 'string') {
            try {
                profile = JSON.parse(req.body.fileContent);
            } catch (err) {
                return res.status(400).json({ success: false, error: 'Invalid JSON in fileContent' });
            }
        }

        // Accept base64 encoded file content
        else if (req.body && req.body.fileBase64 && typeof req.body.fileBase64 === 'string') {
            try {
                const txt = Buffer.from(req.body.fileBase64, 'base64').toString('utf8');
                profile = JSON.parse(txt);
            } catch (err) {
                return res.status(400).json({ success: false, error: 'Invalid base64 JSON in fileBase64' });
            }
        } else {
            return res.status(400).json({ success: false, error: 'No profile provided. Use rawProfile, fileContent or fileBase64.' });
        }

        // Ensure we have an object
        if (!profile || typeof profile !== 'object') {
            return res.status(400).json({ success: false, error: 'Parsed profile is not an object' });
        }

        // Determine candidateId (prefer explicit field)
        let candidateId = profile.candidateId || profile.id || null;
        if (!candidateId) {
            // Generate a simple candidateId from name + timestamp if missing
            const namePart = (profile.candidateName || profile.name || 'candidate').toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'candidate';
            candidateId = `${namePart}_${Date.now().toString(36)}`;
            profile.candidateId = candidateId;
        }

        // Merge basic normalized fields for storage
        const now = new Date().toISOString();
        const candidateProfile = {
            ...profile,
            candidateId,
            candidateName: profile.candidateName || profile.name || 'Candidate',
            updatedAt: now,
            createdAt: profile.createdAt || now
        };

        const fileName = `candidate_${candidateId}.json`;
        const filePath = path.join(candidatesDir, fileName);

        // Require MongoDB for uploads — do NOT store uploaded profiles on disk
        if (!candidatesCollection) {
            console.warn('Upload attempted but MongoDB not configured/connected. Rejecting upload.');
            return res.status(503).json({ success: false, error: 'Server not configured to accept uploads: MongoDB not available' });
        }

        try {
            await candidatesCollection.updateOne({ candidateId }, { $set: candidateProfile }, { upsert: true });
            console.log(`✅ Uploaded candidate profile upserted to MongoDB: ${candidateId}`);
            return res.json({ success: true, message: 'Profile uploaded and saved to MongoDB', candidateId });
        } catch (err) {
            console.error('Failed to upsert uploaded profile to MongoDB:', err);
            return res.status(500).json({ success: false, error: 'Failed to save profile to MongoDB' });
        }

    } catch (error) {
        console.error('Error uploading candidate profile:', error);
        res.status(500).json({ success: false, error: 'Failed to upload candidate profile' });
    }
});

// Load candidate profile by ID
app.get('/api/candidate/load/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        const fileName = `candidate_${candidateId}.json`;
        const filePath = path.join(candidatesDir, fileName);
        // DB-only: require MongoDB to load candidate profile
        if (!candidatesCollection) {
            console.warn('Attempted to load candidate profile but MongoDB candidates collection is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to load candidate profiles: MongoDB not available' });
        }

        try {
            const doc = await candidatesCollection.findOne({ candidateId: candidateId });
            if (!doc) return res.status(404).json({ success: false, error: 'Candidate profile not found' });
            const { _id, ...rest } = doc;
            return res.json({ success: true, profile: rest });
        } catch (err) {
            console.error('Error loading candidate profile from DB:', err);
            return res.status(500).json({ success: false, error: 'Failed to load candidate profile' });
        }

    } catch (error) {
        console.error('Error loading candidate profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load candidate profile'
        });
    }
});

// Get all candidate profiles
app.get('/api/candidate/list', async (req, res) => {
    try {
        if (!candidatesCollection) {
            console.warn('Attempted to list candidate profiles but DB is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to list candidate profiles: MongoDB not available' });
        }

        const cursor = candidatesCollection.find({});
        const docs = await cursor.toArray();
        const candidates = docs.map(d => ({
            candidateId: d.candidateId,
            candidateName: d.candidateName,
            position: d.position,
            skills: d.skills,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
        })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json({ success: true, count: candidates.length, candidates });
    } catch (error) {
        console.error('Error fetching candidates from DB:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch candidate profiles' });
    }
});

// Delete candidate profile
app.delete('/api/candidate/delete/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        if (!candidatesCollection) {
            console.warn('Attempted to delete candidate profile but DB is not available. Rejecting to avoid filesystem fallback.');
            return res.status(503).json({ success: false, error: 'Server not configured to delete candidate profiles: MongoDB not available' });
        }

        const result = await candidatesCollection.deleteOne({ candidateId });
        if (!result || result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: 'Candidate profile not found' });
        }

        res.json({ success: true, message: 'Candidate profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting candidate profile from DB:', error);
        res.status(500).json({ success: false, error: 'Failed to delete candidate profile' });
    }
});

// NOTE: server is started via startServer() above
