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
