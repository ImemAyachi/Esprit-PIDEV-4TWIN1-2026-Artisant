const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('SUCCESS: Connected to MongoDB');
        process.exit(0);
    })
    .catch((err) => {
        console.error('FAILURE: Could not connect to MongoDB', err);
        process.exit(1);
    });
