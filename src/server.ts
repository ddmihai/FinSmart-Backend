import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initJobs } from './services/jobService.js';
import bcrypt from 'bcrypt';
import { User } from './models/User.js';
import { createDefaultAccountForUser } from './services/accountService.js';

async function bootstrap() {
  // eslint-disable-next-line no-console
  console.log('Connecting to MongoDB...');
  await connectDB();
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
  // Seed a demo user for local development convenience
  if (env.NODE_ENV !== 'production' && process.env.SEED_DEMO !== 'false') {
    const email = 'demo@finsmart.test';
    const existing = await User.findOne({ email });
    if (!existing) {
      const passwordHash = await bcrypt.hash('Password123!', 12);
      const user = await User.create({ email, name: 'Demo User', passwordHash });
      await createDefaultAccountForUser(user._id as any);
      // eslint-disable-next-line no-console
      console.log('Seeded demo user:', email);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Initializing jobs...');
  await initJobs();
  // eslint-disable-next-line no-console
  console.log('Jobs ready');
  const port = env.PORT;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`FinSmart API listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
