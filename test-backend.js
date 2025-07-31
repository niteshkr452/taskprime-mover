const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
async function testConnection() {
    try {
        console.log('🔄 Testing MongoDB Atlas connection...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Test Contact model
        const Contact = require('./models/Contact');
        
        // Create a test contact
        const testContact = new Contact({
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Subject for Backend',
            message: 'This is a test message to verify the backend is working correctly.'
        });
        
        // Save test contact
        const savedContact = await testContact.save();
        console.log('✅ Test contact saved successfully!');
        console.log('📄 Contact ID:', savedContact._id);
        
        // Retrieve the contact
        const retrievedContact = await Contact.findById(savedContact._id);
        console.log('✅ Contact retrieved successfully!');
        console.log('📧 Contact details:', {
            name: retrievedContact.name,
            email: retrievedContact.email,
            subject: retrievedContact.subject,
            submittedAt: retrievedContact.submittedAt
        });
        
        // Clean up - delete test contact
        await Contact.findByIdAndDelete(savedContact._id);
        console.log('✅ Test contact cleaned up successfully!');
        
        // Test contact statistics
        const totalContacts = await Contact.countDocuments();
        console.log('📊 Total contacts in database:', totalContacts);
        
        console.log('\n🎉 All tests passed! Backend is ready to work.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('MONGODB_URI')) {
            console.log('\n💡 Please make sure to:');
            console.log('1. Update MONGODB_URI in .env file with your actual MongoDB Atlas connection string');
            console.log('2. Replace <username>, <password>, and <dbname> with actual values');
            console.log('3. Ensure your IP is whitelisted in MongoDB Atlas Network Access');
        }
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Test API endpoints
async function testAPI() {
    console.log('\n🔄 Testing API endpoints...');
    
    const testData = {
        name: 'API Test User',
        email: 'apitest@example.com',
        subject: 'API Test Subject',
        message: 'This is a test message from API testing.'
    };
    
    try {
        // Test local server
        const response = await fetch('http://localhost:5000/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ API test successful!');
            console.log('📄 Response:', result);
        } else {
            console.log('❌ API test failed:', result);
        }
        
    } catch (error) {
        console.log('❌ API test failed:', error.message);
        console.log('💡 Make sure the server is running with: npm start');
    }
}

// Run tests
console.log('🚀 Starting PrimeTask Movers Backend Tests...\n');
testConnection();

// Uncomment the line below to test API (make sure server is running first)
// setTimeout(testAPI, 2000);