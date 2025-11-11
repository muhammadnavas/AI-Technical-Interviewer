import dotenv from 'dotenv';
import emailService from './utils/emailService.js';

dotenv.config();

const testEmailFunctionality = async () => {
    console.log('🧪 Testing Email Functionality...\n');

    // Test configuration
    console.log('📧 Email Configuration:');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL || '❌ Missing');
    console.log('');

    // Test candidate data
    const testCandidate = {
        name: 'John Doe',
        email: 'navasns0409@gmail.com', // Using your email for testing
        candidateId: 'test_candidate_123'
    };

    const testSessionUrl = 'http://localhost:5173?candidateId=test_candidate_123&sessionId=test_session_456';

    const testSessionDetails = {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        duration: 120,
        sessionId: 'test_session_456'
    };

    try {
        console.log('📤 Sending test session invite email...');
        console.log(`To: ${testCandidate.email}`);
        console.log(`URL: ${testSessionUrl}`);
        console.log('');

        const result = await emailService.sendSessionInvite(
            testCandidate,
            testSessionUrl,
            testSessionDetails
        );

        if (result.success) {
            console.log('✅ EMAIL SENT SUCCESSFULLY!');
            console.log('Message ID:', result.messageId);
            console.log('Recipient:', result.recipient);
            console.log('Session URL:', result.sessionUrl);
        } else {
            console.log('❌ EMAIL FAILED!');
            console.log('Error:', result.error);
        }

    } catch (error) {
        console.log('💥 EMAIL TEST CRASHED!');
        console.error('Error:', error.message);
    }

    console.log('\n🧪 Email test completed.');
};

// Run the test
testEmailFunctionality();