import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
        required: true,
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
        trim: true,
    },
    phone: {
        type: String,
    },
    avatarUrl: {
        type: String,
    },
    // Facial recognition biometric (stored as number array/embedding)
    faceEmbedding: {
        type: [Number],
        select: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Management Features
    lastLogin: Date,
    lastIP: String,
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});


// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Cosine similarity for face authentication
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

const User = mongoose.model('UserYahya', userSchema);
export default User;

