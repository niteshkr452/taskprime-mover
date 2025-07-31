const mongoose = require('mongoose');

// Contact Schema
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    phone: {
        type: String,
        trim: true,
        default: null,
        validate: {
            validator: function(v) {
                return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
            },
            message: 'Please provide a valid phone number'
        }
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        minlength: [5, 'Subject must be at least 5 characters long'],
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        minlength: [10, 'Message must be at least 10 characters long'],
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    source: {
        type: String,
        enum: ['website', 'mobile', 'api'],
        default: 'website'
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date,
        default: null
    },
    responseTime: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: null,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Indexes for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ subject: 'text', message: 'text' }); // Text search

// Virtual for formatted date
contactSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    });
});

// Virtual for response time calculation
contactSchema.virtual('responseTimeHours').get(function() {
    if (!this.responseTime) return null;
    const diffMs = this.responseTime - this.createdAt;
    return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100; // Hours with 2 decimal places
});

// Method to mark as read
contactSchema.methods.markAsRead = function() {
    this.status = 'read';
    return this.save();
};

// Method to mark as replied
contactSchema.methods.markAsReplied = function() {
    this.status = 'replied';
    this.responseTime = new Date();
    return this.save();
};

// Method to mark as archived
contactSchema.methods.markAsArchived = function() {
    this.status = 'archived';
    return this.save();
};

// Method to set priority
contactSchema.methods.setPriority = function(priority) {
    if (['low', 'medium', 'high', 'urgent'].includes(priority)) {
        this.priority = priority;
        return this.save();
    }
    throw new Error('Invalid priority level');
};

// Method to add notes
contactSchema.methods.addNote = function(note) {
    this.notes = note;
    return this.save();
};

// Static method to get contacts by status
contactSchema.statics.getByStatus = function(status) {
    return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get contacts by priority
contactSchema.statics.getByPriority = function(priority) {
    return this.find({ priority }).sort({ createdAt: -1 });
};

// Static method to get recent contacts
contactSchema.statics.getRecent = function(limit = 10) {
    return this.find().sort({ createdAt: -1 }).limit(limit);
};

// Static method to get unread contacts
contactSchema.statics.getUnread = function() {
    return this.find({ status: 'new' }).sort({ createdAt: -1 });
};

// Static method to search contacts
contactSchema.statics.search = function(query) {
    return this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { subject: { $regex: query, $options: 'i' } },
            { message: { $regex: query, $options: 'i' } }
        ]
    }).sort({ createdAt: -1 });
};

// Static method to get statistics
contactSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const total = await this.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.countDocuments({ createdAt: { $gte: today } });
    
    return {
        total,
        today: todayCount,
        byStatus: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {})
    };
};

// Pre-save middleware
contactSchema.pre('save', function(next) {
    if (this.isNew) {
        console.log(`📧 New contact form submission from: ${this.email}`);
        
        // Auto-set priority based on keywords
        const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately'];
        const highKeywords = ['important', 'priority', 'soon'];
        
        const text = (this.subject + ' ' + this.message).toLowerCase();
        
        if (urgentKeywords.some(keyword => text.includes(keyword))) {
            this.priority = 'urgent';
        } else if (highKeywords.some(keyword => text.includes(keyword))) {
            this.priority = 'high';
        }
    }
    next();
});

// Post-save middleware to update email sent status
contactSchema.post('save', function(doc) {
    if (doc.isNew && doc.emailSent) {
        doc.emailSentAt = new Date();
        doc.save();
    }
});

// Export the model
module.exports = mongoose.model('Contact', contactSchema);