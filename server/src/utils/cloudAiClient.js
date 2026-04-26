import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export const callCloudAI = async (messages, options = {}) => {
  const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
  try {
    if (AI_PROVIDER === 'groq') {
      return await callGroq(messages, options);
    }
    return await callGemini(messages, options);
  } catch (error) {
    console.error(`[CloudAI] Error with provider ${AI_PROVIDER}:`, error.message);
    throw error;
  }
};

async function callGemini(messages, options = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(key);
  const systemMessage = messages.find(m => m.role === 'system');
  
  // Use gemini-1.5-flash but with a fallback to gemini-pro if needed
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: systemMessage ? systemMessage.content : undefined
  });

  const chatHistory = messages
    .filter(m => m.role !== 'system')
    .slice(0, -1)
    .map(m => ({
      role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  
  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
    },
  });

  const lastMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(lastMessage);
  const response = await result.response;
  return response.text();
}

async function callGroq(messages, options = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");
  
  const groq = new Groq({ apiKey: key });
  
  // Convert roles correctly for Groq/Llama
  const formattedMessages = messages.map(m => ({
    role: (m.role === 'model') ? 'assistant' : m.role,
    content: m.content
  }));

  const completion = await groq.chat.completions.create({
    messages: formattedMessages,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: options.temperature ?? 0.7,
  });

  return completion.choices[0]?.message?.content || "";
}
