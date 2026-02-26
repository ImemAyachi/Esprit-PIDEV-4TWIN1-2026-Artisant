const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Profile = require('./src/models/Profile');
const Document = require('./src/models/Document');

dotenv.config();

const users = [
    {
        name: 'System Admin',
        email: 'admin@artisant.com',
        password: 'password123',
        role: 'Admin',
        permissions: ['manage:users', 'manage:documents', 'read:products', 'write:products']
    },
    {
        name: 'John Expert',
        email: 'expert@artisant.com',
        password: 'password123',
        role: 'Expert',
        permissions: ['manage:documents']
    },
    {
        name: 'Jane Artisan',
        email: 'artisan@artisant.com',
        password: 'password123',
        role: 'Artisan',
        permissions: ['read:products']
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
                specialty: user.role === 'Expert' ? 'Industrial Safety' : undefined
            });
            console.log(`Created user: ${user.email}`);

            if (user.role === 'Expert') {
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
