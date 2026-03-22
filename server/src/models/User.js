const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        // Not required at schema level — face-only accounts won't have a password
        minlength: 8,
        select: false,
    },
    role: {
        type: String,
        enum: ['artisan', 'manufacturer', 'expert', 'admin'],
        default: 'artisan',
    },
    companyName: {
        type: String,
        required: [true, 'Please provide company name'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    professionalDetails: {
        specialization: String,
        bio: String,
        yearsOfExperience: Number,
        certifications: [String],
    },
    avatarUrl: {
        type: String,
    },
    // Facial embedding: flat array of Numbers (e.g. 1024 pixel values from 32x32 face crop)
    faceEmbedding: {
        type: [Number],
        select: false,
    },
    hasFaceAuth: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Missing Security & Management Features
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationOTP: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: String,
    sessions: [{
        device: String,
        ip: String,
        lastActive: { type: Date, default: Date.now },
        isCurrent: Boolean,
    }],
    activityLog: [{
        action: String,
        timestamp: { type: Date, default: Date.now },
        ip: String,
    }],
    roleChangeHistory: [{
        oldRole: String,
        newRole: String,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
    }],
    temporaryPermissions: [{
        role: String,
        expiresAt: Date,
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    lastLogin: Date,
    lastIP: String,
    loginCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Cosine similarity between two number arrays
userSchema.methods.compareFaceEmbedding = function (candidateEmbedding) {
    const stored = this.faceEmbedding;
    if (!stored || stored.length === 0) return 0;

    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < stored.length; i++) {
        dot += stored[i] * candidateEmbedding[i];
        normA += stored[i] * stored[i];
        normB += candidateEmbedding[i] * candidateEmbedding[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const User = mongoose.model('User', userSchema);
module.exports = User;
