# 🎓 Mock Candidate Data Guide

This guide explains how to use the mock candidate data with the AI Technical Interviewer system.

## 📋 Mock Candidate Profile

The system includes a pre-configured student/fresher candidate profile:

### Candidate Details
- **Name:** Priya Sharma
- **Position:** Junior Frontend Developer
- **Experience Level:** Fresher (No professional experience)
- **Education:** B.Tech CSE, Mumbai University (Graduating May 2026)
- **CGPA:** 8.5/10

### Technical Skills
HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, Git, Bootstrap, Tailwind CSS, REST APIs, Firebase

### 5 Projects Included

1. **E-Commerce Website** (React + Tailwind CSS)
   - Shopping cart & checkout
   - Product filtering
   - Dark mode
   - Local storage

2. **Task Management App** (Full Stack MERN)
   - CRUD operations
   - JWT authentication
   - MongoDB database
   - Task tracking

3. **Weather Dashboard** (React + API)
   - OpenWeather API integration
   - 5-day forecast
   - Geolocation
   - Weather alerts

4. **Portfolio Website** (HTML/CSS/JS)
   - Responsive design
   - Animations
   - Contact form
   - Project showcase

5. **Chat Application** (React + Firebase)
   - Real-time messaging
   - User authentication
   - Multiple chat rooms
   - Online/offline status

### Custom Questions (Entry-Level)
1. What is the difference between let, const, and var in JavaScript?
2. Explain how React hooks like useState and useEffect work
3. What is the difference between SQL and NoSQL databases?
4. How does Git version control help in software development?
5. What are the key differences between REST APIs and GraphQL?

---

## 🚀 3 Ways to Use Mock Data

### Method 1: Frontend UI (Easiest) ✅ RECOMMENDED

1. **Start the servers** (if not already running):
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open the application**:
   - Go to: http://localhost:5174

3. **Load sample data**:
   - Click the green **"Load Sample Student Data"** button
   - All form fields will be auto-filled
   - Review the data
   - Click **"Start AI Interview"**

4. **Start the interview**:
   - Grant microphone permission
   - The AI will ask personalized questions based on the loaded profile
   - Answer using voice or text

---

### Method 2: Command Line Test Script

Use the provided test scripts to interact with the AI directly from terminal.

#### Step 1: Initialize Interview Session

```bash
cd backend
node test-mock-candidate.js
```

**Output:**
```
🚀 Initializing AI Interview with Mock Candidate...

📋 Candidate Details:
   Name: Priya Sharma
   Position: Junior Frontend Developer
   Skills: HTML, CSS, JavaScript, React, Node.js...
   Experience: Fresher (No professional experience)

✅ Interview Session Initialized Successfully!

🤖 AI Interviewer says:
   "Hello Priya Sharma! Welcome to your technical interview..."
```

#### Step 2: Start Conversation (Optional)

```bash
node test-conversation.js
```

**Interactive Terminal Interview:**
- Type answers and press Enter
- Type `help` for sample answers
- Type `exit` to end interview

**Example Conversation:**
```
👤 Your Answer: I have built 5 projects including an e-commerce website

🤖 AI Interviewer:
   That's great! Can you tell me more about the technologies you used 
   in your e-commerce project?

👤 Your Answer: I used React for the frontend with Tailwind CSS...
```

---

### Method 3: Direct API Calls (Advanced)

Use curl or any HTTP client to interact with the API directly.

#### Initialize Interview

```bash
curl -X POST http://localhost:5000/api/interview/setup \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_test_123",
    "candidateName": "Priya Sharma",
    "position": "Junior Frontend Developer",
    "skills": ["HTML", "CSS", "JavaScript", "React"],
    "projectDetails": "Built 5 projects including e-commerce, chat app...",
    "customQuestions": ["Explain React hooks", "What is async/await?"]
  }'
```

#### Send Message

```bash
curl -X POST http://localhost:5000/api/interview/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_test_123",
    "message": "I have experience with React hooks like useState"
  }'
```

---

## 📝 Mock Data Files

### 1. `backend/mock-candidate.json`
Complete candidate profile with all details (metadata, preferences, etc.)

### 2. `backend/test-mock-candidate.js`
Script to initialize AI interview with mock data

### 3. `backend/test-conversation.js`
Interactive terminal-based interview simulator

---

## 🎯 What the AI Will Ask

Based on the mock student profile, the AI interviewer will ask:

### JavaScript Fundamentals
- Variables (let, const, var)
- Async/await and Promises
- Event loop and callbacks
- Array methods (map, filter, reduce)

### React Questions
- React hooks (useState, useEffect)
- Component lifecycle
- Props vs State
- Virtual DOM

### Project-Specific Questions
- "Tell me about your e-commerce project"
- "How did you implement authentication in the task app?"
- "What challenges did you face with the weather API?"
- "Explain the Firebase real-time database setup"

### Database & Backend
- SQL vs NoSQL
- MongoDB queries
- Express.js routing
- RESTful API design

### Tools & Best Practices
- Git workflow
- Code organization
- Debugging techniques
- Performance optimization

---

## 🔄 Customizing Mock Data

### Edit the JSON File

Open `backend/mock-candidate.json` and modify:

```json
{
  "candidateName": "Your Name",
  "position": "Your Position",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "projectDetails": "Your project descriptions...",
  "customQuestions": [
    "Your custom question 1",
    "Your custom question 2"
  ]
}
```

### Create Multiple Profiles

**Senior Developer:**
```json
{
  "candidateName": "Alex Johnson",
  "position": "Senior Full Stack Developer",
  "skills": ["TypeScript", "React", "Node.js", "AWS", "Docker"],
  "projectDetails": "Led development of microservices platform...",
  "customQuestions": [
    "Explain microservices architecture",
    "How do you handle scalability?"
  ]
}
```

**Backend Specialist:**
```json
{
  "candidateName": "Sarah Chen",
  "position": "Backend Engineer",
  "skills": ["Python", "Django", "PostgreSQL", "Redis", "Kafka"],
  "projectDetails": "Built high-performance API handling 1M requests/day...",
  "customQuestions": [
    "Explain database indexing",
    "How do you optimize query performance?"
  ]
}
```

---

## 🧪 Testing Tips

### 1. Test Different Skill Levels
- **Entry-level:** Focus on fundamentals, simple projects
- **Mid-level:** Mix of theory and practical experience
- **Senior-level:** Architecture, system design, leadership

### 2. Vary Project Complexity
- **Simple:** Todo app, weather app
- **Medium:** E-commerce, chat application
- **Complex:** Microservices, real-time systems

### 3. Test Custom Questions
- Provide 3-5 specific questions
- AI will naturally weave them into conversation
- Mix conceptual and practical questions

### 4. Monitor AI Responses
- Check if AI adapts to skill level
- Verify follow-up questions are relevant
- Ensure conversation flows naturally

---

## 🐛 Troubleshooting

### Mock Data Not Loading
- Ensure backend is running: `npm start` in backend folder
- Check console for errors
- Verify API endpoint: http://localhost:5000/api/health

### AI Not Asking Relevant Questions
- Review the skills array - be specific
- Add detailed project descriptions
- Include custom questions for guidance

### Session Not Found Error
- Run `test-mock-candidate.js` first to initialize
- Ensure sessionId matches in all calls
- Check backend logs for session data

### Terminal Script Errors
```bash
# Make sure you're in the backend directory
cd backend

# Check if Node.js can read the JSON file
node -e "console.log(require('./mock-candidate.json'))"

# Re-install dependencies if needed
npm install
```

---

## 📊 Expected AI Behavior

With the mock student data, the AI interviewer will:

✅ **Start with basics** - Check understanding of fundamentals  
✅ **Ask about projects** - Dive deep into the 5 projects listed  
✅ **Follow up intelligently** - Build on previous answers  
✅ **Adjust difficulty** - Match entry-level expectations  
✅ **Include custom questions** - Naturally incorporate them  
✅ **Stay encouraging** - Provide positive, constructive feedback  

---

## 🎬 Quick Start Workflow

**Complete flow in 5 steps:**

1. **Ensure servers are running:**
   - Backend: http://localhost:5000 ✅
   - Frontend: http://localhost:5174 ✅

2. **Open frontend** in browser

3. **Click "Load Sample Student Data"** (green button)

4. **Review** the auto-filled form

5. **Click "Start AI Interview"** and begin!

---

## 📚 Sample Answers for Testing

When testing with the mock data, use these sample answers:

**Q: Tell me about yourself**
> "I'm Priya Sharma, a B.Tech CSE student graduating in 2026. I've built 5 projects including an e-commerce website, task management app, and chat application using React, Node.js, and Firebase."

**Q: Explain React hooks**
> "I've used hooks like useState and useEffect in my projects. In my task management app, I used useState to manage task data and useEffect to fetch tasks from MongoDB when the component loads."

**Q: Describe your most complex project**
> "My chat application was the most complex. I used React and Firebase Realtime Database to implement real-time messaging, user authentication, and online/offline status indicators."

---

## 💡 Pro Tips

1. **Load Mock Data First** - Click the button before typing anything
2. **Review Before Submit** - Check all fields are filled correctly
3. **Test Voice Features** - Grant microphone permission for full experience
4. **Use Terminal Scripts** - Great for quick API testing
5. **Customize Questions** - Tailor to specific interview focus areas
6. **Monitor Backend Logs** - Watch AI's thought process in real-time

---

## 🔗 Related Files

- `README.md` - Complete project documentation
- `VOICE_FEATURES.md` - Voice interaction guide
- `AUTO_SUBMIT_FEATURE.md` - Auto-submit documentation
- `backend/server.js` - API implementation
- `frontend/src/pages/InterviewSetup.jsx` - Setup UI with load button

---

## 📞 Support

If you encounter issues:
1. Check backend logs in terminal
2. Verify all dependencies installed
3. Ensure OpenAI API key is valid
4. Test API health: http://localhost:5000/api/health
5. Review browser console for frontend errors

Happy Testing! 🚀
