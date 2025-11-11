import fetch from 'node-fetch';

// Test the production email API endpoint
async function testEmailAPI() {
    console.log('🧪 Testing email API endpoints...\n');
    
    // Test 1: Health check
    console.log('1. Testing email test endpoint...');
    try {
        const testResponse = await fetch('https://ai-technical-interviewer.onrender.com/api/email/test');
        const testResult = await testResponse.text();
        console.log('Status:', testResponse.status);
        console.log('Response:', testResult);
        
        if (testResponse.status === 200) {
            console.log('✅ Email routes are accessible!\n');
        } else {
            console.log('❌ Email routes not accessible\n');
        }
    } catch (error) {
        console.error('❌ Error testing email endpoint:', error.message);
    }
    
    // Test 2: Send candidate session email (if routes are accessible)
    console.log('2. Testing send candidate session email...');
    try {
        const candidateId = 'navas';
        const sendResponse = await fetch('https://ai-technical-interviewer.onrender.com/api/email/send-candidate-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ candidateId })
        });
        
        console.log('Send email status:', sendResponse.status);
        const sendResult = await sendResponse.text();
        console.log('Send email response:', sendResult);
        
    } catch (error) {
        console.error('❌ Error testing send email:', error.message);
    }
}

testEmailAPI();