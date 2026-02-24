const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const users = await User.find({}, 'email role');
        console.log('USERS IN DATABASE:');
        users.forEach(u => console.log(`- ${u.email}: ${u.role}`));
        process.exit(0);
    })
    .catch((err) => {
        console.error('FAILURE:', err);
        process.exit(1);
    });
