import 'dotenv/config';

function requireEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  MONGO_URI: process.env.MONGO_URI ?? (process.env.NODE_ENV === 'test' ? 'mongodb://localhost:27017/finsmart_test' : (() => { throw new Error('Missing env MONGO_URI'); })()),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? (process.env.NODE_ENV === 'test' ? 'test_access' : (() => { throw new Error('Missing env JWT_ACCESS_SECRET'); })()),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? (process.env.NODE_ENV === 'test' ? 'test_refresh' : (() => { throw new Error('Missing env JWT_REFRESH_SECRET'); })()),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? '15m',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL ?? '30d',
  CSRF_SECRET: process.env.CSRF_SECRET ?? (process.env.NODE_ENV === 'test' ? 'test_csrf' : (() => { throw new Error('Missing env CSRF_SECRET'); })()),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? 200),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN ?? 'localhost',
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? 'false') === 'true',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173',
  AGENDA_DB_COLLECTION: process.env.AGENDA_DB_COLLECTION ?? 'jobs',
  AGENDA_ENABLED: (process.env.AGENDA_ENABLED ?? 'true') === 'true'
};
