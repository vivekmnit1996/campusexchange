import mongoose from 'mongoose';

let mongodInstance = null;

const startInMemoryMongo = async () => {
  if (mongodInstance) return mongodInstance.getUri();
  console.log('⚡ Launching in-memory MongoDB for local development...');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongodInstance = await MongoMemoryServer.create({
    instance: {
      dbName: 'campusexchange',
      args: ['--wiredTigerCacheSizeGB', '0.25'],
    },
  });
  const uri = mongodInstance.getUri();
  console.log(`🧠 In-Memory MongoDB running at: ${uri}`);
  process.env.MONGODB_URI = uri;
  return uri;
};

export const connectDB = async () => {
  let connStr = process.env.MONGODB_URI;

  if (!connStr || connStr.includes('<username>')) {
    connStr = await startInMemoryMongo();
  }

  try {
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 6000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Remote Connection Error: ${error.message}`);

    // If remote connection failed, fallback to in-memory MongoDB in development
    if (process.env.NODE_ENV !== 'production' && !mongodInstance) {
      console.warn('⚠️ Atlas connection failed (likely your current IP is not whitelisted in Atlas Network Access).');
      console.warn('💡 To fix remote Atlas: In cloud.mongodb.com -> Network Access -> Add IP (or 0.0.0.0/0).');
      console.log('⚡ Falling back to In-Memory MongoDB so CampusExchange runs smoothly...');

      const fallbackUri = await startInMemoryMongo();
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected (In-Memory Fallback): ${conn.connection.host} / Database: ${conn.connection.name}`);
      return conn;
    }

    throw error;
  }
};

