import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';

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
        
        if (conversation) {
            // Delete session
            conversationSessions.delete(sessionId);
        }

        res.json({
            success: true,
            message: 'Interview session ended'
        });

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

app.listen(port, () => {
    console.log(`🚀 AI Interviewer Backend running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/api/health`);
});
