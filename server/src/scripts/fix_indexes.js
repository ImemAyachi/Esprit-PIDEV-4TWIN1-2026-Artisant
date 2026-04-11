import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dropIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('reviews');

        console.log('Dropping problematic indexes...');
        try {
            await collection.dropIndex('author_1_product_1');
            console.log('Dropped author_1_product_1');
        } catch (e) {
            console.log('Index author_1_product_1 not found or already dropped');
        }

        try {
            await collection.dropIndex('author_1_artisan_1');
            console.log('Dropped author_1_artisan_1');
        } catch (e) {
            console.log('Index author_1_artisan_1 not found or already dropped');
        }

        console.log('Indexes dropped. They will be recreated with the new partialFilterExpression on next server start.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

dropIndexes();
