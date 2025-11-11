import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
app.use(express.json());

// Test if email routes can be imported and mounted independently
async function testEmailRoutes() {
    try {
        console.log('📧 Testing email routes import...');
        
        // Import email routes
        const emailRoutes = await import('./routes/email.js');
        console.log('✅ Email routes imported successfully');
        
        // Mount routes
        app.use('/api/email', emailRoutes.default);
        console.log('✅ Email routes mounted successfully');
        
        // Start test server
        const port = 3001;
        app.listen(port, () => {
            console.log(`🚀 Test server running on port ${port}`);
            console.log(`🧪 Test endpoint: http://localhost:${port}/api/email/test`);
            console.log('💡 Press Ctrl+C to stop the test server');
        });
        
    } catch (error) {
        console.error('❌ Error testing email routes:', error);
        process.exit(1);
    }
}

testEmailRoutes();