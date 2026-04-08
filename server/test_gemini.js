import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log("Testing with key:", key);
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('hello');
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }
}
test();
