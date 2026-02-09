const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bio: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    },
    phone: {
        type: String,
    },
    address: {
        city: String,
        state: String,
        country: String,
        zipCode: String,
    },
    // Role specific fields
    companyName: String, // For Manufacturers
    specialty: String, // For Experts
    experienceYears: Number, // For Artisans/Experts
    skills: [String],
    socialLinks: {
        website: String,
        linkedin: String,
        github: String,
    }
}, {
    timestamps: true,
});

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;
