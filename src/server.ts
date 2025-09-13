import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initJobs } from './services/jobService.js';

async function bootstrap() {
  // eslint-disable-next-line no-console
  console.log('Connecting to MongoDB...');
  await connectDB();
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
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
