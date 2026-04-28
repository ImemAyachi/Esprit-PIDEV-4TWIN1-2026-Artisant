import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function resetCode() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({ email: String, twoFactorCode: String, twoFactorExpire: Date }));
    await User.updateOne(
        { email: 'kmitiyahya17@gmail.com' },
        { $set: { twoFactorCode: '942108', twoFactorExpire: new Date(Date.now() + 600000) } }
    );
    console.log('Code reset to 942108');
    await mongoose.disconnect();
}
resetCode();
