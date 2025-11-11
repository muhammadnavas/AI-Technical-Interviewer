import fetch from 'node-fetch';

async function debugProductionAPI() {
    // Direct test of the email endpoint that mimics the frontend request
const testFromFrontendPerspective = async () => {
    console.log('🧪 Testing email endpoint from frontend perspective...\n');

    // This mimics exactly what the recruiter frontend should be sending
    const testPayload = {
        candidateId: '673245d4b1ae075635d5b5dc', // Use a real candidate ID
        recruiterEmail: 'samarthhegde93@gmail.com',
        message: 'Interview session URL for Developer position at TechCorp'
    };

    const backendUrl = 'http://localhost:5001/api';
    const fullUrl = `${backendUrl}/email/send-candidate-session`;
    
    console.log('📍 Backend URL:', backendUrl);
    console.log('📍 Full endpoint:', fullUrl);
    console.log('📤 Payload:', testPayload);
    console.log('');

    try {
        console.log('🚀 Making request...');
        
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer fake-token`, // Mimicking frontend auth
            },
            body: JSON.stringify(testPayload)
        });

        console.log('📥 Response Status:', response.status);
        console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS! Email endpoint working perfectly!');
            console.log('📧 Response:', JSON.stringify(result, null, 2));
        } else {
            const errorText = await response.text();
            console.log('❌ ERROR! Status:', response.status);
            console.log('❌ Error response:', errorText);
        }

    } catch (error) {
        console.error('💥 NETWORK ERROR:', error.message);
        console.log('');
        console.log('🔍 This could mean:');
        console.log('   - Backend is not running on port 5001');
        console.log('   - CORS issues');
        console.log('   - Network connectivity issues');
    }

    console.log('\n🎯 NEXT STEPS FOR FRONTEND:');
    console.log('   1. Make sure your recruiter frontend is restarted');
    console.log('   2. Clear browser cache (Ctrl+F5)');
    console.log('   3. Check browser console for the debug logs');
    console.log('   4. Verify the frontend is using http://localhost:5001/api');
};

testFromFrontendPerspective();
    
    const baseUrl = 'https://ai-technical-interviewer.onrender.com';
    
    const endpoints = [
        '/',
        '/api',
        '/api/health',
        '/api/email',
        '/api/email/test'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${baseUrl}${endpoint}`);
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'GET',
                timeout: 10000
            });
            
            console.log(`  Status: ${response.status}`);
            console.log(`  Content-Type: ${response.headers.get('content-type')}`);
            
            const text = await response.text();
            console.log(`  Response: ${text.substring(0, 100)}...`);
            console.log('---');
            
        } catch (error) {
            console.log(`  Error: ${error.message}`);
            console.log('---');
        }
    }
}

debugProductionAPI();