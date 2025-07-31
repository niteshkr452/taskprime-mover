const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the project's root directory
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        console.log("💡 Possible solutions:");
        console.log("   1. Check if your IP address is whitelisted in MongoDB Atlas");
        console.log("   2. Verify your MongoDB connection string");
        console.log("   3. Check your network connection");
    });

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Import Contact Model
const ContactModel = require('./mongoose');

// API Endpoint to Handle Form Submission
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                message: "❌ All fields are required."
            });
        }

        // Create a new contact instance
        const newContact = new ContactModel({
            name,
            email,
            subject,
            message
        });

        // Save the contact to the database
        await newContact.save();

        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to your own email
            subject: `New Contact Form Submission: ${subject}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
            `
        };

        // Send confirmation email to the user
        const confirmationMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting Prime Task Movers',
            html: `
                <h3>Thank you for contacting us!</h3>
                <p>Dear ${name},</p>
                <p>We have received your message and will get back to you soon.</p>
                <p><strong>Your message:</strong></p>
                <p><em>${message}</em></p>
                <br>
                <p>Best regards,<br>Prime Task Movers Team</p>
            `
        };

        // Send both emails
        await Promise.all([
            transporter.sendMail(mailOptions),
            transporter.sendMail(confirmationMailOptions)
        ]);

        res.status(201).json({
            message: "✅ Your message has been sent successfully! We'll get back to you soon."
        });

    } catch (err) {
        console.error("❌ Error processing contact form:", err);
        console.error("❌ Error details:", err.message);
        console.error("❌ Stack trace:", err.stack);
        res.status(500).json({
            message: "❌ An error occurred while sending your message. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// The express.static middleware will automatically serve index.html for the root path '/'
// and also handle all other static files like about.html, contact.html, and everything in /assets.

// Start Server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
