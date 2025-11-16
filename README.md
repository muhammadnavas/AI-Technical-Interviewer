# AI Technical Interviewer

A comprehensive AI-powered technical interview platform that conducts real-time interviews with candidates, featuring voice interaction, code assessment, behavioral monitoring, and automated result generation for recruiters.

## 🖥️ Live Demo & Screenshots

### 🌐 Live Applications
- **[Job Portal & Hiring Platform](https://ai-technical-interviewer-seven.vercel.app/)** - Complete hiring workflow
- **[AI Interview Scheduler](https://ai-interview-caller.vercel.app/)** - Schedule and manage interviews  
- **[AI Code Analysis Platform](https://ai-technical-interviewer.vercel.app/)** - Code assessment and analysis
- **AI Interviewer for Candidates** - *(Coming Soon)*

### 📸 Platform Screenshots

<div align="center">

| Job Portal & Application | AI Interview Scheduler |
|:------------------------:|:----------------------:|
| [![Job Portal](./Images/Screenshot%202025-11-16%20181635.png)](https://ai-technical-interviewer-seven.vercel.app/) | [![Interview Scheduler](./Images/Screenshot%202025-11-16%20181706.png)](https://ai-interview-caller.vercel.app/) |

| AI Code Analysis | Interview Session |
|:----------------:|:----------------:|
| [![Code Analysis](./Images/Screenshot%202025-11-16%20181943.png)](https://ai-technical-interviewer.vercel.app/) | ![Interview Session](./Images/Screenshot%202025-11-16%20182208.png) |

| Candidate Monitoring | Technical Assessment |
|:-------------------:|:-------------------:|
| ![Monitoring Panel](./Images/Screenshot%202025-11-16%20182338.png) | ![Technical Assessment](./Images/Screenshot%202025-11-16%20182412.png) |

| Real-time Interview | Results Dashboard |
|:------------------:|:-----------------:|
| ![Real-time Interview](./Images/Screenshot%202025-11-16%20182618.png) | ![Results Dashboard](./Images/Screenshot%202025-11-16%20182711.png) |

</div>

## 🌟 Features

### Core Interview Capabilities
- **AI-Powered Interviews**: GPT-4 driven conversational interviews tailored to candidate profiles
- **Real-time Voice Interaction**: Speech-to-text and text-to-speech for natural conversation flow
- **Live Coding Assessment**: Integrated code editor with multiple programming language support
- **Behavioral Monitoring**: Face detection and object detection to ensure interview integrity
- **3D AI Avatar**: Interactive 3D avatar for enhanced candidate experience

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

## 🔄 Platform Workflow

### 1. Job Application Process
[![Job Portal Workflow](./Images/Screenshot%202025-11-16%20181635.png)](https://ai-technical-interviewer-seven.vercel.app/)
*Complete job portal with application management and candidate screening*

### 2. Interview Scheduling
[![Interview Scheduling](./Images/Screenshot%202025-11-16%20181706.png)](https://ai-interview-caller.vercel.app/)
*Automated interview scheduling with email notifications and calendar integration*

### 3. Technical Code Assessment
[![Code Assessment](./Images/Screenshot%202025-11-16%20181943.png)](https://ai-technical-interviewer.vercel.app/)
*Advanced code analysis with real-time evaluation and feedback*

### 4. Live Interview Session
![Interview Session](./Images/Screenshot%202025-11-16%20182208.png)
*Real-time AI-powered interviews with behavioral monitoring and technical evaluation*

## 🚀 Quick Start

Experience the platform with our live demo applications:

| Platform | Description | Demo Link |
|----------|-------------|-----------|
| 🏢 **Job Portal** | Complete hiring workflow with job posting and applications | [**Try Demo →**](https://ai-technical-interviewer-seven.vercel.app/) |
| 📅 **Interview Scheduler** | Schedule and manage AI-powered technical interviews | [**Try Demo →**](https://ai-interview-caller.vercel.app/) |
| 💻 **Code Analysis** | Advanced code assessment and technical evaluation | [**Try Demo →**](https://ai-technical-interviewer.vercel.app/) |
| 🤖 **AI Interviewer** | Interactive AI-powered candidate interviews | *Coming Soon* |

> **🎯 Ready to transform your hiring process?** Start with our [Job Portal Demo](https://ai-technical-interviewer-seven.vercel.app/) to see the complete workflow!

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

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

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

## 📊 API Endpoints

### Interview Management
```http
POST /api/interview/setup          # Initialize interview session
POST /api/interview/message        # Send/receive messages during interview
POST /api/interview/code-start     # Begin coding assessment
POST /api/interview/code-result    # Submit coding results
POST /api/interview/end           # End interview and generate results
GET  /api/interview/results       # List all interview results
GET  /api/interview/results/:fileName # Get specific interview result
```

### Candidate Management
```http
POST /api/candidate/save           # Save candidate profile
POST /api/candidate/upload         # Upload candidate JSON file
GET  /api/candidate/load/:id       # Load candidate profile
GET  /api/candidate/list           # List all candidates
DELETE /api/candidate/delete/:id   # Delete candidate profile
POST /api/candidate/generate-code-questions # Generate coding challenges
GET  /api/candidate/code-questions/:id # Get coding questions for candidate
```

### Session Management
```http
POST /api/sessions/create          # Create new interview session
POST /api/sessions/access          # Access existing session
POST /api/test/start-session       # Start coding test session
```

### Email & Integrations
```http
POST /api/email/send-invitation    # Send interview invitation
POST /api/email/send-reminder      # Send interview reminder
GET  /api/scheduled-sessions       # Get scheduled sessions
```

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

## 🔧 Configuration Options

### MongoDB Setup (Optional)
If MongoDB is not configured, the system will fall back to filesystem storage:
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community  # macOS
sudo apt-get install mongodb                 # Ubuntu
# Or use MongoDB Atlas for cloud hosting
```

### Email Service Setup (Optional)
Configure Resend for email notifications:
1. Sign up at [Resend.com](https://resend.com)
2. Get your API key
3. Add to `.env` file
4. Configure your sending domain

### OpenAI API Setup (Required)
1. Get API key from [OpenAI Platform](https://platform.openai.com)
2. Ensure sufficient credits for GPT-4 usage
3. Add to `.env` file

## 🚀 Deployment

### Production Build
```bash
# Build frontend for production
cd frontend
npm run build

# Start backend in production mode
cd ../backend
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
PRODUCTION_FRONTEND_URL=https://your-domain.com
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_interviewer
```

### Hosting Options
- **Vercel** (Frontend) + **Render/Railway** (Backend)
- **Netlify** (Frontend) + **Heroku** (Backend)
- **AWS EC2/ECS** for full-stack deployment
- **Docker** containerization support

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### Health Checks
```bash
# Check backend health
curl http://localhost:3000/api/health

# Check database health
curl http://localhost:3000/api/db-health
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

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**1. OpenAI API Errors**
```bash
# Check API key configuration
npm run env:check

# Verify OpenAI credit balance
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/usage
```

**2. MongoDB Connection Issues**
```bash
# Check MongoDB status
brew services list | grep mongodb  # macOS
sudo systemctl status mongod        # Linux

# Test connection
mongo mongodb://localhost:27017/test
```

**3. Email Service Problems**
```bash
# Test Resend configuration
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@resend.dev","to":"test@example.com","subject":"Test","html":"Test"}'
```

**4. CORS Issues**
- Ensure frontend URL is added to backend CORS configuration
- Check `FRONTEND_URL` in `.env` file
- Verify ports match your development setup

## 📧 Support

For questions, issues, or feature requests:
- **GitHub Issues**: [Create an issue](https://github.com/muhammadnavas/AI-Technical-Interviewer/issues)
- **Email**: [Contact the maintainer](mailto:muhammadnavas@example.com)
- **Documentation**: Check the wiki for detailed guides

## 🔮 Roadmap

- [ ] Video recording and playback
- [ ] Advanced analytics dashboard
- [ ] Multi-language interview support
- [ ] Integration with ATS systems
- [ ] Mobile application support
- [ ] Real-time collaboration features
- [ ] Advanced code assessment metrics
- [ ] Machine learning bias detection

---

**Built with ❤️ by [Muhammad Navas](https://github.com/muhammadnavas)**

> Transform your technical hiring process with AI-powered interviews that provide comprehensive, unbiased, and detailed candidate assessments.