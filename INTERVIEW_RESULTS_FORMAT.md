# 📊 Interview Results - Saved JSON Format

## Overview

When you end an interview, the system automatically saves a complete JSON file with all interview data in the `backend/interview-results/` directory.

## File Structure

### Filename Format
```
interview_<CandidateName>_<Timestamp>.json
```

**Example:** `interview_Priya_Sharma_1729008765432.json`

---

## JSON Structure

### Complete Example

```json
{
  "sessionId": "session_student_67890",
  
  "candidateInfo": {
    "name": "Priya Sharma",
    "position": "Junior Frontend Developer",
    "skills": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "Git",
      "Bootstrap",
      "Tailwind CSS",
      "REST APIs",
      "Firebase"
    ],
    "projectDetails": "Project 1: E-Commerce Website...",
    "customQuestions": [
      "What is the difference between let, const, and var?",
      "Explain how React hooks work",
      "..."
    ]
  },
  
  "interviewDetails": {
    "startTime": "2025-10-15T10:30:00.000Z",
    "endTime": "2025-10-15T10:58:45.000Z",
    "duration": "28m 45s",
    "totalQuestions": 8,
    "totalAnswers": 8,
    "totalMessages": 17
  },
  
  "conversation": [
    {
      "question": "Can you tell me about your e-commerce project?",
      "answer": "I built a fully responsive online shopping website using React and Tailwind CSS...",
      "timestamp": "2025-10-15T10:32:15.000Z"
    },
    {
      "question": "How did you implement the shopping cart functionality?",
      "answer": "I used React's useState hook to manage cart state and localStorage for persistence...",
      "timestamp": "2025-10-15T10:34:22.000Z"
    }
  ],
  
  "fullTranscript": [
    {
      "sequence": 1,
      "role": "AI Interviewer",
      "message": "Hello Priya Sharma! Welcome to your technical interview...",
      "timestamp": "2025-10-15T10:30:00.000Z"
    },
    {
      "sequence": 2,
      "role": "Candidate",
      "message": "Thank you! I'm excited to be here...",
      "timestamp": "2025-10-15T10:30:45.000Z"
    }
  ],
  
  "savedAt": "2025-10-15T10:58:45.000Z"
}
```

---

## Field Descriptions

### 1. sessionId
- **Type:** String
- **Description:** Unique identifier for the interview session
- **Example:** `"session_student_67890"`

### 2. candidateInfo
Complete candidate profile submitted at interview start:

| Field | Type | Description |
|-------|------|-------------|
| name | String | Candidate's full name |
| position | String | Job position applied for |
| skills | Array | List of technical skills |
| projectDetails | String | Detailed project experience |
| customQuestions | Array | Optional custom questions provided |

### 3. interviewDetails
Interview metadata and statistics:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| startTime | ISO String | Interview start timestamp | `"2025-10-15T10:30:00.000Z"` |
| endTime | ISO String | Interview end timestamp | `"2025-10-15T10:58:45.000Z"` |
| duration | String | Human-readable duration | `"28m 45s"` |
| totalQuestions | Number | AI questions asked | `8` |
| totalAnswers | Number | Candidate answers given | `8` |
| totalMessages | Number | Total conversation messages | `17` |

### 4. conversation
Q&A pairs extracted from the full conversation:

```json
{
  "question": "AI's question text",
  "answer": "Candidate's answer text",
  "timestamp": "2025-10-15T10:32:15.000Z"
}
```

### 5. fullTranscript
Complete chronological conversation log:

```json
{
  "sequence": 1,              // Message order
  "role": "AI Interviewer",   // or "Candidate"
  "message": "Full message text",
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

### 6. savedAt
- **Type:** ISO String
- **Description:** When the results were saved
- **Example:** `"2025-10-15T10:58:45.000Z"`

---

## How to Access Results

### Method 1: View in Terminal

```bash
# List all interviews
node view-results.js

# View specific interview
node view-results.js interview_Priya_Sharma_1729008765432.json
```

### Method 2: Direct File Access

Navigate to:
```
backend/interview-results/
```

Open any `.json` file in:
- VS Code
- Any text editor
- JSON viewer
- Browser (drag and drop)

### Method 3: API Endpoint

```bash
# Get all results
curl http://localhost:5000/api/interview/results

# Get specific result
curl http://localhost:5000/api/interview/results/interview_Priya_Sharma_1729008765432.json
```

---

## Sample Use Cases

### 1. Performance Review
Analyze candidate's technical depth by reviewing Q&A pairs:
```json
"conversation": [
  {
    "question": "Explain React hooks",
    "answer": "Hooks let you use state and lifecycle features..."
  }
]
```

### 2. Interview Analytics
```json
"interviewDetails": {
  "duration": "28m 45s",
  "totalQuestions": 8
}
// Average: 3.6 minutes per question
```

### 3. Skill Assessment
```json
"candidateInfo": {
  "skills": ["React", "Node.js", "MongoDB"]
}
// Cross-reference with questions asked
```

### 4. Custom Question Coverage
Check if all custom questions were addressed:
```json
"customQuestions": [
  "Explain React hooks",
  "Difference between let/const/var"
]
```

---

## Viewing Results in Frontend (Future Enhancement)

You can create a results dashboard to display:
- List of all interviews
- Search and filter by candidate/date
- View detailed transcripts
- Export to PDF
- Compare multiple interviews

---

## File Location

**Default Directory:**
```
backend/interview-results/
```

**Permissions:** Files are saved with standard read/write permissions

**Backup:** Recommended to backup this directory regularly

---

## API Endpoints for Results

### GET `/api/interview/results`
Returns list of all saved interviews with summaries

**Response:**
```json
{
  "success": true,
  "count": 5,
  "results": [
    {
      "fileName": "interview_Priya_Sharma_1729008765432.json",
      "candidateName": "Priya Sharma",
      "position": "Junior Frontend Developer",
      "date": "2025-10-15T10:58:45.000Z",
      "duration": "28m 45s",
      "questionsAsked": 8
    }
  ]
}
```

### GET `/api/interview/results/:fileName`
Returns complete data for a specific interview

**Response:**
```json
{
  "success": true,
  "data": {
    // Complete interview data
  }
}
```

---

## Tips

✅ **DO:**
- Review full transcripts for detailed analysis
- Use timestamps to track response times
- Keep backups of important interviews
- Use conversation array for quick Q&A review

❌ **DON'T:**
- Manually edit result files (creates inconsistencies)
- Delete the interview-results directory
- Share files with sensitive information

---

## Privacy & Security

⚠️ **Important:**
- Interview results may contain personal information
- Store securely and follow data protection regulations
- Consider encryption for sensitive data
- Implement access controls as needed

---

## Example: Viewing Results

When you end an interview, you'll see:

```
✅ Interview Completed!

Candidate: Priya Sharma
Duration: 28m 45s
Questions Asked: 8

Results saved to:
interview_Priya_Sharma_1729008765432.json

Thank you for participating!
```

Then view it:
```bash
node view-results.js interview_Priya_Sharma_1729008765432.json
```

---

## Next Steps

1. **Complete an interview** - Results will auto-save
2. **Run:** `node view-results.js` to see all saved interviews
3. **Review** the JSON files for detailed analysis
4. **Build** a custom dashboard (optional)

---

**Status:** ✅ Fully Implemented and Ready to Use!
