const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Profile = require('./src/models/Profile');
const Document = require('./src/models/Document');

dotenv.config();

const users = [
    {
        email: 'admin@artisant.com',
        password: 'password123',
        role: 'admin',
        companyName: 'Artisant HQ',
        phone: '+213 555 000 001',
        isActive: true,
    },
    {
        email: 'expert@artisant.com',
        password: 'password123',
        role: 'expert',
        companyName: 'Expert Solutions',
        phone: '+213 555 000 002',
        isActive: true,
    },
    {
        email: 'artisan@artisant.com',
        password: 'password123',
        role: 'artisan',
        companyName: 'Artisan Craft Co.',
        phone: '+213 555 000 003',
        isActive: true,
    },
    {
        email: 'manufacturer@artisant.com',
        password: 'password123',
        role: 'manufacturer',
        companyName: 'Fab Industries',
        phone: '+213 555 000 004',
        isActive: true,
    },
    {
        email: 'inactive@artisant.com',
        password: 'password123',
        role: 'artisan',
        companyName: 'Old Craft',
        phone: '+213 555 000 005',
        isActive: false,
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        await User.deleteMany();
        await Profile.deleteMany();
        await Document.deleteMany();
        console.log('Data destroyed...');

        for (const user of users) {
            const createdUser = await User.create(user);
            await Profile.create({
                user: createdUser._id,
                bio: `I am a ${user.role} on the Artisant platform.`,
                specialty: user.role === 'expert' ? 'Industrial Safety' : undefined
            });
            console.log(`Created user: ${user.email} (isActive: ${user.isActive})`);

            if (user.role === 'expert') {
                await Document.create({
                    title: 'Industrial Safety Guidelines 2026',
                    description: 'Comprehensive guide for workshop safety.',
                    type: 'Manual',
                    url: 'https://example.com/safety.pdf',
                    category: 'Manual',
                    uploadedBy: createdUser._id
                });
            }
        }

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDatabase();
