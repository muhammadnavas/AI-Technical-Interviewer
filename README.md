# AI Technical Interviewer

A comprehensive AI-powered technical interview platform that conducts real-time interviews with candidates, featuring voice interaction, code assessment, behavioral monitoring, and automated result generation for recruiters.

## 🚀 Live Demo

Experience the platform with our live demo applications:

| Platform | Description | Demo | GitHub |
|----------|-------------|------|--------|
| 🏢 **Job Portal** | Complete hiring workflow with job posting and applications | [Demo](https://ai-technical-interviewer-seven.vercel.app/) | [Repo](https://github.com/SamarthHegde046/AI-Technical-Interviewer) |
| 📅 **Interview Scheduler** | Schedule and manage AI-powered technical interviews | [Demo](https://ai-interview-caller.vercel.app/) | [Repo](https://github.com/muhammadnavas/AI_Interview_Caller.git) |
| 💻 **Code Analysis** | Advanced code assessment and technical evaluation | [Demo](https://codedetector-4.onrender.com) | [Repo](https://github.com/sanketh-shetty15/AI-Interviewer.git) |
| 🤖 **AI Interviewer** | Interactive AI-powered candidate interviews | [Demo](https://ai-technical-interviewer.vercel.app/) | [Repo](https://github.com/muhammadnavas/AI-Technical-Interviewer.git) |
| 📝 **Coding Assessment** | Live code editor for technical coding tests | [Demo](https://ai-code-editor-psi-two.vercel.app/) | [Repo](https://github.com/muhammadnavas/AI_CodeEditor.git) |

> **🎯 Ready to transform your hiring process?** Start with our [Job Portal Demo](https://ai-technical-interviewer-seven.vercel.app/) to see the complete workflow!


## 🌟 Features

### Core Interview Capabilities
- **AI-Powered Interviews**: GPT-4 driven conversational interviews tailored to candidate profiles
- **Real-time Voice Interaction**: Speech-to-text and text-to-speech for natural conversation flow
- **Live Coding Assessment**: Integrated code editor with multiple programming language support
- **Behavioral Monitoring**: Face detection and object detection to ensure interview integrity

### Interview Management
- **Session Scheduling**: Schedule interviews with email notifications
- **Candidate Profiles**: Upload and manage detailed candidate profiles with skills, projects, and experience
- **Custom Questions**: Generate AI-tailored questions based on candidate background
- **Interview Results**: Automated transcription, AI-refined summaries, and recruiter-friendly reports

### Technical Monitoring
- **Video Surveillance**: Real-time face and object detection during interviews
- **Code Editor Integration**: Live coding exercises with test case validation
- **Session Recording**: Complete interview transcripts and coding submissions
- **Email Integration**: Automated notifications using Resend API

## 📸 Platform Screenshots

<div align="center">

### 🏢 Job Portal for Recruiters & Candidates
<table>
<tr>
<td>
<a href="https://ai-technical-interviewer-seven.vercel.app/">
<img src="./Images/job portal for recruiter and candidate.png" alt="Job Portal" width="800"/>
</a>
</td>
</tr>
</table>
<em>Comprehensive job portal with role-based access for both recruiters and candidates</em>

### 👥 Candidate Shortlisting Process
<table>
<tr>
<td>
<img src="./Images/Candidate shortlisting.png" alt="Candidate Shortlisting" width="800"/>
</td>
</tr>
</table>
<em>AI-powered candidate evaluation and shortlisting based on skills and experience</em>

### 📅 AI Interview Scheduler
<table>
<tr>
<td>
<a href="https://ai-interview-caller.vercel.app/">
<img src="./Images/Ai-interview scheduler.png" alt="Interview Scheduler" width="800"/>
</a>
</td>
</tr>
</table>
<em>Intelligent interview scheduling with automated calendar integration</em>

### 📋 Interview Scheduling Process
<table>
<tr>
<td>
<img src="./Images/Interview Scheduling process.png" alt="Interview Scheduling Process" width="800"/>
</td>
</tr>
</table>
<em>Step-by-step interview scheduling workflow with email notifications</em>

### 🚪 Candidate Entry for Interview Session
<table>
<tr>
<td>
<img src="./Images/candidate entry for interview session.png" alt="Candidate Entry" width="800"/>
</td>
</tr>
</table>
<em>Secure candidate authentication and interview session access portal</em>

### 🤖 AI Interviewer for Candidates
<table>
<tr>
<td>
<img src="./Images/Ai-interviewer for candidate.png" alt="AI Interviewer" width="800"/>
</td>
</tr>
</table>
<em>Interactive AI-powered interview interface with real-time conversation</em>

### 💻 AI-Powered Coding Assessment
<table>
<tr>
<td>
<a href="https://ai-technical-interviewer.vercel.app/">
<img src="./Images/Ai powered coding assesment.png" alt="Coding Assessment" width="800"/>
</a>
</td>
</tr>
</table>
<em>Advanced coding challenges with real-time evaluation and feedback</em>

### 🔍 AI Powered Candidate Project Code Analysis
<table>
<tr>
<td>
<img src="./Images/candidate project code AI analysis.png" alt="Code Analysis" width="800"/>
</td>
</tr>
</table>
<em>Intelligent code analysis and technical skill assessment</em>

</div>

## 🚀 Tech Stack

### Backend
- **Node.js** with **Express.js** - RESTful API server
- **OpenAI GPT-4** - AI interview conductor
- **MongoDB** with **Mongoose** - Database for profiles and results
- **Resend** - Email service for notifications
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 19** - Modern UI framework
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Three.js** with **@react-three/fiber** - 3D avatar rendering
- **MediaPipe** - Face detection capabilities
- **TensorFlow.js** - Object detection models
- **Lucide React** - Modern icon library

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (optional - falls back to filesystem storage)
- **OpenAI API Key**
- **Resend API Key** (for email features)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/muhammadnavas/AI-Technical-Interviewer.git
cd AI-Technical-Interviewer
```

### 2. Install Dependencies
```bash
# Install all dependencies (frontend and backend)
cd backend && npm run setup
```

Or install separately:
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Copy the environment template:
```bash
cd backend
cp .env.example .env
```

Configure your `.env` file:
```env
# OpenAI API Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration (Optional)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourcompany.com

# MongoDB Configuration (Optional - uses filesystem if omitted)
MONGO_URI=mongodb://localhost:27017/ai_interviewer
MONGO_DB_NAME=ai_interviewer

# Frontend URLs
FRONTEND_URL=http://localhost:5173
PRODUCTION_FRONTEND_URL=https://your-production-url.com

# Server Configuration
PORT=3000
```

### 4. Start the Application

**Development Mode (Both servers):**
```bash
cd backend
npm run dev:full
```

**Start Individually:**
```bash
# Backend server
cd backend
npm run dev

# Frontend development server (in new terminal)
cd frontend
npm run dev
```

## 🎯 Usage Guide

### For Recruiters

#### 1. Candidate Profile Management
- Upload candidate profiles via JSON files
- Create detailed profiles with skills, experience, and project details
- Generate AI-tailored interview questions automatically

#### 2. Interview Setup
- Schedule interviews with automatic email notifications
- Configure custom questions and coding challenges
- Set interview parameters (duration, difficulty level)

#### 3. Session Management
- Access live interviews for monitoring
- Review real-time candidate performance
- Export interview results and assessments

### For Candidates

#### 1. Interview Access
- Join interviews using session ID and access token
- Complete pre-interview setup and equipment checks
- Participate in voice-based technical discussions

#### 2. Coding Assessments
- Solve programming challenges in integrated code editor
- Multiple language support (JavaScript, Python, Java, etc.)
- Real-time code execution and test validation

#### 3. Behavioral Monitoring
- Face detection ensures candidate presence
- Object detection maintains interview integrity
- 3D avatar provides engaging interview experience

## 🏗️ Project Structure

```
AI-Technical-Interviewer/
├── backend/
│   ├── models/
│   │   └── InterviewSession.js    # MongoDB schema for sessions
│   ├── routes/
│   │   ├── sessions.js            # Interview session routes
│   │   ├── email.js               # Email notification routes
│   │   ├── integrations.js        # External integrations
│   │   └── scheduledSessions.js   # Session scheduling
│   ├── utils/
│   │   ├── emailService.js        # Email service utilities
│   │   └── sessionScheduler.js    # Session scheduling logic
│   ├── candidate-profiles/        # Candidate profile storage
│   ├── interview-results/         # Interview result storage
│   ├── server.js                  # Main server file
│   ├── package.json               # Backend dependencies
│   └── .env.example               # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InterviewSession.jsx    # Main interview interface
│   │   │   ├── AIAvatar3D.jsx          # 3D avatar component
│   │   │   ├── FaceDetector.jsx        # Face detection monitoring
│   │   │   ├── ObjectDetector.jsx      # Object detection monitoring
│   │   │   ├── VideoMonitor.jsx        # Video monitoring panel
│   │   │   ├── MonitoringPanel.jsx     # Behavioral monitoring
│   │   │   └── SessionScheduler.jsx    # Interview scheduling
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # Landing page
│   │   │   └── InterviewSetup.jsx      # Interview configuration
│   │   ├── App.jsx                     # Main application component
│   │   ├── config.js                   # Frontend configuration
│   │   └── main.jsx                    # Application entry point
│   ├── package.json                    # Frontend dependencies
│   ├── vite.config.js                  # Vite configuration
│   ├── tailwind.config.js              # TailwindCSS configuration
│   └── index.html                      # HTML template
└── README.md                           # Project documentation
```

## 📊 Session Schemas & Data Models

### Interview Session Schema

The `InterviewSession` model represents a complete interview session with all associated data and metadata.

#### Full Schema Structure:

```javascript
{
  // Session Identification
  sessionId: String (unique),           // Unique identifier for the session
  candidateId: ObjectId,                // Reference to candidate
  applicationId: ObjectId,              // Reference to job application
  jobId: ObjectId,                      // Reference to job posting
  recruiterId: ObjectId,                // Reference to recruiter

  // Candidate Information
  candidateDetails: {
    candidateName: String,              // Full name of candidate
    candidateEmail: String,             // Email address
    phoneNumber: String,                // Phone contact
    companyName: String,                // Current/previous company
    role: String,                       // Applied position
    techStack: [String],                // Skills and technologies
    experience: String                  // Years of experience
  },

  // Session Configuration
  sessionConfig: {
    scheduledStartTime: Date,           // Interview start time
    scheduledEndTime: Date,             // Interview end time
    timeZone: String,                   // Candidate's timezone
    duration: Number,                   // Duration in minutes (default: 60)
    accessWindow: {
      beforeStart: Number,              // Access available minutes before start
      afterEnd: Number                  // Access available minutes after end
    }
  },

  // Session Status
  sessionStatus: String (enum),         // Status: 'scheduled', 'active', 'completed', 'expired', 'cancelled'

  // Access Control
  accessControl: {
    isActive: Boolean,                  // Is session currently active?
    accessStartTime: Date,              // When access was enabled
    accessEndTime: Date,                // When access ends
    candidateJoinedAt: Date,            // When candidate joined
    candidateLeftAt: Date,              // When candidate left
    totalTimeSpent: Number              // Total time in minutes
  },

  // Interview Data & Results
  interviewData: {
    conversationHistory: [{
      role: String (enum),              // 'system', 'assistant', 'user'
      content: String,                  // Message content
      timestamp: Date                   // When message was sent
    }],
    metadata: {
      startTime: Date,                  // Interview start timestamp
      endTime: Date,                    // Interview end timestamp
      questionsAsked: Number,           // Total questions asked
      answersReceived: Number,          // Total answers received
      codingTestsCompleted: Number      // Completed coding tests
    },
    results: {
      fileName: String,                 // Result file name
      savedAt: Date,                    // When results were saved
      resultSummary: String             // AI-generated summary
    }
  },

  // Security
  security: {
    accessToken: String,                // Session access token
    ipRestrictions: [String],           // Whitelisted IP addresses (optional)
    maxLoginAttempts: Number,           // Max failed login attempts (default: 3)
    loginAttempts: Number,              // Current failed attempts
    lastLoginAttempt: Date              // Timestamp of last login attempt
  },

  // Notifications
  notifications: {
    emailSent: Boolean,                 // Was confirmation email sent?
    remindersSent: [Date],              // Array of reminder timestamps
    confirmationSentAt: Date            // When confirmation was sent
  },

  // Timestamps
  createdAt: Date,                      // Session creation time
  updatedAt: Date                       // Last update time
}
```

#### Example Session Document:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "sessionId": "SESS_20250202_ABC123XYZ",
  "candidateId": "507f1f77bcf86cd799439012",
  "applicationId": "507f1f77bcf86cd799439013",
  "jobId": "507f1f77bcf86cd799439014",
  "recruiterId": "507f1f77bcf86cd799439015",
  
  "candidateDetails": {
    "candidateName": "John Doe",
    "candidateEmail": "john.doe@example.com",
    "phoneNumber": "+1-555-0123",
    "companyName": "TechCorp Inc",
    "role": "Senior Full Stack Developer",
    "techStack": ["JavaScript", "React", "Node.js", "MongoDB", "Python"],
    "experience": "5 years"
  },

  "sessionConfig": {
    "scheduledStartTime": "2025-02-02T14:00:00Z",
    "scheduledEndTime": "2025-02-02T15:00:00Z",
    "timeZone": "America/New_York",
    "duration": 60,
    "accessWindow": {
      "beforeStart": 15,
      "afterEnd": 15
    }
  },

  "sessionStatus": "completed",

  "accessControl": {
    "isActive": false,
    "accessStartTime": "2025-02-02T13:45:00Z",
    "accessEndTime": "2025-02-02T15:15:00Z",
    "candidateJoinedAt": "2025-02-02T13:58:00Z",
    "candidateLeftAt": "2025-02-02T14:52:00Z",
    "totalTimeSpent": 54
  },

  "interviewData": {
    "conversationHistory": [
      {
        "role": "assistant",
        "content": "Hello John, welcome to the technical interview. Let's start by discussing your experience with React.",
        "timestamp": "2025-02-02T13:58:15Z"
      },
      {
        "role": "user",
        "content": "Thank you! I've been working with React for about 4 years...",
        "timestamp": "2025-02-02T13:58:45Z"
      },
      {
        "role": "assistant",
        "content": "Great! Can you explain the concept of hooks and when you would use them?",
        "timestamp": "2025-02-02T14:05:00Z"
      }
    ],
    "metadata": {
      "startTime": "2025-02-02T13:58:00Z",
      "endTime": "2025-02-02T14:52:00Z",
      "questionsAsked": 8,
      "answersReceived": 8,
      "codingTestsCompleted": 2
    },
    "results": {
      "fileName": "interview_result_20250202_john_doe.json",
      "savedAt": "2025-02-02T14:53:00Z",
      "resultSummary": "Candidate demonstrated strong React knowledge with excellent understanding of hooks and state management. Code implementation was clean and optimized. Estimated skill level: Senior Developer."
    }
  },

  "security": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "ipRestrictions": ["192.168.1.100", "203.0.113.42"],
    "maxLoginAttempts": 3,
    "loginAttempts": 0,
    "lastLoginAttempt": "2025-02-02T13:58:00Z"
  },

  "notifications": {
    "emailSent": true,
    "remindersSent": [
      "2025-02-02T13:30:00Z"
    ],
    "confirmationSentAt": "2025-02-02T10:00:00Z"
  },

  "createdAt": "2025-02-02T10:00:00Z",
  "updatedAt": "2025-02-02T14:53:00Z"
}
```

#### Session Methods & Operations:

```javascript
// Activate a session (transition from scheduled to active)
session.activateSession()
// Sets sessionStatus to 'active', records access start time and candidate join time

// Complete a session
session.completeSession()
// Sets sessionStatus to 'completed', calculates total time spent

// Check if session should be expired
session.checkExpiry()
// Automatically expires sessions that have passed access window

// Virtual property to check accessibility
session.isAccessible
// Returns true if current time is within access window and session is scheduled
```

### Session Status Transitions

```
scheduled
    ↓
   active (candidate joins)
    ↓
   completed (candidate leaves)

OR

scheduled
    ↓
   expired (access window closes without activation)

OR

scheduled / active → cancelled (manually cancelled)
```

### Candidate Profile Schema

The candidate profile stores comprehensive information about job applicants and their qualifications.

#### Candidate Profile Structure:

```javascript
{
  // Basic Information
  candidateId: String (unique),         // Unique identifier for candidate
  candidateName: String,                // Full name
  candidateEmail: String,               // Email address
  phoneNumber: String,                  // Phone contact
  
  // Professional Information
  position: String,                     // Target position/role
  companyName: String,                  // Current/previous company
  experience: String,                   // Years of experience
  education: String,                    // Educational background
  
  // Technical Skills
  skills: [String],                     // Array of technical skills
  techStack: [String],                  // Technology stack
  projectDetails: String,               // Project descriptions
  githubProjects: String,               // GitHub profile or projects
  
  // Interview Customization
  customQuestions: [String],            // Custom interview questions
  codingAssessment: {
    questions: [{
      id: String,                       // Question identifier
      title: String,                    // Question title
      prompt: String,                   // Question description
      signature: String,                // Function signature
      language: String,                 // Programming language
      languageHints: [String],          // Suggested languages
      sampleTests: [{
        input: Any,                     // Test input
        expected: Any                   // Expected output
      }],
      hiddenTests: [{
        input: Any,                     // Hidden test input
        expected: Any                   // Expected output
      }]
    }]
  },
  
  // Metadata
  metadata: Object,                     // Additional custom data
  createdAt: Date,                      // Profile creation time
  updatedAt: Date                       // Last update time
}
```

#### Example Candidate Profile:

```json
{
  "candidateId": "CAND_JS_DEVELOPER_001",
  "candidateName": "Sarah Johnson",
  "candidateEmail": "sarah.johnson@email.com",
  "phoneNumber": "+1-555-0123",
  "position": "Senior Full Stack Developer",
  "companyName": "TechStartup Inc",
  "experience": "7 years",
  "education": "BS Computer Science, MIT",
  "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS"],
  "techStack": ["React", "Node.js", "MongoDB", "Docker", "Kubernetes"],
  "projectDetails": "Built scalable microservices architecture serving 10M+ users. Led team of 5 developers in modernizing legacy systems.",
  "githubProjects": "https://github.com/sarahjohnson/portfolio",
  "customQuestions": [
    "Explain your approach to microservices architecture",
    "How do you handle state management in large React applications?",
    "Describe your experience with containerization and orchestration"
  ],
  "codingAssessment": {
    "questions": [
      {
        "id": "array-manipulation",
        "title": "Array Transformation",
        "prompt": "Given an array of objects, transform and filter based on criteria",
        "signature": "function transformArray(data, criteria)",
        "language": "javascript",
        "languageHints": ["javascript", "python"],
        "sampleTests": [
          {
            "input": "[{name: 'John', age: 25}, {name: 'Jane', age: 30}]",
            "expected": "[{name: 'John', isAdult: true}]"
          }
        ],
        "hiddenTests": [
          {
            "input": "[]",
            "expected": "[]"
          }
        ]
      }
    ]
  },
  "metadata": {
    "source": "job_portal",
    "priority": "high"
  },
  "createdAt": "2025-02-01T10:00:00Z",
  "updatedAt": "2025-02-02T08:30:00Z"
}
```

### Coding Task Schema

Coding tasks are generated for live coding assessments during interviews.

#### Coding Task Structure:

```javascript
{
  id: String,                           // Task identifier
  title: String,                        // Task title
  description: String,                  // Task description and requirements
  languageHints: [String],              // Suggested programming languages
  exampleInputOutput: {                 // Example for candidate reference
    input: String,                      // Sample input
    output: String                      // Expected output
  },
  tests: [String],                      // Array of test descriptions
  difficulty: String,                   // Task difficulty level
  timeLimit: Number,                    // Suggested time limit in minutes
  tags: [String]                        // Task categorization tags
}
```

#### Example Coding Tasks:

```json
[
  {
    "id": "reverse-string",
    "title": "String Reversal",
    "description": "Write a function that reverses a string without using built-in reverse methods. Consider edge cases like empty strings and single characters.",
    "languageHints": ["javascript", "python", "java"],
    "exampleInputOutput": {
      "input": "'hello'",
      "output": "'olleh'"
    },
    "tests": [
      "reverseString('hello') should return 'olleh'",
      "reverseString('') should return ''",
      "reverseString('a') should return 'a'"
    ],
    "difficulty": "easy",
    "timeLimit": 15,
    "tags": ["string-manipulation", "algorithms"]
  },
  {
    "id": "api-design",
    "title": "REST API Design",
    "description": "Design a RESTful API for a task management system. Include endpoints for CRUD operations, user authentication, and task filtering. Consider proper HTTP methods and status codes.",
    "languageHints": ["javascript", "python"],
    "exampleInputOutput": {
      "input": "Design endpoints for tasks and users",
      "output": "GET /api/tasks, POST /api/tasks, etc."
    },
    "tests": [
      "Should include proper CRUD endpoints",
      "Should handle authentication",
      "Should support filtering and pagination"
    ],
    "difficulty": "medium",
    "timeLimit": 30,
    "tags": ["system-design", "api-design"]
  }
]
```

### Email Notification Schema

Email notifications are sent for interview scheduling and reminders.

#### Email Notification Structure:

```javascript
{
  // Recipient Information
  to: String,                           // Recipient email address
  candidateId: String,                  // Associated candidate ID
  sessionId: String,                    // Associated session ID
  
  // Email Content
  subject: String,                      // Email subject line
  html: String,                         // HTML email content
  text: String,                         // Plain text fallback
  
  // Email Type and Status
  emailType: String,                    // Type: 'invite', 'reminder', 'confirmation'
  status: String,                       // Status: 'sent', 'failed', 'pending'
  
  // Delivery Information
  sentAt: Date,                         // When email was sent
  deliveredAt: Date,                    // When email was delivered
  openedAt: Date,                       // When email was opened
  clickedAt: Date,                      // When links were clicked
  
  // Provider Details
  providerId: String,                   // Email service provider message ID
  provider: String,                     // Email service provider name
  
  // Metadata
  metadata: {
    campaignId: String,                 // Campaign identifier
    template: String,                   // Template used
    variables: Object                   // Template variables used
  },
  
  // Timestamps
  createdAt: Date,                      // Notification creation time
  updatedAt: Date                       // Last update time
}
```

### Scheduled Session Schema

Scheduled sessions manage interview timing and candidate access.

#### Scheduled Session Structure:

```javascript
{
  // Session Identification
  sessionId: String (unique),           // Unique session identifier
  candidateId: String,                  // Associated candidate
  candidateName: String,                // Candidate name
  
  // Scheduling Information
  startTime: Date,                      // Session start time
  endTime: Date,                        // Session end time
  duration: Number,                     // Duration in minutes
  timeZone: String,                     // Session timezone
  
  // Session Configuration
  interviewType: String,                // Type of interview
  notes: String,                        // Additional notes
  accessWindow: {
    beforeStart: Number,                // Minutes before start
    afterEnd: Number                    // Minutes after end
  },
  
  // Access Control
  status: String,                       // Status: 'scheduled', 'active', 'completed', 'cancelled'
  accessAttempts: Number,               // Number of access attempts
  maxAccessAttempts: Number,            // Maximum allowed attempts
  
  // Timestamps
  createdAt: Date,                      // Session creation time
  updatedAt: Date,                      // Last update time
  lastAccessAttempt: Date               // Last access attempt time
}
```

### Interview Result Schema

Interview results store the complete outcome and analysis of interviews.

#### Interview Result Structure:

```javascript
{
  // Result Identification
  fileName: String,                     // Result file name
  sessionId: String,                    // Associated session ID
  candidateId: String,                  // Associated candidate ID
  
  // Interview Summary
  summary: {
    candidateName: String,              // Candidate name
    position: String,                   // Applied position
    interviewDate: Date,                // Interview date
    duration: Number,                   // Actual interview duration
    completionStatus: String            // Completion status
  },
  
  // Performance Metrics
  metrics: {
    questionsAsked: Number,             // Total questions asked
    questionsAnswered: Number,          // Questions answered
    codingTasksCompleted: Number,       // Coding tasks completed
    technicalScore: Number,             // Technical assessment score (1-10)
    communicationScore: Number,         // Communication score (1-10)
    overallScore: Number                // Overall interview score (1-10)
  },
  
  // Conversation Data
  conversationHistory: [{
    role: String,                       // 'interviewer', 'candidate', 'system'
    content: String,                    // Message content
    timestamp: Date                     // Message timestamp
  }],
  
  // Coding Assessment Results
  codingResults: [{
    taskId: String,                     // Coding task ID
    taskTitle: String,                  // Task title
    code: String,                       // Submitted code
    language: String,                   // Programming language used
    testsPassed: Number,                // Number of tests passed
    totalTests: Number,                 // Total number of tests
    executionTime: Number,              // Code execution time
    score: Number                       // Task score (1-10)
  }],
  
  // AI Analysis
  aiAnalysis: {
    technicalStrengths: [String],       // Identified technical strengths
    technicalWeaknesses: [String],      // Areas for improvement
    recommendedLevel: String,           // Recommended experience level
    hiringRecommendation: String,       // Hire/No Hire/Maybe recommendation
    detailedFeedback: String,           // Comprehensive feedback
    skillAssessment: {
      [skillName]: {                    // Dynamic skill assessments
        score: Number,                  // Skill score (1-10)
        evidence: String,               // Evidence for score
        improvement: String             // Improvement suggestions
      }
    }
  },
  
  // Metadata
  metadata: {
    interviewerModel: String,           // AI model used
    processingVersion: String,          // Result processing version
    qualityScore: Number,               // Result quality score
    flaggedIssues: [String]            // Any flagged issues
  },
  
  // Timestamps
  createdAt: Date,                      // Result creation time
  processedAt: Date,                    // When analysis was completed
  updatedAt: Date                       // Last update time
}
```

### API Request/Response Schemas

#### Session Creation Request:

```javascript
POST /api/sessions/create
{
  candidateId: String,                  // Required: Candidate identifier
  applicationId: String,                // Required: Application identifier
  jobId: String,                        // Required: Job identifier
  recruiterId: String,                  // Required: Recruiter identifier
  candidateDetails: {
    candidateName: String,              // Required: Candidate name
    candidateEmail: String,             // Required: Email address
    phoneNumber: String,                // Optional: Phone number
    companyName: String,                // Optional: Company name
    role: String,                       // Required: Applied role
    techStack: [String],                // Optional: Technology stack
    experience: String                  // Optional: Experience level
  },
  scheduledDate: String,                // Required: Date in YYYY-MM-DD format
  scheduledTime: String,                // Required: Time in HH:MM format
  duration: Number,                     // Optional: Duration in minutes (default: 60)
  timeZone: String                      // Optional: Timezone (default: UTC)
}
```

#### Session Creation Response:

```javascript
{
  success: Boolean,                     // Operation success status
  message: String,                      // Success/error message
  session: {
    sessionId: String,                  // Generated session ID
    accessToken: String,                // Session access token
    scheduledStartTime: Date,           // Session start time
    scheduledEndTime: Date,             // Session end time
    candidateDetails: Object,           // Candidate information
    sessionStatus: String               // Current session status
  },
  interviewData: {
    candidateProfile: Object,           // Full candidate profile
    interviewQuestions: [String],       // Generated interview questions
    codingTasks: [Object],              // Generated coding tasks
    systemPrompt: String                // AI interviewer system prompt
  }
}
```

#### Session Access Request:

```javascript
POST /api/sessions/access
{
  sessionId: String,                    // Required: Session identifier
  accessToken: String                   // Required: Session access token
}
```

#### Session Access Response:

```javascript
{
  success: Boolean,                     // Access granted/denied
  message: String,                      // Access status message
  sessionData: {
    sessionId: String,                  // Session identifier
    candidateDetails: Object,           // Candidate information
    sessionConfig: Object,              // Session configuration
    interviewQuestions: [String],       // Interview questions
    codingTasks: [Object],              // Coding tasks
    timeRemaining: Number               // Minutes remaining in session
  },
  accessControl: {
    isActive: Boolean,                  // Is session currently active
    accessStartTime: Date,              // When access started
    accessEndTime: Date                 // When access expires
  }
}
```

#### Message Exchange Request:

```javascript
POST /api/sessions/message/:sessionId
{
  accessToken: String,                  // Required: Session access token
  message: String,                      // Required: Candidate's message
  messageType: String                   // Optional: Message type ('answer', 'question')
}
```

#### Message Exchange Response:

```javascript
{
  success: Boolean,                     // Message processed successfully
  message: String,                      // AI interviewer response
  conversationId: Number,               // Message sequence number
  metadata: {
    timestamp: Date,                    // Response timestamp
    messageCount: Number,               // Total messages in conversation
    questionsAsked: Number,             // Questions asked so far
    paused: Boolean                     // Is interviewer paused for coding
  }
}
```

#### Email Invitation Request:

```javascript
POST /api/email/send-session-invite
{
  candidateId: String,                  // Required: Candidate identifier
  sessionId: String                     // Required: Session identifier
}
```

#### Email Invitation Response:

```javascript
{
  success: Boolean,                     // Email sent successfully
  message: String,                      // Operation status message
  emailDetails: {
    to: String,                         // Recipient email
    subject: String,                    // Email subject
    messageId: String,                  // Provider message ID
    sentAt: Date                        // Send timestamp
  },
  sessionInfo: {
    sessionId: String,                  // Session identifier
    scheduledTime: Date,                // Interview time
    duration: Number,                   // Duration in minutes
    accessUrl: String                   // Interview access URL
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration for code style
- Add tests for new features
- Update documentation for API changes
- Ensure cross-browser compatibility

## 📧 Support

For questions, issues, or feature requests:
- **GitHub Issues**: [Create an issue](https://github.com/muhammadnavas/AI-Technical-Interviewer/issues)

## 🔮 Roadmap

- [ ] Video recording and playback
- [ ] Advanced analytics dashboard
- [ ] Multi-language interview support
- [ ] Integration with ATS systems
- [ ] Mobile application support
- [ ] Real-time collaboration features
- [ ] Advanced code assessment metrics
- [ ] Machine learning bias detection

## 👥 Collaborators

<div align="center">

| Contributor | GitHub Profile |
|-------------|----------------|
| **Muhammad Navas** | [![GitHub](https://img.shields.io/badge/GitHub-muhammadnavas-181717?style=for-the-badge&logo=github)](https://github.com/muhammadnavas) |
| **Sanketh Shetty** | [![GitHub](https://img.shields.io/badge/GitHub-sanketh--shetty15-181717?style=for-the-badge&logo=github)](https://github.com/sanketh-shetty15) |
| **Samarth Hegde** | [![GitHub](https://img.shields.io/badge/GitHub-SamarthHegde046-181717?style=for-the-badge&logo=github)](https://github.com/SamarthHegde046) |

</div>

### 🤝 How to Contribute
We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

**Ways to contribute:**
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📚 Improve documentation
- ⭐ Star the repository to show support

---

**Built with ❤️ by [Muhammad Navas](https://github.com/muhammadnavas) and the amazing contributors above**

> Transform your technical hiring process with AI-powered interviews that provide comprehensive, unbiased, and detailed candidate assessments.
