# Email Service Production URL Configuration

## Changes Made

### 1. **Backend Email Routes** (`routes/email.js`)
- Updated to prioritize `PRODUCTION_FRONTEND_URL` over `FRONTEND_URL`
- All session URLs in emails now use production URL: `https://ai-technical-interviewer.vercel.app`
- Fallback chain: Production URL → Development URL → Localhost

### 2. **Email Service** (`utils/emailService.js`)
- Added `getFrontendUrl()` method for consistent URL generation
- Constructor now sets `frontendBaseUrl` with production priority
- More robust URL handling for different environments

### 3. **Environment Configuration** (`.env`)
```properties
# Production Frontend URL (prioritized for email links)
PRODUCTION_FRONTEND_URL=https://ai-technical-interviewer.vercel.app
# Local development URL  
FRONTEND_URL=http://localhost:5173
```

### 4. **Test Script** (`test-email.js`)
- Updated test URLs to use production domain
- Validates that emails contain correct production URLs

## URL Priority Logic

```javascript
const baseUrl = process.env.PRODUCTION_FRONTEND_URL || 
                process.env.FRONTEND_URL || 
                'http://localhost:5173';
```

## Email URLs Now Generated

### Before (Local):
- `http://localhost:5173?candidateId=xxx&sessionId=yyy`

### After (Production):
- `https://ai-technical-interviewer.vercel.app?candidateId=xxx&sessionId=yyy`

## Frontend Configuration

The Recruiter frontend already uses production backend URLs:
- Production: `https://ai-technical-interviewer.onrender.com/api`
- Development: `http://localhost:5000/api`

## Test Results

✅ **Email sent successfully with production URL**
- Message ID: `a1413c07-276c-47ac-a0f5-65930f43de74`
- URL: `https://ai-technical-interviewer.vercel.app?candidateId=test_candidate_123&sessionId=test_session_456`
- Recipient gets functional production link instead of broken localhost link

## Benefits

1. **Professional URLs**: Candidates receive working production links
2. **No Local Dependencies**: No need for localhost in production emails
3. **Environment Flexibility**: Automatically adapts to deployment environment
4. **Better UX**: Direct access to live interview platform
5. **Proper Fallback**: Graceful degradation for different environments

## API Endpoints Available

- `POST /api/email/send-candidate-session` - Send session URL to candidate
- `POST /api/email/send-session-invite` - Send scheduled session invite
- `GET /api/email/logs/:candidateId` - View email history
- `GET /api/email/status/:sessionId` - Check email delivery status

All endpoints now generate production URLs for optimal candidate experience.