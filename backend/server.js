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
            
            // Extract Q&A pairs from conversation
            const qaList = [];
            for (let i = 2; i < conversation.length; i += 2) {
                if (conversation[i] && conversation[i + 1]) {
                    qaList.push({
                        question: conversation[i - 1]?.content || '',
                        answer: conversation[i]?.content || '',
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
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
                conversation: qaList,
                fullTranscript: conversation.slice(1).map((msg, idx) => ({
                    sequence: idx + 1,
                    role: msg.role === 'assistant' ? 'AI Interviewer' : 'Candidate',
                    message: msg.content,
                    timestamp: new Date().toISOString()
                })),
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

app.listen(port, () => {
    console.log(`🚀 AI Interviewer Backend running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/api/health`);
    console.log(`📁 Results saved to: ${resultsDir}`);
});
