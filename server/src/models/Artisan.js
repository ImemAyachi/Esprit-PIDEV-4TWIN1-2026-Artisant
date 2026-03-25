const mongoose = require('mongoose');

const artisanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    vocalCommandUrl: {
        type: String,
    },
}, {
    timestamps: true,
});

const Artisan = mongoose.model('Artisan', artisanSchema);
module.exports = Artisan;
