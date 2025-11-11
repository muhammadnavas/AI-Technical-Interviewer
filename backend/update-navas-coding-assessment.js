#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateNavasInCandidateDB() {
    console.log('🔄 Updating Navas profile in candidate database...');
    
    try {
        // Read the updated profile from the JSON file
        const profilePath = path.join(__dirname, 'candidate-profiles', 'navas-profile.json');
        const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        
        console.log('✅ Loaded updated profile from file');
        console.log(`   Candidate: ${profileData.candidateName}`);
        console.log(`   Candidate ID: ${profileData.candidateId}`);
        
        // Connect to MongoDB
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(process.env.MONGO_DB_NAME || 'ai_interviewer');
        
        // Update ONLY in candidates collection - code editor will access from here
        const candidatesCollection = db.collection('candidates');
        
        const candidateResult = await candidatesCollection.updateOne(
            { candidateId: profileData.candidateId },
            { 
                $set: {
                    ...profileData,
                    updatedAt: new Date().toISOString()
                }
            },
            { upsert: true }
        );
        
        console.log('✅ Updated candidates collection (single source of truth)');
        console.log(`   Matched: ${candidateResult.matchedCount}, Modified: ${candidateResult.modifiedCount}, Upserted: ${candidateResult.upsertedCount}`);
        
        // Verify the update by reading back from database
        const updatedCandidate = await candidatesCollection.findOne({ candidateId: profileData.candidateId });
        
        console.log('');
        console.log('🎯 DATABASE VERIFICATION:');
        console.log('  ========================');
        console.log(`  Candidate Name: ${updatedCandidate.candidateName}`);
        console.log(`  Candidate ID: ${updatedCandidate.candidateId}`);
        console.log(`  Position: ${updatedCandidate.position}`);
        console.log(`  Experience: ${updatedCandidate.experience}`);
        console.log(`  Skills: ${updatedCandidate.skills.length} skills`);
        console.log(`  Projects: ${updatedCandidate.projects.length} projects`);
        console.log(`  Languages: ${updatedCandidate.languages.join(', ')}`);
        
        if (updatedCandidate.codingAssessment) {
            console.log('');
            console.log('📝 CODING ASSESSMENT:');
            console.log('  ===================');
            console.log(`  Difficulty: ${updatedCandidate.codingAssessment.difficulty}`);
            console.log(`  Language: ${updatedCandidate.codingAssessment.language}`);
            console.log(`  Time per Question: ${updatedCandidate.codingAssessment.timePerQuestion}s`);
            console.log(`  Total Questions: ${updatedCandidate.codingAssessment.questions.length}`);
            
            updatedCandidate.codingAssessment.questions.forEach((q, i) => {
                console.log(`  ${i + 1}. ${q.title} (${q.difficulty})`);
                console.log(`     Time Limit: ${q.timeLimit}s`);
                console.log(`     Test Cases: ${q.testCases?.length || 0} cases`);
                console.log(`     Sample Tests: ${q.sampleTests?.length || 0} tests`);
                console.log(`     Hidden Tests: ${q.hiddenTests?.length || 0} tests`);
            });
        }
        
        console.log('');
        console.log('🔧 CODE EDITOR CONFIGURATION:');
        console.log('  ============================');
        console.log('  ✅ Coding questions stored in candidate profile');
        console.log('  ✅ Code editor will access directly from candidate collection');
        console.log('  ✅ No separate code_questions collection needed');
        
        console.log('');
        console.log('✅ ALL DATABASE UPDATES COMPLETED!');
        console.log('');
        console.log('🚀 READY FOR INTERVIEW:');
        console.log('  ======================');
        console.log(`  Use Candidate ID: ${profileData.candidateId}`);
        console.log('  Coding questions stored in candidate profile');
        console.log('  Code editor will access from candidates collection');
        console.log('  Session access already configured');
        console.log('  Single source of truth established');
        
        await client.close();
        console.log('📤 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error updating candidate database:', error);
        process.exit(1);
    }
}

// Run the update
updateNavasInCandidateDB();
