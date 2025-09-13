import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServerUri: string | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(env.MONGO_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    return;
  } catch (err: any) {
    const allowMemory = env.NODE_ENV !== 'production';
    const refused = err?.message?.includes('ECONNREFUSED');
    if (!allowMemory || !refused) throw err;
    // Fallback to in-memory MongoDB for development
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – dynamic import, types not needed in prod
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    memoryServerUri = mongod.getUri();
    if (memoryServerUri) process.env.MONGO_URI = memoryServerUri; // so Agenda uses the same
    await mongoose.connect(memoryServerUri!, { autoIndex: true });
  }
}

export function getMemoryDbUri() {
  return memoryServerUri;
}
