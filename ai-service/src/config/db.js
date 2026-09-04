import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in ai-service .env');
    return;
  }
  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`[AI-Service] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[AI-Service] MongoDB Connection Error: ${error.message}`);
  }
};
