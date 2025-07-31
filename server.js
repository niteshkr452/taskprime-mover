const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

const MAX_PORT_RETRIES = 5;
let currentPort = parseInt(process.env.PORT, 10) || 5001;
let retries = 0;

function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`🚀 PrimeTask Movers Backend running on port ${port}`);
        console.log(`📍 Server URL: http://localhost:${port}`);
        console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            if (retries < MAX_PORT_RETRIES) {
                console.warn(`⚠️ Port ${port} is in use, trying port ${port + 1}...`);
                retries++;
                startServer(port + 1);
            } else {
                console.error(`❌ Port ${port} is already in use. Max retries reached.`);
                console.error('Please stop the process using this port or change the port number.');
                process.exit(1);
            }
        } else {
            console.error('❌ Server error:', error);
        }
    });

    return server;
}

const server = startServer(currentPort);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});
