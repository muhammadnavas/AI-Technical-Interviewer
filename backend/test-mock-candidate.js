// Test script to initialize AI interview with mock candidate data
// Run this with: node test-mock-candidate.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read mock candidate data
const mockCandidate = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'mock-candidate.json'), 'utf8')
);

// Prepare data for API
const setupData = {
    sessionId: mockCandidate.sessionId,
    candidateName: mockCandidate.candidateName,
    position: mockCandidate.position,
    skills: mockCandidate.skills,
    projectDetails: mockCandidate.projectDetails,
    customQuestions: mockCandidate.customQuestions
};

// Initialize interview session
async function initializeMockInterview() {
    try {
        console.log('🚀 Initializing AI Interview with Mock Candidate...\n');
        console.log('📋 Candidate Details:');
        console.log(`   Name: ${mockCandidate.candidateName}`);
        console.log(`   Position: ${mockCandidate.position}`);
        console.log(`   Skills: ${mockCandidate.skills.slice(0, 5).join(', ')}...`);
        console.log(`   Experience: ${mockCandidate.metadata.experience}`);
        console.log(`   Education: ${mockCandidate.metadata.education}\n`);

        const response = await fetch('http://localhost:5000/api/interview/setup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(setupData)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Interview Session Initialized Successfully!\n');
            console.log('🤖 AI Interviewer says:');
            console.log(`   "${data.initialMessage}"\n`);
            console.log('📝 Session ID:', mockCandidate.sessionId);
            console.log('\n💡 Next Steps:');
            console.log('   1. Open frontend: http://localhost:5174');
            console.log('   2. Or test with: node test-conversation.js');
            console.log('\n📊 Interview Configuration:');
            console.log(`   Focus Areas: ${mockCandidate.interviewPreferences.focusAreas.join(', ')}`);
            console.log(`   Difficulty: ${mockCandidate.interviewPreferences.difficultyLevel}`);
            console.log(`   Duration: ${mockCandidate.interviewPreferences.estimatedDuration}`);
        } else {
            console.error('❌ Failed to initialize interview:', data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n⚠️  Make sure backend server is running on port 5000');
        console.log('   Run: cd backend && npm start');
    }
}

// Run the initialization
initializeMockInterview();
