/**
 * Migration script: Set isActive=true for all existing users that don't have it set.
 * Run once with: node server/migrate-isactive.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB...');

        const result = await mongoose.connection.db.collection('users').updateMany(
            { isActive: { $exists: false } },  // only users missing the field
            { $set: { isActive: true } }
        );

        console.log(`✅ Migration done: ${result.modifiedCount} user(s) updated to isActive=true`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

run();
