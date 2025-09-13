import express, { Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import routes from './routes/index.js';
import swagger from './docs/swagger.js';

export const app = express();

app.set('trust proxy', 1);
app.set('etag', false);

app.use(helmet());
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
// Production safety: include known frontend Render URL if missing
const defaultFrontend = 'https://finsmart-frontend-ntct.onrender.com';
if (env.NODE_ENV === 'production' && !allowedOrigins.includes(defaultFrontend)) {
  allowedOrigins.push(defaultFrontend);
}
const allowedSet = new Set(allowedOrigins);
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // allow same-origin/non-browser/tools
    if (allowedSet.has(origin)) return callback(null, true);
    // Do not throw; just disallow CORS for unexpected origins
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
if (env.NODE_ENV !== 'production') app.use(morgan('dev'));
// Compress responses (saves bandwidth; CPU cost is low for JSON)
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static home page
const publicDir = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));

// Apply rate limit to API routes only to reduce overhead
app.use('/api', rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX }));


app.use('/api', routes);
app.use('/api/docs', swagger);
app.get('/api/openapi.json', (_req: Request, res: Response) => {
  // Delegate to swagger router that loaded YAML
  res.redirect(302, '/api/docs/json');
});

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

app.use(notFoundHandler);
app.use(errorHandler);
