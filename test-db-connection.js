const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection...');
console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Found in .env' : 'NOT FOUND');

async function testConnection() {
    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('📊 Connection details:');
        console.log('   - Host:', mongoose.connection.host);
        console.log('   - Database:', mongoose.connection.name);
        console.log('   - Ready State:', mongoose.connection.readyState);
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Available collections:', collections.map(c => c.name));
        
        await mongoose.connection.close();
        console.log('✅ Connection closed successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('   Error:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.error('🔐 Authentication issue - check username/password');
        } else if (error.message.includes('network')) {
            console.error('🌐 Network issue - check internet connection and MongoDB Atlas network access');
        } else if (error.message.includes('timeout')) {
            console.error('⏰ Connection timeout - check MongoDB Atlas cluster status');
        }
        
        process.exit(1);
    }
}

testConnection();