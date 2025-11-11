import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import InterviewSession from './models/InterviewSession.js';

dotenv.config();

// Use the same connection as the backend server
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || 'test';

console.log('🔌 Connecting to:', mongoUri);
console.log('📦 Database:', dbName);

mongoose.connect(mongoUri, { dbName })
.then(async () => {
  console.log('✅ Connected to MongoDB (same as backend server)');
  console.log('🔄 Creating new 2-day accessible session for Navas...');

  // First, delete any existing sessions for this candidate
  const deletedCount = await InterviewSession.deleteMany({
    candidateId: new ObjectId('68f909508b0f083d6bf39efd')
  });
  console.log(`🗑️ Deleted ${deletedCount.deletedCount} old sessions for Navas`);

  const now = new Date();
  const accessStart = new Date(now.getTime() - (15 * 60000)); // Started 15 minutes ago
  const scheduledEnd = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days from now
  const accessEnd = new Date(scheduledEnd.getTime() + (15 * 60000)); // 15 minutes after scheduled end

  const sessionId = `navas_2day_${Date.now()}_${Math.random().toString(16).slice(2, 18)}`;

  const session = new InterviewSession({
    sessionId,
    candidateId: new ObjectId('68f909508b0f083d6bf39efd'),
    applicationId: new ObjectId('68f909508b0f083d6bf39efd'), // Using same ID for simplicity
    jobId: new ObjectId('68f909508b0f083d6bf39efd'), // Using same ID for simplicity
    recruiterId: new ObjectId('68f909508b0f083d6bf39efd'), // Using same ID for simplicity
    candidateDetails: {
      candidateName: 'Navas',
      candidateEmail: 'navas@example.com',
      phoneNumber: '+1234567890',
      companyName: 'Tech Corp',
      role: 'Full Stack Developer',
      techStack: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'Express.js'],
      experience: '2-3 years'
    },
    sessionConfig: {
      scheduledStartTime: accessStart,
      scheduledEndTime: scheduledEnd,
      timeZone: 'UTC',
      duration: 2880, // 48 hours in minutes
      accessWindow: {
        beforeStart: 15,
        afterEnd: 15
      }
    },
    security: {
      accessToken: 'navas-test-token-2day-access',
      maxLoginAttempts: 10,
      loginAttempts: 0
    },
    sessionStatus: 'scheduled', // This is key - must be 'scheduled' not 'completed'
    accessControl: {
      isActive: false,
      candidateJoinedAt: null,
      candidateLeftAt: null,
      totalTimeSpent: 0,
      lastActivityAt: new Date()
    },
    interviewData: {
      conversationHistory: [],
      candidateResponses: [],
      metadata: {
        createdAt: new Date(),
        dataSource: 'manual_creation'
      },
      results: {
        overallScore: null,
        feedback: '',
        recommendations: [],
        technicalAssessment: {},
        behavioralAssessment: {}
      }
    }
  });

  await session.save();

  console.log('✅ Created new session for Navas in the correct database:');
  console.log(`📋 Session ID: ${sessionId}`);
  console.log(`🔑 Access Token: navas-test-token-2day-access`);
  console.log(`🆔 Candidate ID: 68f909508b0f083d6bf39efd`);
  console.log(`📅 Access Period: ${accessStart.toLocaleString()} - ${accessEnd.toLocaleString()}`);
  console.log(`✨ Status: ${session.sessionStatus}`);
  console.log(`⏰ Duration: 2 days (${session.sessionConfig.duration} minutes)`);
  
  // Verify the session can be found using the same query as the backend
  const foundSession = await InterviewSession.findOne({
    candidateId: new ObjectId('68f909508b0f083d6bf39efd'),
    sessionStatus: { $in: ['scheduled', 'active'] }
  });
  
  console.log('\n🔍 Verification (using backend query):');
  console.log(`Session found by candidateId lookup: ${!!foundSession}`);
  if (foundSession) {
    console.log(`Found session: ${foundSession.sessionId}, status: ${foundSession.sessionStatus}`);
  }

  // Double check - list all sessions in this database
  const allSessions = await InterviewSession.find({}).limit(5);
  console.log(`\n📊 Total sessions in database: ${allSessions.length}`);
  allSessions.forEach(s => {
    console.log(`- ${s.sessionId}: candidateId=${s.candidateId}, status=${s.sessionStatus}`);
  });

  mongoose.disconnect();
})
.catch(err => {
  console.error('❌ Error:', err);
  mongoose.disconnect();
});