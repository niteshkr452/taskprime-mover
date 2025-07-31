const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();


const adminRoutes = require('./admin');

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Contact form specific rate limiting
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 contact form submissions per 15 minutes
    message: {
        success: false,
        message: 'Too many contact form submissions. Please try again later.'
    }
});

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('.'));

// MongoDB Connection
console.log('🔄 Connecting to MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
});

// Email transporter setup
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Import Contact model
const Contact = require('./models/Contact');

// Routes
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Contact form submission endpoint
app.post('/contact', contactLimiter, async (req, res) => {
    try {
        const { name, email, subject, message, phone } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, subject, and message are required fields'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Create new contact entry
        const newContact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            phone: phone?.trim() || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });

        // Save to database
        const savedContact = await newContact.save();

        console.log('✅ New contact form submission:', {
            id: savedContact._id,
            name: savedContact.name,
            email: savedContact.email,
            subject: savedContact.subject,
            timestamp: savedContact.createdAt
        });

        // Send confirmation email to user
        try {
            const transporter = createEmailTransporter();
            
            // Email to user (confirmation)
            const userEmailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Thank you for contacting PrimeTask Movers!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c5aa0; margin: 0;">PrimeTask Movers</h1>
                            <p style="color: #666; margin: 5px 0;">Professional Moving & Packing Services</p>
                        </div>
                        
                        <h2 style="color: #333;">Thank you for contacting us!</h2>
                        
                        <p>Dear <strong>${name}</strong>,</p>
                        
                        <p>We have received your inquiry and our team will get back to you within 24 hours.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #2c5aa0; margin-top: 0;">Your Message Details:</h3>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p><strong>Message:</strong></p>
                            <p style="background-color: white; padding: 15px; border-left: 4px solid #2c5aa0; margin: 10px 0;">${message}</p>
                            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                            <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        </div>
                        
                        <div style="background-color: #e8f4fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #2c5aa0; margin-top: 0;">Contact Information</h3>
                            <p><strong>📞 Phone:</strong> +91 9523882805</p>
                            <p><strong>📧 Email:</strong> primetaskmover121@gmail.com</p>
                            <p><strong>🌐 Website:</strong> www.primetaskmovers.com</p>
                        </div>
                        
                        <p>For urgent inquiries, please call us directly at <strong>+91 9523882805</strong>.</p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        
                        <div style="text-align: center; color: #666; font-size: 14px;">
                            <p>Best regards,<br><strong>PrimeTask Movers Team</strong></p>
                            <p>Your trusted moving partner in India</p>
                        </div>
                    </div>
                `
            };

            // Email to admin (notification)
            const adminEmailOptions = {
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_ADMIN,
                subject: `New Contact Form Submission - ${subject}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #d9534f;">🚨 New Contact Form Submission</h2>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">Contact Details:</h3>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                            ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                            <p><strong>IP Address:</strong> ${req.ip || 'Unknown'}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h3 style="color: #856404; margin-top: 0;">Message:</h3>
                            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="mailto:${email}?subject=Re: ${subject}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reply to Customer</a>
                        </div>
                    </div>
                `
            };

            // Send both emails
            await Promise.all([
                transporter.sendMail(userEmailOptions),
                transporter.sendMail(adminEmailOptions)
            ]);

            console.log('✅ Confirmation emails sent successfully');

        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError.message);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We have received your message and will get back to you soon. A confirmation email has been sent to your email address.',
            data: {
                id: savedContact._id,
                submittedAt: savedContact.createdAt,
                confirmationSent: true
            }
        });

    } catch (error) {
        console.error('❌ Error processing contact form:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later or contact us directly at +91 9523882805.'
        });
    }
});

// Get all contacts (admin endpoint)
app.get('/api/contacts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        
        const query = status ? { status } : {};
        const skip = (page - 1) * limit;
        
        const contacts = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await Contact.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: contacts,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('❌ Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get single contact
app.get('/api/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        
        // Mark as read if it's new
        if (contact.status === 'new') {
            await contact.markAsRead();
        }
        
        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('❌ Error fetching contact:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'PrimeTask Movers Backend is running!',
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        version: process.env.APP_VERSION || '1.0.0'
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'PrimeTask Movers API',
        version: process.env.APP_VERSION || '1.0.0',
        endpoints: {
            'POST /contact': 'Submit contact form',
            'GET /api/contacts': 'Get all contacts (admin)',
            'GET /api/contacts/:id': 'Get single contact (admin)',
            'GET /health': 'Health check',
            'GET /api': 'API information'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PrimeTask Movers Backend running on port ${PORT}`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
    console.log(`📧 Email: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
    console.log(`🛡️  Security: Rate limiting enabled`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});

module.exports = app;