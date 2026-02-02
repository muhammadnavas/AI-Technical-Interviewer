import crypto from 'crypto';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';


// curl -X POST http://localhost:5000/api/sessions/create-mock

// Load environment variables
dotenv.config();

// Helper function to generate secure access token
const generateAccessToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

async function createMockSession() {
  console.log('🚀 Creating mock interview session...');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGO_DB_NAME || 'ai_interviewer';
    
    console.log(`📡 Connecting to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')} DB: ${dbName}`);
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);
    
    // Generate current time + 5 minutes for session start (to test immediately)
    const now = new Date();
    const scheduledStartTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
    const scheduledEndTime = new Date(scheduledStartTime.getTime() + 60 * 60000); // 1 hour duration
    
    // Generate unique IDs
    const sessionId = `mock_interview_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const accessToken = generateAccessToken();
    const mockCandidateId = new ObjectId();
    const mockApplicationId = new ObjectId();
    const mockJobId = new ObjectId();
    const mockRecruiterId = new ObjectId();
    
    // Create mock session document
    const sessionDoc = {
      sessionId,
      candidateId: mockCandidateId,
      applicationId: mockApplicationId,
      jobId: mockJobId,
      recruiterId: mockRecruiterId,
      candidateDetails: {
        candidateName: 'John Doe (Test Candidate)',
        candidateEmail: 'john.doe.test@example.com',
        phoneNumber: '+1-555-0123',
        companyName: 'Test Company Inc',
        role: 'Senior Full Stack Developer',
        techStack: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
        experience: '5 years'
      },
      sessionConfig: {
        scheduledStartTime,
        scheduledEndTime,
        timeZone: 'UTC',
        duration: 60,
        accessWindow: {
          beforeStart: 15,
          afterEnd: 15
        }
      },
      sessionStatus: 'scheduled',
      accessControl: {
        isActive: false,
        accessStartTime: null,
        accessEndTime: null,
        candidateJoinedAt: null,
        candidateLeftAt: null,
        totalTimeSpent: null
      },
      interviewData: {
        conversationHistory: [],
        metadata: {
          startTime: null,
          endTime: null,
          questionsAsked: 0,
          answersReceived: 0,
          codingTestsCompleted: 0
        },
        results: {
          fileName: null,
          savedAt: null,
          resultSummary: null
        }
      },
      security: {
        accessToken,
        maxLoginAttempts: 3,
        loginAttempts: 0,
        lastLoginAttempt: null
      },
      notifications: {
        emailSent: false,
        remindersSent: [],
        confirmationSentAt: null
      },
      createdAt: now,
      updatedAt: now
    };
    
    // Insert session into database
    const result = await db.collection('interviewsessions').insertOne(sessionDoc);
    
    // Create test access URL
    const accessUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}?sessionId=${sessionId}&accessToken=${accessToken}`;
    
    console.log('✅ Mock interview session created successfully!');
    console.log('📋 Session Details:');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Access Token: ${accessToken}`);
    console.log(`   Candidate: ${sessionDoc.candidateDetails.candidateName}`);
    console.log(`   Role: ${sessionDoc.candidateDetails.role}`);
    console.log(`   Scheduled Start: ${scheduledStartTime.toISOString()}`);
    console.log(`   Scheduled End: ${scheduledEndTime.toISOString()}`);
    console.log(`   Duration: 60 minutes`);
    console.log(`   Time Until Session: ${Math.round((scheduledStartTime.getTime() - now.getTime()) / 60000)} minutes`);
    console.log('🔗 Access URL:');
    console.log(`   ${accessUrl}`);
    console.log('');
    console.log('🧪 Testing Instructions:');
    console.log('   1. Start your frontend server: npm run dev');
    console.log('   2. Open the access URL in your browser');
    console.log('   3. The session will be accessible in ~5 minutes');
    console.log('   4. Use the access token when prompted');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error creating mock session:', error);
    process.exit(1);
  }
}

// Run the script
createMockSession().then(() => {
  console.log('🎉 Mock session creation complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Failed to create mock session:', error);
  process.exit(1);
});