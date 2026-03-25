const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env from current folder
dotenv.config();

const userSchema = new mongoose.Schema({
    email: String,
    role: String,
    companyName: String,
    createdAt: Date
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUsers() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI not found in environment');
        
        await mongoose.connect(uri);
        const users = await User.find()
            .select('companyName email role createdAt')
            .sort({ createdAt: -1 })
            .limit(10);
            
        console.log('\n--- LATEST 10 REGISTERED USERS ---');
        console.log('DATE                | ROLE         | EMAIL                     | COMPANY');
        console.log('--------------------|--------------|---------------------------|----------------');
        users.forEach(u => {
            const date = u.createdAt ? u.createdAt.toLocaleString() : 'N/A';
            const role = (u.role || 'N/A').toUpperCase().padEnd(12);
            const email = (u.email || 'N/A').padEnd(25);
            console.log(`${date.padEnd(20)} | ${role} | ${email} | ${u.companyName}`);
        });
        await mongoose.disconnect();
    } catch (e) { 
        console.error('ERROR:', e.message); 
    }
}

checkUsers();
