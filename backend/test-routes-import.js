// Simple test to check if email routes can be imported
import express from 'express';

async function testEmailRoutesImport() {
    try {
        console.log('📧 Testing email routes import...');
        
        // Try to import the email routes
        const emailRoutesModule = await import('./routes/email.js');
        console.log('✅ Email routes imported successfully');
        console.log('Module keys:', Object.keys(emailRoutesModule));
        console.log('Default export exists:', !!emailRoutesModule.default);
        
        // Create Express app and mount routes
        const app = express();
        app.use(express.json());
        
        if (emailRoutesModule.default) {
            app.use('/api/email', emailRoutesModule.default);
            console.log('✅ Email routes mounted successfully');
        } else {
            console.log('❌ No default export found in email routes');
        }
        
        // List all routes
        console.log('\n📋 Registered routes:');
        app._router.stack.forEach((middleware) => {
            if (middleware.route) {
                console.log(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
            } else if (middleware.name === 'router') {
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
                        const path = middleware.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^', '');
                        console.log(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${path}${handler.route.path}`);
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Error testing email routes:', error);
    }
}

testEmailRoutesImport();