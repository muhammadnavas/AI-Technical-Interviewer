import fetch from 'node-fetch';

async function testLocalBackend() {
    console.log('🧪 Testing local backend on port 5001...\n');
    
    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:5001/api/health');
        console.log('Health Status:', healthResponse.status);
        const healthResult = await healthResponse.text();
        console.log('Health Response:', healthResult.substring(0, 200));
        
        // Test 2: Email test endpoint
        console.log('\n2. Testing email test endpoint...');
        const emailTestResponse = await fetch('http://localhost:5001/api/email/test');
        console.log('Email Test Status:', emailTestResponse.status);
        const emailTestResult = await emailTestResponse.text();
        console.log('Email Test Response:', emailTestResult.substring(0, 200));
        
        // Test 3: Try sending email for navas
        console.log('\n3. Testing send candidate session email...');
        const sendEmailResponse = await fetch('http://localhost:5001/api/email/send-candidate-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidateId: 'navas',
                recruiterEmail: 'test@example.com',
                message: 'Test interview session'
            })
        });
        
        console.log('Send Email Status:', sendEmailResponse.status);
        const sendEmailResult = await sendEmailResponse.text();
        console.log('Send Email Response:', sendEmailResult.substring(0, 400));
        
    } catch (error) {
        console.error('❌ Error testing local backend:', error.message);
    }
}

testLocalBackend();