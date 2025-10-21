import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Store conversation history for each session
const conversationSessions = new Map();

// Store interview metadata
const interviewMetadata = new Map();

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

// Interview setup endpoint
app.post('/api/interview/setup', async (req, res) => {
    try {
        const { 
            sessionId,
            candidateName, 
            skills, 
            projectDetails, 
            customQuestions,
            position = "Full Stack Developer"
        } = req.body;

        // Create system prompt with candidate context
        const systemPrompt = `You are an expert technical interviewer conducting an interview for a ${position} position.

Candidate Information:
- Name: ${candidateName}
- Skills: ${skills.join(', ')}
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
            totalAnswers: 0
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
        conversation.push({
            role: 'user',
            content: message
        });

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
        const metadata = interviewMetadata.get(sessionId);
        if (metadata) {
            metadata.totalQuestions++;
            metadata.totalAnswers++;
            interviewMetadata.set(sessionId, metadata);
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
            
            // Save to file
            const fileName = `interview_${metadata.candidateName.replace(/\s+/g, '_')}_${Date.now()}.json`;
            const filePath = path.join(resultsDir, fileName);
            
            fs.writeFileSync(filePath, JSON.stringify(interviewResult, null, 2));
            
            console.log(`✅ Interview saved: ${fileName}`);
            
            // Delete session from memory
            conversationSessions.delete(sessionId);
            interviewMetadata.delete(sessionId);

            res.json({
                success: true,
                message: 'Interview session ended and saved',
                filePath: filePath,
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

// Get all saved interview results
app.get('/api/interview/results', (req, res) => {
    try {
        const files = fs.readdirSync(resultsDir);
        const results = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(resultsDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return {
                    fileName: file,
                    candidateName: data.candidateInfo.name,
                    position: data.candidateInfo.position,
                    date: data.savedAt,
                    duration: data.interviewDetails.duration,
                    questionsAsked: data.interviewDetails.totalQuestions
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch interview results'
        });
    }
});

// Get specific interview result
app.get('/api/interview/results/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(resultsDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Interview result not found'
            });
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch interview result'
        });
    }
});

// ============================================
// CANDIDATE PROFILE MANAGEMENT ENDPOINTS
// ============================================

// Save candidate profile
app.post('/api/candidate/save', (req, res) => {
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

        // Create candidate profile object
        const candidateProfile = {
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

        // Save to file
        const fileName = `candidate_${candidateId}.json`;
        const filePath = path.join(candidatesDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(candidateProfile, null, 2));
        
        console.log(`✅ Candidate profile saved: ${fileName}`);

        res.json({
            success: true,
            message: 'Candidate profile saved successfully',
            candidateId: candidateId,
            fileName: fileName
        });

    } catch (error) {
        console.error('Error saving candidate profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save candidate profile'
        });
    }
});

// Load candidate profile by ID
app.get('/api/candidate/load/:candidateId', (req, res) => {
    try {
        const { candidateId } = req.params;
        const fileName = `candidate_${candidateId}.json`;
        const filePath = path.join(candidatesDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Candidate profile not found'
            });
        }

        const profile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        res.json({
            success: true,
            profile: profile
        });

    } catch (error) {
        console.error('Error loading candidate profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load candidate profile'
        });
    }
});

// Get all candidate profiles
app.get('/api/candidate/list', (req, res) => {
    try {
        const files = fs.readdirSync(candidatesDir);
        const candidates = files
            .filter(file => file.startsWith('candidate_') && file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(candidatesDir, file);
                const profile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return {
                    candidateId: profile.candidateId,
                    candidateName: profile.candidateName,
                    position: profile.position,
                    skills: profile.skills,
                    createdAt: profile.createdAt,
                    updatedAt: profile.updatedAt
                };
            })
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json({
            success: true,
            count: candidates.length,
            candidates: candidates
        });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch candidate profiles'
        });
    }
});

// Delete candidate profile
app.delete('/api/candidate/delete/:candidateId', (req, res) => {
    try {
        const { candidateId } = req.params;
        const fileName = `candidate_${candidateId}.json`;
        const filePath = path.join(candidatesDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Candidate profile not found'
            });
        }

        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            message: 'Candidate profile deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting candidate profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete candidate profile'
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 AI Interviewer Backend running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/api/health`);
    console.log(`📁 Results saved to: ${resultsDir}`);
    console.log(`👤 Candidate profiles saved to: ${candidatesDir}`);
});
