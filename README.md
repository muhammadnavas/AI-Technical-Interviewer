# AI Technical Interviewer with OpenAI Integration

An intelligent, voice-enabled technical interview platform powered by OpenAI GPT-4 that personalizes questions based on candidate skills, experience, and projects.

## Features

### ✨ AI-Powered Interview
- **OpenAI GPT-4 Integration**: Intelligent, context-aware interview questions
- **Personalized Questions**: AI adapts questions based on:
  - Candidate name and position
  - Technical skills
  - Project experience
  - Custom question priorities
- **Natural Conversation Flow**: Dynamic follow-up questions based on candidate responses

### 🎙️ Voice-First Interface
- **Voice Input**: Speak your answers naturally
- **Auto-Submit**: Answers automatically sent when you stop speaking
- **Real-time Transcription**: See your words as you speak
- **Text-to-Speech**: AI speaks questions aloud
- **Manual Controls**: Stop/cancel options for background noise

### 📹 Live Video & Monitoring
- **Candidate Video Stream**: Live camera feed
- **AI Avatar Display**: Animated interviewer representation
- **Status Indicators**: Visual feedback for recording, listening, speaking
- **Session Tracking**: Duration timer, questions answered counter

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Modern web browser (Chrome/Edge recommended for full voice support)
- OpenAI API Key

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# The .env file is already configured with your API key:
# OPENAI_API_KEY=OPENAI_API_KEY
# PORT=5000

# Start the backend server
npm start

# For development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173` (or the port shown in terminal)

## Usage Guide

### Starting an Interview

1. **Open the Application**
   - Navigate to `http://localhost:5173`
   - You'll see the Interview Setup page

2. **Fill in Interview Details**
   - **Candidate Name** (Required): Your full name
   - **Position** (Required): Role you're applying for (e.g., "Full Stack Developer")
   - **Technical Skills** (Required): Comma-separated list (e.g., "JavaScript, React, Node.js, Python")
   - **Project Experience** (Optional): Describe your key projects
   - **Custom Questions** (Optional): Specific questions you want to be asked (one per line)

3. **Click "Start AI Interview"**
   - Backend initializes OpenAI session
   - AI prepares personalized questions
   - Redirects to interview page

### During the Interview

1. **Listen to Questions**
   - AI avatar displays on the right
   - Questions are spoken aloud (if voice enabled)
   - Questions appear in chat on the left

2. **Answer with Voice**
   - Click the blue microphone button
   - Speak your answer clearly
   - Real-time transcription shows in the text box
   - Stop speaking naturally or click mic again

3. **Auto-Submit**
   - 3-second countdown after you stop speaking
   - "Cancel Send" button to stop auto-submit
   - "Send Now" to send immediately
   - "Clear Text" to delete and retry

4. **AI Follow-up**
   - AI analyzes your answer
   - Generates relevant follow-up questions
   - Adapts difficulty based on responses

### Controls

**Video Controls:**
- 📹 Camera on/off
- 🎤 Microphone mute/unmute
- 🔊 AI voice enable/disable

**Voice Input:**
- 🎙️ Start/stop recording
- ❌ Cancel auto-submit
- ✉️ Send now
- 🗑️ Clear text

## API Endpoints

### POST `/api/interview/setup`
Initialize a new interview session

**Request Body:**
```json
{
  "sessionId": "session_123",
  "candidateName": "John Doe",
  "skills": ["JavaScript", "React", "Node.js"],
  "projectDetails": "Built e-commerce platform...",
  "customQuestions": ["Explain closures", "What is event loop?"],
  "position": "Full Stack Developer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview session initialized",
  "initialMessage": "Hello John! Welcome to your interview..."
}
```

### POST `/api/interview/message`
Get AI response to candidate's answer

**Request Body:**
```json
{
  "sessionId": "session_123",
  "message": "I have 5 years of experience in React..."
}
```

**Response:**
```json
{
  "success": true,
  "response": "That's great! Can you explain how React's hooks work?",
  "messageCount": 5
}
```

### POST `/api/interview/end`
End interview session

**Request Body:**
```json
{
  "sessionId": "session_123"
}
```

### GET `/api/health`
Check backend status

## Project Structure

```
AI Technical Interviewer/
├── backend/
│   ├── .env                 # API keys and config
│   ├── package.json
│   └── server.js           # Express + OpenAI integration
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── InterviewSetup.jsx    # Setup form
│   │   │   └── HomePage.jsx          # Interview interface
│   │   ├── App.jsx                   # Routing
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── AUTO_SUBMIT_FEATURE.md   # Auto-submit documentation
└── VOICE_FEATURES.md        # Voice features documentation
```

## Technology Stack

### Backend
- **Node.js + Express**: REST API server
- **OpenAI GPT-4**: AI interview generation
- **dotenv**: Environment variables
- **CORS**: Cross-origin requests

### Frontend
- **React 19**: UI framework
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **React Router**: Navigation
- **Web Speech API**: Voice recognition & synthesis

## Browser Compatibility

### Full Support
✅ Chrome (Desktop & Mobile)
✅ Edge (Desktop & Mobile)
✅ Safari (Desktop & Mobile)

### Partial Support
⚠️ Firefox (Text-to-speech only, no speech recognition)

### Requirements
- HTTPS connection (required for microphone)
- Modern browser with Web Speech API
- Microphone permissions

## Troubleshooting

### Backend Issues

**Error: "OpenAI API key not configured"**
- Check `.env` file exists in backend folder
- Verify `OPENAI_API_KEY` is set correctly
- Restart backend server

**Error: "Port 5000 already in use"**
- Change port in `.env`: `PORT=5001`
- Update frontend API calls to new port

### Frontend Issues

**Error: "Failed to connect to server"**
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API URLs in code

**Voice Recognition Not Working**
- Use Chrome or Edge browser
- Grant microphone permissions
- Check microphone in system settings

**No AI Responses**
- Verify backend is running
- Check network tab in browser dev tools
- Look for errors in backend console

### OpenAI API Issues

**Error: "Rate limit exceeded"**
- Wait and try again
- Check OpenAI account usage/quota

**Error: "Invalid API key"**
- Verify API key in `.env` file
- Check if key has proper permissions
- Generate new key from OpenAI dashboard

## Configuration

### Adjust AI Behavior

Edit `backend/server.js`:

```javascript
// Change AI model
model: 'gpt-4',  // or 'gpt-3.5-turbo' for faster/cheaper

// Adjust creativity
temperature: 0.7,  // 0.0 = focused, 1.0 = creative

// Change response length
max_tokens: 500,  // tokens in response
```

### Customize Voice Settings

Edit `frontend/src/pages/HomePage.jsx`:

```javascript
// Text-to-Speech
utterance.rate = 0.9  // Speed (0.1 to 10)
utterance.pitch = 1.0  // Pitch (0 to 2)
utterance.volume = 1.0  // Volume (0 to 1)

// Speech Recognition
recognition.lang = 'en-US'  // Language
recognition.continuous = false  // Auto-stop
```

## Security Notes

⚠️ **Important**: The `.env` file contains sensitive API keys
- Never commit `.env` to version control
- Keep API keys secure
- Rotate keys regularly
- Monitor OpenAI usage

## Cost Considerations

- **GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- Average interview: ~10-20 questions
- Estimated cost per interview: $0.20 - $0.50
- Monitor usage in OpenAI dashboard

## Future Enhancements

- [ ] Interview recording and playback
- [ ] Performance analytics and scoring
- [ ] Multi-language support
- [ ] Interview templates
- [ ] Admin dashboard
- [ ] Interview history and reports
- [ ] Code evaluation questions
- [ ] Whiteboard integration

## License

MIT License - Feel free to use and modify

## Support

For issues or questions:
1. Check troubleshooting section
2. Review browser console for errors
3. Check backend logs
4. Verify OpenAI API status
