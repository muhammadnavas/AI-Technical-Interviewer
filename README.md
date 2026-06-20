# AI Technical Interviewer Platform

The **AI Technical Interviewer Platform** is a comprehensive, AI-powered technical interview solution built on a **microservice architecture**. Independent services are deployed separately and seamlessly connected through APIs to manage the complete hiring workflow—from job posting and candidate scheduling to live coding assessments, real-time AI voice interviews, and post-interview code analysis.

## 🧩 Microservices Architecture Overview

Our platform is divided into five main independent services:

1. **[Job Portal](#1-job-portal)**: The comprehensive hiring workflow platform for job posting, candidate applications, and role-based access for recruiters and candidates.
2. **[Core AI Technical Interviewer](#2-core-ai-technical-interviewer)**: The central platform for behavioral monitoring, and interactive AI-powered interviews.
3. **[AI Interview Scheduler](#3-ai-interview-scheduler)**: An intelligent automated system using Twilio and OpenAI to call and schedule candidates.
4. **[AI CodeEditor](#4-ai-codeeditor)**: A real-time coding assessment platform with cloud code execution and multi-language support.
5. **[AI vs Human Code Detection System](#5-ai-vs-human-code-detection-system)**: An advanced machine learning system that analyzes code submissions to detect AI-generated content.

---

## 1. Job Portal

A complete hiring workflow system designed for seamless job posting and application management. It serves as the gateway for recruiters to manage open positions and for candidates to browse and apply for jobs, acting as the foundational entry point into the AI Technical Interviewer ecosystem.

### Live Demo
| Platform | Description | Demo Link |
|----------|-------------|-----------|
| Job Portal | Complete hiring workflow with job posting and applications | [Try Demo →](https://ai-technical-interviewer-seven.vercel.app/) |

---

## 2. Core AI Technical Interviewer

A comprehensive AI-powered technical interview platform that conducts real-time interviews with candidates, featuring voice interaction, code assessment, behavioral monitoring, and automated result generation for recruiters.

### Live Demo
Experience the platform with our live demo applications:

| Platform | Description | Demo Link |
|----------|-------------|-----------|
| Job Portal | Complete hiring workflow with job posting and applications | [Try Demo →](https://ai-technical-interviewer-seven.vercel.app/) |
| Interview Scheduler | Schedule and manage AI-powered technical interviews | [Try Demo →](https://ai-interview-caller.vercel.app/) |
| Code Analysis | Advanced code assessment and technical evaluation | [Try Demo →](https://codedetector-4.onrender.com) |
| AI Interviewer | Interactive AI-powered candidate interviews | [Try Demo →](https://ai-technical-interviewer.vercel.app/) |

**Ready to transform your hiring process?** Start with our Job Portal Demo to see the complete workflow!

### Features

#### Core Interview Capabilities
- **AI-Powered Interviews**: GPT-4 driven conversational interviews tailored to candidate profiles
- **Real-time Voice Interaction**: Speech-to-text and text-to-speech for natural conversation flow
- **Live Coding Assessment**: Integrated code editor with multiple programming language support
- **Behavioral Monitoring**: Face detection and object detection to ensure interview integrity

#### Interview Management
- **Session Scheduling**: Schedule interviews with email notifications
- **Candidate Profiles**: Upload and manage detailed candidate profiles with skills, projects, and experience
- **Custom Questions**: Generate AI-tailored questions based on candidate background
- **Interview Results**: Automated transcription, AI-refined summaries, and recruiter-friendly reports

#### Technical Monitoring
- **Video Surveillance**: Real-time face and object detection during interviews
- **Code Editor Integration**: Live coding exercises with test case validation
- **Session Recording**: Complete interview transcripts and coding submissions
- **Email Integration**: Automated notifications using Resend API

### Tech Stack
**Backend**
- Node.js with Express.js - RESTful API server
- OpenAI GPT-4 - AI interview conductor
- MongoDB with Mongoose - Database for profiles and results
- Resend - Email service for notifications
- CORS - Cross-origin resource sharing

**Frontend**
- React 19 - Modern UI framework
- Vite - Fast build tool and development server
- TailwindCSS - Utility-first CSS framework
- MediaPipe - Face detection capabilities
- TensorFlow.js - Object detection models
- Lucide React - Modern icon library

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (optional - falls back to filesystem storage)
- OpenAI API Key
- Resend API Key (for email features)

### Usage Guide

**For Recruiters**
1. **Candidate Profile Management**
   - Upload candidate profiles via JSON files
   - Create detailed profiles with skills, experience, and project details
   - Generate AI-tailored interview questions automatically
2. **Interview Setup**
   - Schedule interviews with automatic email notifications
   - Configure custom questions and coding challenges
   - Set interview parameters (duration, difficulty level)
3. **Session Management**
   - Access live interviews for monitoring
   - Review real-time candidate performance
   - Export interview results and assessments

**For Candidates**
1. **Interview Access**
   - Join interviews using session ID and access token
   - Complete pre-interview setup and equipment checks
   - Participate in voice-based technical discussions
2. **Coding Assessments**
   - Solve programming challenges in integrated code editor
   - Multiple language support (JavaScript, Python, Java, etc.)
   - Real-time code execution and test validation
3. **Behavioral Monitoring**
   - Face detection ensures candidate presence
   - Object detection maintains interview integrity

### Roadmap
- Video recording and playback
- Advanced analytics dashboard
- Multi-language interview support
- Integration with ATS systems
- Mobile application support
- Real-time collaboration features
- Advanced code assessment metrics
- Machine learning bias detection

---

## 3. AI Interview Scheduler

An intelligent automated interview scheduling system that uses AI-powered phone calls to schedule interviews with candidates. The system integrates with Twilio for voice calls, MongoDB for data storage, and email services for confirmations.

### 🚀 Features
- **AI-Powered Voice Calls**: Automated phone calls using Twilio and OpenAI
- **Intelligent Conversation Flow**: Natural language processing for scheduling
- **MongoDB Integration**: Complete candidate and call tracking
- **Email Confirmations**: Automated interview confirmation emails via Resend/SendGrid
- **Real-time Analytics**: Comprehensive call and scheduling analytics
- **Retry Logic**: Smart retry mechanism for failed calls
- **Dashboard UI**: Frontend interface for managing candidates and interviews

### 🏗️ Architecture
```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (FastAPI)     │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Dashboard     │◄──►│ • API Endpoints │◄──►│ • Twilio Voice  │
│ • Candidate Mgmt│    │ • AI Logic      │    │ • OpenAI GPT    │
│ • Analytics     │    │ • Webhooks      │    │ • MongoDB Atlas │
│ • Call Logs     │    │ • Email Service │    │ • Resend/SendGrid│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📋 Prerequisites
- Python 3.8+
- Node.js 16+ (for frontend)
- MongoDB Atlas account
- Twilio account with phone number
- Resend or SendGrid account for emails
- OpenAI API key

### 🛠️ Installation

**Backend Setup**
1. Clone the repository
   ```bash
   git clone https://github.com/muhammadnavas/AI_Interview_Caller.git
   cd AI_Interview_Caller/backend
   ```
2. Create virtual environment
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
4. Environment Setup
   Create a `.env` file in the backend directory:
   ```env
   # Email Configuration
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SENDER_EMAIL=your_email@gmail.com
   
   # Email Providers (HTTP APIs - Primary)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   RESEND_API_KEY=re_your_resend_api_key
   SENDGRID_API_KEY=SG.your_sendgrid_api_key
   
   # AI Configuration
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=sk-your_openai_api_key
   
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=ACyour_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Webhook URL (for deployment)
   WEBHOOK_BASE_URL=https://your-app.onrender.com
   
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=test
   MONGODB_COLLECTION=shortlistedcandidates
   ```
5. Run the application
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

**Frontend Setup**
1. Navigate to frontend directory
   ```bash
   cd ../frontend
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Run the development server
   ```bash
   npm run dev
   ```

### 🔮 Future Enhancements
- Multi-language support
- Advanced analytics dashboard
- Integration with calendar systems
- SMS notifications
- Video interview scheduling
- Candidate feedback collection
- Advanced AI conversation training

---

## 4. AI CodeEditor

**Intelligent Coding Assessment Platform**
A comprehensive full-stack platform for conducting AI-powered coding assessments with real-time code execution, multi-language support, and automated evaluation.

### ✨ Features

**🎯 Core Functionality**
- Live Coding Assessment: Real-time coding tests with timer and auto-submission
- Multi-Language Support: JavaScript, Python, Java, C++, TypeScript
- Cloud Code Execution: Judge0 API integration with local fallbacks
- AI-Powered Analysis: Intelligent code evaluation and feedback
- Question Bank: LeetCode/HackerEarth style programming challenges
- Candidate Management: Complete assessment workflow from setup to results

**🔧 Technical Capabilities**
- Monaco Code Editor: VS Code-like editing experience with syntax highlighting
- Real-time Test Execution: Run sample test cases during assessment
- Automatic Timeout Handling: Submit incomplete solutions when time expires
- Session Management: Persistent test sessions with candidate tracking
- Database Integration: MongoDB for candidate data and test results
- Responsive Design: Works seamlessly on desktop and mobile devices

**📊 Assessment Features**
- Multiple Difficulty Levels: Easy, Medium, Hard questions
- Sample Test Cases: Preview expected input/output before submission
- Live Code Testing: Run code against sample tests during development
- Progress Tracking: Question counter, timer, and completion status
- Professional UI: Clean, distraction-free assessment environment

### 🏗️ Architecture
```text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (Next.js)     │◄──►│   (Express.js)   │◄──►│   (MongoDB)     │
│                 │    │                  │    │                 │
│ • React UI      │    │ • REST API       │    │ • Candidates    │
│ • Monaco Editor │    │ • Code Execution │    │ • Questions     │
│ • Timer System  │    │ • AI Integration │    │ • Test Results  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Code Execution  │
                    │                  │
                    │ • Judge0 API     │
                    │ • Local Compilers│
                    │ • Docker Support │
                    └──────────────────┘
```

### 🚀 Tech Stack
**Frontend**
- Framework: Next.js 14 with React 18
- Styling: TailwindCSS for modern UI components
- Code Editor: Monaco Editor (VS Code engine)
- Icons: Lucide React for consistent iconography
- HTTP Client: Fetch API with custom service layer

**Backend**
- Runtime: Node.js with Express.js framework
- Database: MongoDB with Mongoose ODM
- Code Execution: Judge0 API + local compiler fallbacks
- Security: CORS, input validation, rate limiting
- Session Management: In-memory sessions with MongoDB persistence

**Infrastructure**
- Deployment: Render (backend) + Vercel (frontend)
- Code Execution: Judge0 cloud service with free tier fallback
- Database Hosting: MongoDB Atlas or local MongoDB
- Environment Management: dotenv for configuration

### 📋 Prerequisites
- Node.js: Version 18.0 or higher
- MongoDB: Local installation or MongoDB Atlas account
- Package Manager: npm or yarn
- Code Editor: VS Code recommended

### 🔧 Quick Start
1. **Repository Setup**
   ```bash
   git clone https://github.com/muhammadnavas/AI_CodeEditor.git
   cd AI_CodeEditor
   npm run install-all
   ```

2. **Environment Configuration**
   Backend (`backend/.env`):
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai_codeeditor
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your-rapidapi-key
   JUDGE0_FREE_API_URL=https://judge0-ce.p.rapidapi.com
   PORT=3001
   CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com
   NODE_ENV=development
   ```
   Frontend (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Database Setup**
   ```bash
   # Verify connection to local MongoDB
   mongosh
   ```

4. **Start Development Servers**
   Terminal 1 - Backend:
   ```bash
   cd backend
   npm run dev
   ```
   Terminal 2 - Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### 📚 Usage Guide

**For Test Administrators**
1. Add Candidates to Database: `cd backend && node insert_candidate.js`
2. Create Assessment Sessions: `?candidateId=CAND_001`
3. Monitor and Review Results: Results are automatically saved to MongoDB.

**For Candidates**
1. Access Assessment: Enter Candidate ID and click "Start Coding Test"
2. Take Assessment: Use Monaco editor, run sample cases, and submit code.
3. Assessment Completion: Automatic submission when time expires.

### 🗺️ Roadmap
- Real-time collaboration on code
- Video proctoring integration
- Advanced AI code review
- Custom question bank import
- Detailed analytics dashboard
- White-label customization
- Mobile app development
- Integration with ATS systems

---

## 5. AI vs Human Code Detection System

**Advanced Machine Learning System** for detecting whether code was written by artificial intelligence or humans. Features intelligent ensemble models, GitHub repository analysis, and comprehensive explainability with smart contradiction detection.

### ✨ Key Features

**🎯 Multi-Mode Analysis**
- Single Code Analysis: Analyze individual code snippets with detailed breakdown
- GitHub Repository Scanning: Complete repository analysis with file-by-file insights
- Batch File Processing: Upload and analyze multiple files simultaneously

**🧠 Intelligent Detection Engine**
- Ensemble ML Models: 4 classical models (LogisticRegression, RandomForest, GradientBoosting, XGBoost)
- Smart Voting System: Advanced consensus mechanism with confidence weighting
- Contradiction Detection: Automatically corrects predictions when line-level analysis conflicts with file-level results
- Multi-Language Support: Python, Java, and JavaScript code detection

**📊 Advanced Analysis & Explanations**
- Line-by-Line Breakdown: Detailed analysis of individual code lines with pattern detection
- Confidence Scoring: Precision confidence metrics for all predictions
- Model Agreement Tracking: Shows which models agree/disagree and why
- Pattern Recognition: Detects coding patterns like functions, loops, imports, etc.
- Consistency Validation: Cross-validates file-level vs line-level predictions

**🔍 GitHub Integration**
- Repository Scanning: Analyzes entire GitHub repositories automatically
- Progress Tracking: Real-time analysis progress with status updates
- Comprehensive Reports: Downloadable analysis reports with detailed insights

### 🏗️ Project Architecture
```text
Code_Detector/
├── 📱 Web Application
│   └── app.py                    # Main Streamlit application
├── 🤖 Machine Learning Pipeline  
│   ├── ml_train.py              # Classical ML model training
│   └── dl_train.py              # Deep learning model training
├── 📊 Data & Models
│   ├── Dataset/                 # Training data (Python, Java, JS)
│   ├── model/                  # Trained classical ML models
│   └── output/                 # Trained transformer models
└── 📋 Documentation
    └── requirements.txt        # Python dependencies
```

### 🚀 Quick Start Guide

**Prerequisites**
- Python 3.8 or higher
- 4GB+ RAM (8GB+ recommended for transformer models)
- Internet connection (for GitHub repository analysis)

**1. Installation**
```bash
git clone https://github.com/muhammadnavas/Code_Detector.git
cd Code_Detector
pip install -r requirements.txt
```

**2. Launch the Application**
```bash
streamlit run app.py
```
Access the app at: `http://localhost:8501`

**3. Model Training (Optional)**
```bash
# Train classical ML models (faster, CPU-friendly)
python ml_train.py

# Train transformer models (requires GPU for optimal performance)
python dl_train.py
```

### 🧠 Machine Learning Architecture

**🎯 Ensemble Prediction System**
Our intelligent ensemble combines multiple approaches for maximum accuracy:
- **Logistic Regression**: Linear classification with TF-IDF features
- **Random Forest**: Ensemble of decision trees with voting
- **Gradient Boosting**: Sequential ensemble with error correction
- **XGBoost**: Optimized gradient boosting framework

**🤖 Smart Ensemble Logic**
- Majority Voting: 3+ models must agree for high confidence
- Confidence Weighting: Uses model-specific confidence scores
- Contradiction Detection: Compares file-level vs line-level predictions
- Smart Corrections: Automatically adjusts predictions when inconsistencies detected

### 🛠️ Technical Implementation
**Dependencies**
- `streamlit>=1.28.0`
- `scikit-learn>=1.3.0`
- `xgboost>=1.7.0`
- `torch>=2.0.0`
- `transformers>=4.30.0`

### 📈 Roadmap
- Multi-language expansion (C++, Go, Rust)
- Real-time API endpoints for integration
- Advanced visualizations for pattern analysis
- Cloud deployment options
- Mobile app for on-the-go analysis
- Plugin development for popular IDEs

---
*Built with ❤️ for efficient interview scheduling automation and the developer community.*
