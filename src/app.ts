import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { csrfInit } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import routes from './routes/index.js';
import swagger from './docs/swagger.js';

export const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  credentials: true
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static home page
const publicDir = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));

app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX
}));

csrfInit(app);

app.use('/api', routes);
app.use('/api/docs', swagger);
app.get('/api/openapi.json', (_req, res) => {
  // Delegate to swagger router that loaded YAML
  res.redirect(302, '/api/docs/json');
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(notFoundHandler);
app.use(errorHandler);
