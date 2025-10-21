/**
 * Test Script for Candidate Profile Management System
 * 
 * This script demonstrates how to:
 * 1. Save a candidate profile
 * 2. Load a candidate profile
 * 3. List all candidates
 * 4. Start an interview with a saved profile
 */

const API_BASE = 'http://localhost:5000/api';

// Test data for a new candidate
const newCandidate = {
    candidateId: 'TEST001',
    candidateName: 'John Doe',
    position: 'Full Stack Developer',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    projectDetails: `
Project 1: Social Media Platform
- Built a full-stack social media application using MERN stack
- Implemented real-time messaging with Socket.io
- Used Redis for caching and session management
- Deployed on AWS with CI/CD pipeline

Project 2: E-Learning Platform
- Created a course management system with video streaming
- Integrated payment gateway (Stripe)
- Built admin dashboard for content management
- Used Next.js for SSR and better SEO
    `.trim(),
    customQuestions: [
        'Explain the difference between TypeScript and JavaScript',
        'How do you handle state management in large React applications?',
        'What is your experience with microservices architecture?',
        'Explain how you would optimize database queries'
    ],
    githubProjects: `
1. github.com/johndoe/social-platform - Full-stack social media app (MERN, Socket.io, Redis)
2. github.com/johndoe/elearning-system - E-learning platform with video streaming (Next.js, Stripe)
3. github.com/johndoe/task-api - RESTful API for task management (Node.js, Express, PostgreSQL)
4. github.com/johndoe/react-components - Reusable React component library (TypeScript, Storybook)
    `.trim(),
    experience: `
Senior Developer at TechCorp (2022-Present)
- Lead a team of 4 developers
- Built microservices architecture using Node.js
- Migrated legacy PHP application to modern React/Node stack

Junior Developer at StartupXYZ (2020-2022)
- Developed frontend features using React
- Worked on REST API development with Express
- Participated in code reviews and agile ceremonies
    `.trim(),
    education: `
Master of Computer Science
Stanford University
Graduated: 2020
GPA: 3.8/4.0

Bachelor of Engineering in Computer Science
MIT
Graduated: 2018
GPA: 3.9/4.0
    `.trim()
};

async function testSaveCandidate() {
    console.log('🧪 Test 1: Save Candidate Profile');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const response = await fetch(`${API_BASE}/candidate/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCandidate)
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Success!');
            console.log(`   Candidate ID: ${data.candidateId}`);
            console.log(`   File: ${data.fileName}`);
        } else {
            console.log('❌ Failed:', data.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    console.log('');
}

async function testLoadCandidate(candidateId) {
    console.log(`🧪 Test 2: Load Candidate Profile (${candidateId})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const response = await fetch(`${API_BASE}/candidate/load/${candidateId}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Profile Loaded Successfully!');
            console.log(`   Name: ${data.profile.candidateName}`);
            console.log(`   Position: ${data.profile.position}`);
            console.log(`   Skills: ${data.profile.skills.join(', ')}`);
            console.log(`   Projects: ${data.profile.projectDetails.substring(0, 50)}...`);
            console.log(`   Created: ${new Date(data.profile.createdAt).toLocaleString()}`);
        } else {
            console.log('❌ Failed:', data.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    console.log('');
}

async function testListCandidates() {
    console.log('🧪 Test 3: List All Candidates');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const response = await fetch(`${API_BASE}/candidate/list`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Found ${data.count} candidate(s):`);
            console.log('');
            
            data.candidates.forEach((candidate, index) => {
                console.log(`   ${index + 1}. ${candidate.candidateName}`);
                console.log(`      ID: ${candidate.candidateId}`);
                console.log(`      Position: ${candidate.position}`);
                console.log(`      Skills: ${candidate.skills.slice(0, 3).join(', ')}...`);
                console.log(`      Updated: ${new Date(candidate.updatedAt).toLocaleString()}`);
                console.log('');
            });
        } else {
            console.log('❌ Failed:', data.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    console.log('');
}

async function testStartInterviewWithProfile(candidateId) {
    console.log(`🧪 Test 4: Start Interview with Profile (${candidateId})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // First load the profile
        const loadResponse = await fetch(`${API_BASE}/candidate/load/${candidateId}`);
        const loadData = await loadResponse.json();
        
        if (!loadData.success) {
            console.log('❌ Failed to load profile:', loadData.error);
            return;
        }

        const profile = loadData.profile;
        
        // Setup interview with the profile data
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const setupResponse = await fetch(`${API_BASE}/interview/setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId,
                candidateName: profile.candidateName,
                skills: profile.skills,
                projectDetails: `${profile.projectDetails}\n\nGitHub Projects:\n${profile.githubProjects}\n\nExperience:\n${profile.experience}\n\nEducation:\n${profile.education}`,
                customQuestions: profile.customQuestions,
                position: profile.position
            })
        });

        const setupData = await setupResponse.json();
        
        if (setupData.success) {
            console.log('✅ Interview Started Successfully!');
            console.log(`   Session ID: ${sessionId}`);
            console.log(`   Candidate: ${profile.candidateName}`);
            console.log(`   Position: ${profile.position}`);
            console.log('');
            console.log('   AI Initial Message:');
            console.log(`   "${setupData.initialMessage}"`);
        } else {
            console.log('❌ Failed:', setupData.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    console.log('');
}

// Main test execution
async function runAllTests() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  Candidate Profile Management System - Test Suite        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    console.log('📋 Prerequisites:');
    console.log('   • Backend server running on http://localhost:5000');
    console.log('   • OpenAI API key configured');
    console.log('');
    console.log('Starting tests...');
    console.log('');
    
    // Test 1: Save new candidate
    await testSaveCandidate();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    // Test 2: Load the candidate we just saved
    await testLoadCandidate('TEST001');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: List all candidates (should include TEST001 and CAND001)
    await testListCandidates();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Start interview with a saved profile
    await testStartInterviewWithProfile('CAND001');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open http://localhost:5173/candidate-setup');
    console.log('2. Click on a saved candidate from the sidebar');
    console.log('3. Or enter ID "TEST001" or "CAND001" and click Load');
    console.log('4. Click "Start AI Interview" to begin!');
    console.log('');
}

// Check if backend is running before running tests
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Backend is running!');
            console.log('');
            await runAllTests();
        } else {
            console.log('❌ Backend is not responding correctly');
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend!');
        console.log('');
        console.log('Please make sure:');
        console.log('1. Backend is running: cd backend && npm start');
        console.log('2. Server is on http://localhost:5000');
        console.log('');
    }
}

// Run the tests
checkBackend();
