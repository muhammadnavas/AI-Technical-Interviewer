// Complete interview simulation with automatic save
// This script will conduct a full interview and save results

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read mock candidate data
const mockCandidate = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'mock-candidate.json'), 'utf8')
);

const API_BASE = 'http://localhost:5000/api';

// Sample answers for the mock candidate
const sampleAnswers = [
    "I'm Priya Sharma, a B.Tech Computer Science student graduating in May 2026 from Mumbai University with an 8.5 CGPA. I've built 5 projects using technologies like React, Node.js, MongoDB, and Firebase.",
    
    "In my e-commerce project, I used React for the frontend with Tailwind CSS for styling. I implemented features like shopping cart, product filtering, checkout process, and a dark mode toggle. I used local storage to persist the cart data.",
    
    "I've used React hooks extensively. useState helps manage component state like form inputs and UI states. useEffect is great for side effects like fetching data from APIs. In my weather dashboard, I used useEffect to call the OpenWeather API when the component mounted.",
    
    "The main difference is that let and const are block-scoped while var is function-scoped. const creates a constant reference that cannot be reassigned, while let allows reassignment. I prefer using const by default and let only when I need to reassign.",
    
    "My chat application was the most complex project. I used Firebase Realtime Database to sync messages instantly across all connected clients. I implemented user authentication with Firebase Auth, created multiple chat rooms, and added features like online/offline status indicators."
];

async function runCompleteInterview() {
    console.log('\n🎬 Starting Complete Interview Simulation\n');
    console.log('═'.repeat(80));

    try {
        // Step 1: Initialize Interview
        console.log('\n📋 Step 1: Initializing Interview Session...\n');
        
        const setupResponse = await fetch(`${API_BASE}/interview/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: mockCandidate.sessionId,
                candidateName: mockCandidate.candidateName,
                position: mockCandidate.position,
                skills: mockCandidate.skills,
                projectDetails: mockCandidate.projectDetails,
                customQuestions: mockCandidate.customQuestions
            })
        });

        const setupData = await setupResponse.json();
        
        if (!setupData.success) {
            throw new Error('Failed to initialize interview');
        }

        console.log('✅ Interview Initialized');
        console.log('Candidate:', mockCandidate.candidateName);
        console.log('Position:', mockCandidate.position);
        console.log('\n🤖 AI Interviewer:');
        console.log(`"${setupData.initialMessage}"\n`);
        console.log('─'.repeat(80));

        // Step 2: Conduct Interview (5 Q&A exchanges)
        console.log('\n💬 Step 2: Conducting Interview...\n');

        for (let i = 0; i < sampleAnswers.length; i++) {
            console.log(`\n[Q&A ${i + 1}/${sampleAnswers.length}]`);
            console.log('\n👤 Candidate:');
            console.log(`"${sampleAnswers[i]}"\n`);

            console.log('⏳ AI is processing...');

            const messageResponse = await fetch(`${API_BASE}/interview/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: mockCandidate.sessionId,
                    message: sampleAnswers[i]
                })
            });

            const messageData = await messageResponse.json();

            if (messageData.success) {
                console.log('\n🤖 AI Interviewer:');
                console.log(`"${messageData.response}"\n`);
                console.log('─'.repeat(80));
            }

            // Small delay to simulate natural conversation
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Step 3: End Interview and Save Results
        console.log('\n💾 Step 3: Ending Interview and Saving Results...\n');

        const endResponse = await fetch(`${API_BASE}/interview/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: mockCandidate.sessionId
            })
        });

        const endData = await endResponse.json();

        if (endData.success) {
            console.log('✅ Interview Completed Successfully!\n');
            console.log('═'.repeat(80));
            console.log('📊 INTERVIEW SUMMARY');
            console.log('═'.repeat(80));
            console.log('\nCandidate:', endData.summary.candidateName);
            console.log('Duration:', endData.summary.duration);
            console.log('Questions Asked:', endData.summary.questionsAsked);
            console.log('\n📁 Results Saved To:');
            console.log(`   ${endData.fileName}`);
            console.log('\n📍 Full Path:');
            console.log(`   ${endData.filePath}`);
            console.log('\n' + '═'.repeat(80));
            console.log('\n💡 To view results:');
            console.log(`   node view-results.js "${endData.fileName}"`);
            console.log('\n   Or view all results:');
            console.log('   node view-results.js\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n⚠️  Make sure the backend server is running:');
        console.log('   cd backend && npm start\n');
    }
}

// Run the simulation
runCompleteInterview();
