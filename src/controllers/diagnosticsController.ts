import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../services/tokenService.js';
import jwt from 'jsonwebtoken';

function computeAllowedOrigins() {
  const allowed = env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  const defaultFrontend = 'https://finsmart-frontend-ntct.onrender.com';
  if (env.NODE_ENV === 'production' && !allowed.includes(defaultFrontend)) allowed.push(defaultFrontend);
  return allowed;
}

export async function diagnostics(req: Request, res: Response) {
  const info: any = {};
  const errors: Array<{ where: string; message: string }> = [];

  info.now = new Date().toISOString();
  info.nodeEnv = env.NODE_ENV;
  info.apiBase = `${req.protocol}://${req.get('host')}`;
  info.requestOrigin = req.headers.origin || null;
  info.corsAllowedOrigins = computeAllowedOrigins();

  info.cookies = {
    names: Object.keys(req.cookies || {}),
    hasRefreshToken: Boolean(req.cookies?.refreshToken || req.signedCookies?.refreshToken),
    hasAccessToken: Boolean(req.cookies?.accessToken)
  };

  // CSRF fully disabled; keep a note for clarity
  info.csrf = { enabled: false };

  info.cookieFlags = {
    refresh: { sameSite: 'none', secure: env.COOKIE_SECURE, path: '/' },
    csrf: { sameSite: 'none', secure: env.COOKIE_SECURE, path: 'set per csurf' },
    domain: env.COOKIE_DOMAIN || '(host-only)'
  };

  // Access token (Authorization header)
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length);
    try {
      const decoded = verifyAccessToken(token);
      info.accessToken = { valid: true, sub: decoded.sub };
    } catch (e: any) {
      info.accessToken = { valid: false };
      errors.push({ where: 'accessToken.verify', message: e?.message || String(e) });
    }
  } else {
    info.accessToken = { present: false };
  }

  // Refresh token (httpOnly cookie)
  const refresh = req.cookies?.refreshToken;
  if (refresh) {
    try {
      const decoded = jwt.verify(refresh, env.JWT_REFRESH_SECRET) as any;
      info.refreshToken = { valid: true, sub: decoded?.sub };
    } catch (e: any) {
      info.refreshToken = { valid: false };
      errors.push({ where: 'refreshToken.verify', message: e?.message || String(e) });
    }
  } else {
    info.refreshToken = { present: false };
  }

  if (errors.length) info.errors = errors;
  res.json(info);
}

export async function diagnosticsAuth(req: Request, res: Response) {
  res.json({ ok: true, userId: (req as any).userId || null });
}
