import mongoose from 'mongoose';

const uri = 'mongodb+srv://imem:27O9Vfw82dDvOyrM@cluster0.2c8nave.mongodb.net/?appName=Cluster0';

async function test() {
  try {
    console.log('Connecting...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected successfully');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

test();
