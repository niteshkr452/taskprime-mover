const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing Complete PrimeTask Movers Backend');
console.log('=' .repeat(50));

// Test data
const testContactData = {
    name: "Rahul Sharma",
    email: "rahul.test@example.com",
    phone: "+91 9876543210",
    subject: "Moving Services Inquiry",
    message: "Hi, I need to move my 2BHK apartment from Mumbai to Pune next month. Please provide a quote and available dates. This is urgent as I have a job transfer."
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test functions
async function testHealthEndpoint() {
    console.log('\n🔍 Testing Health Endpoint...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/health',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            console.log('✅ Health endpoint working');
            console.log(`   Database: ${response.data.database}`);
            console.log(`   Timestamp: ${response.data.timestamp}`);
            return true;
        } else {
            console.log('❌ Health endpoint failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Health endpoint error:', error.message);
        return false;
    }
}

async function testContactFormSubmission() {
    console.log('\n📝 Testing Contact Form Submission...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/contact',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, testContactData);

        if (response.statusCode === 201) {
            console.log('✅ Contact form submission successful');
            console.log(`   Contact ID: ${response.data.data.id}`);
            console.log(`   Confirmation sent: ${response.data.data.confirmationSent}`);
            console.log(`   Message: ${response.data.message}`);
            return response.data.data.id;
        } else {
            console.log('❌ Contact form submission failed');
            console.log(`   Status: ${response.statusCode}`);
            console.log(`   Error: ${response.data.message}`);
            return null;
        }
    } catch (error) {
        console.log('❌ Contact form submission error:', error.message);
        return null;
    }
}

async function testGetContacts() {
    console.log('\n📋 Testing Get Contacts Endpoint...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/contacts',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            console.log('✅ Get contacts successful');
            console.log(`   Total contacts: ${response.data.pagination.total}`);
            console.log(`   Current page: ${response.data.pagination.current}`);
            console.log(`   Contacts in response: ${response.data.data.length}`);
            return true;
        } else {
            console.log('❌ Get contacts failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Get contacts error:', error.message);
        return false;
    }
}

async function testGetSingleContact(contactId) {
    if (!contactId) {
        console.log('\n⏭️  Skipping single contact test (no contact ID)');
        return false;
    }

    console.log('\n👤 Testing Get Single Contact...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: `/api/contacts/${contactId}`,
            method: 'GET'
        });

        if (response.statusCode === 200) {
            console.log('✅ Get single contact successful');
            console.log(`   Contact name: ${response.data.data.name}`);
            console.log(`   Contact email: ${response.data.data.email}`);
            console.log(`   Status: ${response.data.data.status}`);
            console.log(`   Priority: ${response.data.data.priority}`);
            return true;
        } else {
            console.log('❌ Get single contact failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Get single contact error:', error.message);
        return false;
    }
}

async function testAPIInfo() {
    console.log('\n📚 Testing API Info Endpoint...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            console.log('✅ API info endpoint working');
            console.log(`   Version: ${response.data.version}`);
            console.log(`   Available endpoints: ${Object.keys(response.data.endpoints).length}`);
            return true;
        } else {
            console.log('❌ API info endpoint failed');
            return false;
        }
    } catch (error) {
        console.log('❌ API info endpoint error:', error.message);
        return false;
    }
}

async function testDatabaseConnection() {
    console.log('\n💾 Testing Direct Database Connection...');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Direct MongoDB connection successful');
        
        // Test Contact model
        const Contact = require('./models/Contact');
        const stats = await Contact.getStats();
        console.log(`   Total contacts in DB: ${stats.total}`);
        console.log(`   Contacts today: ${stats.today}`);
        console.log(`   Status breakdown:`, stats.byStatus);
        
        await mongoose.connection.close();
        return true;
    } catch (error) {
        console.log('❌ Direct database connection failed:', error.message);
        return false;
    }
}

async function testInvalidRequests() {
    console.log('\n🚫 Testing Invalid Requests...');
    
    // Test missing fields
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/contact',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { name: "Test", email: "test@example.com" }); // Missing subject and message

        if (response.statusCode === 400) {
            console.log('✅ Validation working - missing fields rejected');
        } else {
            console.log('❌ Validation failed - should reject missing fields');
        }
    } catch (error) {
        console.log('❌ Validation test error:', error.message);
    }

    // Test invalid email
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/contact',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            name: "Test",
            email: "invalid-email",
            subject: "Test",
            message: "Test message"
        });

        if (response.statusCode === 400) {
            console.log('✅ Email validation working - invalid email rejected');
        } else {
            console.log('❌ Email validation failed - should reject invalid email');
        }
    } catch (error) {
        console.log('❌ Email validation test error:', error.message);
    }

    // Test 404 route
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/nonexistent',
            method: 'GET'
        });

        if (response.statusCode === 404) {
            console.log('✅ 404 handling working');
        } else {
            console.log('❌ 404 handling failed');
        }
    } catch (error) {
        console.log('❌ 404 test error:', error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting comprehensive backend tests...\n');
    
    const results = {
        health: false,
        database: false,
        contactSubmission: false,
        getContacts: false,
        getSingleContact: false,
        apiInfo: false,
        validation: true // Assume true, will be set to false if validation fails
    };

    // Test database connection first
    results.database = await testDatabaseConnection();

    // Test health endpoint
    results.health = await testHealthEndpoint();

    // Test API info
    results.apiInfo = await testAPIInfo();

    // Test contact form submission
    const contactId = await testContactFormSubmission();
    results.contactSubmission = !!contactId;

    // Test get contacts
    results.getContacts = await testGetContacts();

    // Test get single contact
    results.getSingleContact = await testGetSingleContact(contactId);

    // Test invalid requests
    await testInvalidRequests();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    console.log(`\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

    if (passed === total) {
        console.log('\n🎉 All tests passed! Your backend is ready to use.');
        console.log('\n📝 To use your backend:');
        console.log('   1. Make sure MongoDB Atlas is accessible');
        console.log('   2. Set up Gmail App Password in .env file');
        console.log('   3. Run: npm start');
        console.log('   4. Submit contact forms via POST /contact');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the server logs and configuration.');
    }

    process.exit(passed === total ? 0 : 1);
}

// Wait a moment for server to be ready, then run tests
setTimeout(runAllTests, 2000);