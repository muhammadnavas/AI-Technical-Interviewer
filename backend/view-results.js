// View saved interview results
// Usage: node view-results.js [filename]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resultsDir = path.join(__dirname, 'interview-results');

// Get filename from command line argument
const fileName = process.argv[2];

if (fileName) {
    // View specific interview
    viewInterview(fileName);
} else {
    // List all interviews
    listInterviews();
}

function listInterviews() {
    console.log('\n📁 Saved Interview Results\n');
    console.log('═'.repeat(80));
    
    if (!fs.existsSync(resultsDir)) {
        console.log('❌ No interview results found. The results directory does not exist.');
        return;
    }

    const files = fs.readdirSync(resultsDir);
    const interviews = files.filter(file => file.endsWith('.json'));

    if (interviews.length === 0) {
        console.log('❌ No interview results found.');
        console.log('\n💡 Complete an interview to generate results.');
        return;
    }

    interviews.forEach((file, index) => {
        try {
            const filePath = path.join(resultsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            console.log(`\n${index + 1}. ${file}`);
            console.log('   ├─ Candidate:', data.candidateInfo.name);
            console.log('   ├─ Position:', data.candidateInfo.position);
            console.log('   ├─ Date:', new Date(data.savedAt).toLocaleString());
            console.log('   ├─ Duration:', data.interviewDetails.duration);
            console.log('   └─ Questions:', data.interviewDetails.totalQuestions);
        } catch (error) {
            console.log(`\n${index + 1}. ${file} - Error reading file`);
        }
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`\n📊 Total Interviews: ${interviews.length}`);
    console.log(`\n💡 To view details: node view-results.js <filename>`);
    console.log(`   Example: node view-results.js ${interviews[0]}\n`);
}

function viewInterview(fileName) {
    const filePath = path.join(resultsDir, fileName);

    if (!fs.existsSync(filePath)) {
        console.log(`\n❌ Interview result not found: ${fileName}`);
        console.log('\n💡 Run without arguments to see all available interviews:\n   node view-results.js\n');
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        console.log('\n' + '═'.repeat(80));
        console.log('📄 INTERVIEW RESULT DETAILS');
        console.log('═'.repeat(80));

        // Candidate Information
        console.log('\n👤 CANDIDATE INFORMATION');
        console.log('─'.repeat(80));
        console.log('Name:', data.candidateInfo.name);
        console.log('Position:', data.candidateInfo.position);
        console.log('Skills:', data.candidateInfo.skills.join(', '));
        
        if (data.candidateInfo.projectDetails) {
            console.log('\nProject Experience:');
            console.log(data.candidateInfo.projectDetails.substring(0, 200) + '...');
        }

        // Interview Details
        console.log('\n⏱️  INTERVIEW DETAILS');
        console.log('─'.repeat(80));
        console.log('Start Time:', new Date(data.interviewDetails.startTime).toLocaleString());
        console.log('End Time:', new Date(data.interviewDetails.endTime).toLocaleString());
        console.log('Duration:', data.interviewDetails.duration);
        console.log('Questions Asked:', data.interviewDetails.totalQuestions);
        console.log('Answers Given:', data.interviewDetails.totalAnswers);
        console.log('Total Messages:', data.interviewDetails.totalMessages);

        // Conversation Preview
        console.log('\n💬 CONVERSATION TRANSCRIPT');
        console.log('─'.repeat(80));

        data.fullTranscript.forEach((msg, index) => {
            if (index === 0) {
                console.log(`\n${msg.role}:`);
                console.log(msg.message);
            } else {
                console.log(`\n${msg.role}:`);
                // Truncate long messages for better readability
                const message = msg.message.length > 200 
                    ? msg.message.substring(0, 200) + '...' 
                    : msg.message;
                console.log(message);
            }
        });

        console.log('\n' + '═'.repeat(80));
        console.log(`\n📁 Full results saved in: ${fileName}`);
        console.log(`📍 Location: ${filePath}\n`);

        // Export options
        console.log('💡 TIP: You can also view this file in:');
        console.log('   - Any JSON viewer');
        console.log('   - VS Code (with JSON formatting)');
        console.log('   - Browser (drag and drop the file)\n');

    } catch (error) {
        console.log(`\n❌ Error reading interview result: ${error.message}\n`);
    }
}
