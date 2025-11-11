// Quick test to verify the email endpoint is working
import fetch from 'node-fetch';

async function testEmailEndpoint() {
    console.log('🧪 Testing email endpoint on localhost:3333...\n');
    
    const baseUrl = 'http://localhost:3333/api';
    
    // Test 1: Try GET request (should get 405 Method Not Allowed)
    console.log('1. Testing GET request (should fail):');
    try {
        const getResponse = await fetch(`${baseUrl}/email/send-candidate-session`);
        console.log('GET Status:', getResponse.status);
        const getResult = await getResponse.json();
        console.log('GET Response:', getResult);
    } catch (error) {
        console.log('GET Error:', error.message);
    }
    
    console.log('\n2. Testing POST request (should work):');
    try {
        const postResponse = await fetch(`${baseUrl}/email/send-candidate-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidateId: '69134a77615d91463269ffcc', // Use the candidate ID from your error
                recruiterEmail: 'samarthhegde93@gmail.com',
                message: 'Test interview session'
            })
        });
        
        console.log('POST Status:', postResponse.status);
        const postResult = await postResponse.text();
        console.log('POST Response:', postResult.substring(0, 500));
        
    } catch (error) {
        console.log('POST Error:', error.message);
    }
}

testEmailEndpoint();