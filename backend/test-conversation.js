// Test script to have a conversation with AI interviewer
// Run this after initializing with test-mock-candidate.js
// Usage: node test-conversation.js

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read mock candidate data
const mockCandidate = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'mock-candidate.json'), 'utf8')
);

const sessionId = mockCandidate.sessionId;

// Create readline interface for terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Send message to AI
async function sendMessage(message) {
    try {
        const response = await fetch('http://localhost:5000/api/interview/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: sessionId,
                message: message
            })
        });

        const data = await response.json();

        if (data.success) {
            return data.response;
        } else {
            throw new Error(data.error || 'Failed to get response');
        }
    } catch (error) {
        throw error;
    }
}

// Main conversation loop
async function startConversation() {
    console.log('🎤 AI Interview Conversation Simulator\n');
    console.log('📋 Interview Session:', mockCandidate.candidateName);
    console.log('💼 Position:', mockCandidate.position);
    console.log('\n💡 Commands:');
    console.log('   - Type your answer and press Enter');
    console.log('   - Type "exit" to end interview');
    console.log('   - Type "help" for sample answers\n');
    console.log('─'.repeat(60));

    // Initialize interview first
    try {
        const setupResponse = await fetch('http://localhost:5000/api/interview/setup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: sessionId,
                candidateName: mockCandidate.candidateName,
                position: mockCandidate.position,
                skills: mockCandidate.skills,
                projectDetails: mockCandidate.projectDetails,
                customQuestions: mockCandidate.customQuestions
            })
        });

        const setupData = await setupResponse.json();
        
        if (setupData.success) {
            console.log('\n🤖 AI Interviewer:');
            console.log(`   ${setupData.initialMessage}\n`);
            console.log('─'.repeat(60));
        }
    } catch (error) {
        console.error('❌ Failed to initialize interview:', error.message);
        console.log('⚠️  Make sure backend is running: cd backend && npm start');
        rl.close();
        return;
    }

    // Conversation loop
    const askQuestion = () => {
        rl.question('\n👤 Your Answer: ', async (answer) => {
            if (answer.toLowerCase() === 'exit') {
                console.log('\n👋 Ending interview session...');
                
                // End interview on backend
                try {
                    await fetch('http://localhost:5000/api/interview/end', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId })
                    });
                    console.log('✅ Interview session ended successfully!');
                } catch (error) {
                    console.error('❌ Error ending session:', error.message);
                }
                
                rl.close();
                return;
            }

            if (answer.toLowerCase() === 'help') {
                console.log('\n📝 Sample Answers (based on mock candidate):');
                console.log('\nFor React question:');
                console.log('   "I used React hooks like useState and useEffect in my projects.');
                console.log('   In my task management app, I used useState to manage task data');
                console.log('   and useEffect to fetch tasks from MongoDB on component mount."');
                console.log('\nFor project question:');
                console.log('   "My most complex project was the chat application using React');
                console.log('   and Firebase. I implemented real-time messaging, user authentication,');
                console.log('   and handled online/offline status with Firebase Realtime Database."');
                askQuestion();
                return;
            }

            if (!answer.trim()) {
                console.log('⚠️  Please provide an answer or type "exit" to quit');
                askQuestion();
                return;
            }

            try {
                console.log('\n⏳ AI is thinking...');
                const aiResponse = await sendMessage(answer);
                console.log('\n🤖 AI Interviewer:');
                console.log(`   ${aiResponse}\n`);
                console.log('─'.repeat(60));
                askQuestion();
            } catch (error) {
                console.error('\n❌ Error:', error.message);
                console.log('⚠️  Make sure backend is running on port 5000\n');
                askQuestion();
            }
        });
    };

    askQuestion();
}

// Start the conversation
startConversation();
