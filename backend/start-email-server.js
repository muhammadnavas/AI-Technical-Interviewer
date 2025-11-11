// Quick test script to verify email functionality locally
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = 3333;

// Enable CORS for recruiter frontend
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://recruiter-frontend-url.vercel.app'],
    credentials: true
}));

app.use(express.json());

// Import and mount email routes
const emailRoutes = await import('./routes/email.js');
app.use('/api/email', emailRoutes.default);

app.listen(port, () => {
    console.log(`🚀 Email API Test Server running on port ${port}`);
    console.log(`🧪 Test endpoint: http://localhost:${port}/api/email/test`);
    console.log(`📧 Send email endpoint: http://localhost:${port}/api/email/send-candidate-session`);
    console.log('💡 Update your recruiter frontend to use this local backend URL temporarily');
});