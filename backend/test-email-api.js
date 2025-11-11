import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Test the email functionality with a sample candidate
async function testEmailFunctionality() {
    console.log('🧪 Testing Email Functionality');
    console.log('================================');
    
    const testCandidateId = 'test_candidate_001'; // This matches your test candidate
    const backendUrl = process.env.PRODUCTION_BACKEND_URL || 'https://ai-technical-interviewer.onrender.com';
    
    console.log(`📡 Backend URL: ${backendUrl}`);
    console.log(`👤 Candidate ID: ${testCandidateId}`);
    
    try {
        // Test 1: Health check
        console.log('\n1. Testing backend health...');
        try {
            const healthResponse = await fetch(`${backendUrl}/api/health`);
            if (healthResponse.ok) {
                const health = await healthResponse.json();
                console.log('✅ Backend is healthy:', health);
            } else {
                console.log('⚠️ Health check failed:', healthResponse.status, await healthResponse.text());
            }
        } catch (error) {
            console.log('❌ Backend health check failed:', error.message);
        }
        
        // Test 2: Email route test endpoint
        console.log('\n2. Testing email route...');
        try {
            const testResponse = await fetch(`${backendUrl}/api/email/test`);
            if (testResponse.ok) {
                const testResult = await testResponse.json();
                console.log('✅ Email route accessible:', testResult);
            } else {
                console.log('⚠️ Email route test failed:', testResponse.status, await testResponse.text());
            }
        } catch (error) {
            console.log('❌ Email route test failed:', error.message);
        }
        
        // Test 3: Send email to candidate
        console.log('\n3. Testing email sending...');
        try {
            const emailData = {
                candidateId: testCandidateId,
                recruiterId: 'test_recruiter_001',
                companyName: 'Test Company'
            };
            
            const emailResponse = await fetch(`${backendUrl}/api/email/send-candidate-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });
            
            if (emailResponse.ok) {
                const emailResult = await emailResponse.json();
                console.log('✅ Email sent successfully:', emailResult);
            } else {
                const errorText = await emailResponse.text();
                console.log('⚠️ Email sending failed:', emailResponse.status, errorText);
                
                // Try to parse as JSON if possible
                try {
                    const errorJson = JSON.parse(errorText);
                    console.log('📄 Error details:', errorJson);
                } catch (e) {
                    console.log('📄 Raw error response:', errorText);
                }
            }
        } catch (error) {
            console.log('❌ Email sending test failed:', error.message);
        }
        
        // Test 4: Check email logs
        console.log('\n4. Testing email logs...');
        try {
            const logsResponse = await fetch(`${backendUrl}/api/email/logs`);
            if (logsResponse.ok) {
                const logs = await logsResponse.json();
                console.log('✅ Email logs accessible:', logs);
            } else {
                console.log('⚠️ Email logs failed:', logsResponse.status, await logsResponse.text());
            }
        } catch (error) {
            console.log('❌ Email logs test failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Overall test failed:', error);
    }
    
    console.log('\n🏁 Test completed');
}

// Run the test
testEmailFunctionality();