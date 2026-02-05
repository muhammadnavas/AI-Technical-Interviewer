import crypto from 'crypto';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';

// curl -X POST http://localhost:5000/api/sessions/create-mock

// Load environment variables
dotenv.config();

// Initialize OpenAI for generating coding questions
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Helper function to generate secure access token
const generateAccessToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to generate coding assessment for a candidate (proper format)
async function generateCodingAssessmentForCandidate(profile) {
  if (!openai) return getDefaultCodingAssessment();

  try {
    const prompt = `You are an expert coding-question writer. Given the following candidate profile, create a codingAssessment object with 2-3 coding questions in the exact format specified. Return ONLY valid JSON.

Candidate Profile:
Name: ${profile.candidateName}
Position: ${profile.position || 'Full Stack Developer'}
Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
Projects: ${profile.projectDetails || 'N/A'}
Experience: ${profile.experience || 'N/A'}

Required Format:
{
  "questions": [
    {
      "id": "unique-id",
      "title": "Question Title",
      "prompt": "Clear description of what to implement",
      "signature": "function functionName(parameters)",
      "language": "javascript",
      "languageHints": ["javascript", "python"],
      "sampleTests": [
        {
          "input": "actual input value",
          "expected": "expected output value"
        }
      ],
      "hiddenTests": [
        {
          "input": "hidden test input",
          "expected": "hidden test expected"
        }
      ]
    }
  ]
}

Requirements:
- Create 2-3 practical coding questions appropriate for the candidate's level
- Include clear function signatures for each question
- Provide at least 2 sample tests and 2 hidden tests per question
- Use realistic input/output examples
- Return ONLY the JSON object`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a senior engineer who writes comprehensive coding assessments.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 2000
    });

    let content = completion.choices[0].message.content.trim();
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const assessment = JSON.parse(content);
      if (assessment && Array.isArray(assessment.questions) && assessment.questions.length > 0) {
        return assessment;
      }
    } catch (err) {
      console.warn('Failed to parse AI-generated coding assessment, using fallback');
    }

    return getDefaultCodingAssessment();
  } catch (error) {
    console.error('Error generating coding assessment:', error);
    return getDefaultCodingAssessment();
  }
}

// Default coding assessment fallback (proper format)
function getDefaultCodingAssessment() {
  return {
    questions: [
      {
        id: "array-sum",
        title: "Array Sum",
        prompt: "Write a function that calculates the sum of all numeric elements in an array, ignoring non-numeric values.",
        signature: "function sumArray(arr)",
        language: "javascript",
        languageHints: ["javascript", "python"],
        sampleTests: [
          {
            input: [1, 2, 3, 4],
            expected: 10
          },
          {
            input: [1, "hello", 3, null, 5],
            expected: 9
          }
        ],
        hiddenTests: [
          {
            input: [],
            expected: 0
          },
          {
            input: ["a", "b", "c"],
            expected: 0
          }
        ]
      },
      {
        id: "string-reverse",
        title: "Reverse String",
        prompt: "Write a function that reverses a string without using built-in reverse methods.",
        signature: "function reverseString(str)",
        language: "javascript", 
        languageHints: ["javascript", "python"],
        sampleTests: [
          {
            input: "hello",
            expected: "olleh"
          },
          {
            input: "world",
            expected: "dlrow"
          }
        ],
        hiddenTests: [
          {
            input: "",
            expected: ""
          },
          {
            input: "a",
            expected: "a"
          }
        ]
      }
    ]
  };
}

// Convert codingAssessment format to tasks format for the code editor
function convertCodingAssessmentToTasks(codingAssessment) {
  try {
    if (!codingAssessment || !Array.isArray(codingAssessment.questions)) return [];
    
    const tasks = codingAssessment.questions.map(q => {
      const sample = Array.isArray(q.sampleTests) && q.sampleTests.length > 0 ? q.sampleTests[0] : null;
      const exampleInputOutput = sample ? { input: sample.input, output: sample.expected } : null;
      const tests = [];
      
      if (Array.isArray(q.sampleTests)) {
        q.sampleTests.forEach((t, i) => tests.push(`${q.id || i}-sample: input=${JSON.stringify(t.input)} expected=${JSON.stringify(t.expected)}`));
      }
      if (Array.isArray(q.hiddenTests)) {
        q.hiddenTests.forEach((t, i) => tests.push(`${q.id || 'hidden'}-hidden: input=${JSON.stringify(t.input)} expected=${JSON.stringify(t.expected)}`));
      }

      return {
        id: q.id || (q.title || '').toLowerCase().replace(/\s+/g, '_'),
        title: q.title || q.id || 'Coding Task',
        description: (q.prompt ? q.prompt + '\n\n' : '') + (q.signature || ''),
        languageHints: q.language ? [q.language] : (q.languageHints || []),
        exampleInputOutput,
        tests
      };
    });
    
    return tasks;
  } catch (err) {
    console.warn('Failed to convert codingAssessment to tasks:', err.message);
    return [];
  }
}

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
    
    // Define candidate profile for coding question generation
    const candidateProfile = {
      candidateName: 'John Doe (Test Candidate)',
      candidateEmail: 'john.doe.test@example.com',
      phoneNumber: '+1-555-0123',
      companyName: 'Test Company Inc',
      role: 'Senior Full Stack Developer',
      techStack: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
      experience: '5 years',
      position: 'Senior Full Stack Developer',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
      projectDetails: 'Built scalable web applications using React and Node.js, with experience in database design and API development'
    };

    // Generate coding assessment questions
    console.log('🧠 Generating coding assessment questions...');
    const codingAssessment = await generateCodingAssessmentForCandidate(candidateProfile);
    const codingTasks = convertCodingAssessmentToTasks(codingAssessment);
    console.log(`✅ Generated ${codingAssessment.questions.length} coding questions`);
    
    // Add coding assessment to candidate profile
    candidateProfile.codingAssessment = codingAssessment;
    
    // Create mock session document
    const sessionDoc = {
      sessionId,
      candidateId: mockCandidateId,
      applicationId: mockApplicationId,
      jobId: mockJobId,
      recruiterId: mockRecruiterId,
      candidateDetails: candidateProfile,
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
        codingTasks: codingTasks, // Include generated coding tasks
        metadata: {
          startTime: null,
          endTime: null,
          questionsAsked: 0,
          answersReceived: 0,
          codingTestsCompleted: 0,
          totalCodingTasks: codingTasks.length
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
    
    // Also save coding assessment to the separate collection for consistency
    try {
      await db.collection('codequestions').insertOne({
        candidateId: mockCandidateId.toString(),
        sessionId: sessionId,
        tasks: codingTasks,
        codingAssessment: codingAssessment, // Store both formats
        createdAt: now,
        updatedAt: now
      });
      console.log('✅ Coding assessment saved to codequestions collection');
    } catch (err) {
      console.warn('⚠️  Failed to save coding assessment to separate collection:', err.message);
    }
    
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
    console.log(`   📝 Coding Questions Generated: ${codingAssessment.questions.length}`);
    
    // Display coding assessment summary
    console.log('🧩 Generated Coding Assessment:');
    codingAssessment.questions.forEach((question, index) => {
      console.log(`   ${index + 1}. ${question.title} (${question.id})`);
      console.log(`      ${question.prompt.substring(0, 100)}...`);
      console.log(`      Language: ${question.language}, Sample Tests: ${question.sampleTests.length}, Hidden Tests: ${question.hiddenTests.length}`);
    });
    
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