import mongoose from 'mongoose';

const manufacturerSchema = new mongoose.Schema({
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
    companyName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    trainingType: {
        type: String,
    },
}, {
    timestamps: true,
});

const Manufacturer = mongoose.model('ManufacturerYahya', manufacturerSchema);
export default Manufacturer;
