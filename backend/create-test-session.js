// Script to create a test candidate profile and schedule a session for today 9-10 PM
import dotenv from 'dotenv';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || 'test';

async function createCandidateAndSession() {
    let client;
    
    try {
        // Connect to MongoDB
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(dbName);
        const candidatesCollection = db.collection('candidates');
        const scheduledSessionsCollection = db.collection('scheduled_sessions');

        // Load candidate profile
        const profilePath = path.join(__dirname, 'candidate-profiles', 'test_candidate_001.json');
        const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

        // Upload candidate profile
        console.log('📝 Uploading candidate profile...');
        await candidatesCollection.updateOne(
            { candidateId: profileData.candidateId },
            { $set: profileData },
            { upsert: true }
        );
        console.log('✅ Candidate profile uploaded:', profileData.candidateId);

        // Create scheduled session for today 9-10 PM
        const today = new Date();
        const startTime = new Date(today);
        startTime.setHours(21, 0, 0, 0); // 9:00 PM
        
        const endTime = new Date(today);
        endTime.setHours(22, 0, 0, 0); // 10:00 PM

        // If it's already past 9 PM today, schedule for tomorrow
        if (new Date() > startTime) {
            startTime.setDate(startTime.getDate() + 1);
            endTime.setDate(endTime.getDate() + 1);
            console.log('⏰ Current time is past 9 PM today, scheduling for tomorrow');
        }

        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const scheduledSession = {
            sessionId,
            candidateId: profileData.candidateId,
            candidateName: profileData.candidateName,
            position: profileData.position,
            interviewerName: 'AI Interviewer',
            startTime: startTime,
            endTime: endTime,
            duration: 60, // 60 minutes
            status: 'scheduled',
            accessAttempts: 0,
            maxAccessAttempts: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
            
            interviewConfig: {
                skills: profileData.skills || [],
                experienceLevel: 'intermediate',
                focusAreas: ['technical', 'problem-solving', 'coding'],
                allowCodeEditor: true,
                customQuestions: profileData.customQuestions || []
            },
            
            metadata: {
                timeZone: 'UTC',
                language: 'en',
                recordingEnabled: true,
                notes: 'Test session created for demonstration'
            }
        };

        console.log('📅 Creating scheduled session...');
        await scheduledSessionsCollection.insertOne(scheduledSession);
        
        console.log('✅ Scheduled session created successfully!');
        console.log('\n📋 Session Details:');
        console.log('   Session ID:', sessionId);
        console.log('   Candidate ID:', profileData.candidateId);
        console.log('   Candidate Name:', profileData.candidateName);
        console.log('   Position:', profileData.position);
        console.log('   Start Time:', startTime.toLocaleString());
        console.log('   End Time:', endTime.toLocaleString());
        console.log('   Duration:', scheduledSession.duration, 'minutes');
        console.log('   Status:', scheduledSession.status);
        
        console.log('\n🔗 Access Information:');
        console.log('   Access URL: http://localhost:5173?candidateId=' + profileData.candidateId);
        console.log('   Or use Candidate ID directly in the frontend:', profileData.candidateId);
        
        console.log('\n📊 Admin Panel:');
        console.log('   View all sessions: http://localhost:5173/admin/schedule');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

// Run the script
createCandidateAndSession();