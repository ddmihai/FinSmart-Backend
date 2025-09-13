import csurf from 'csurf';
import { Application, Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function csrfInit(app: Application) {
  const csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      sameSite: 'none',
      secure: env.COOKIE_SECURE
    }
  });

  const skipPaths = new Set<string>([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/auth/refresh',
    '/api/security/csrf-token'
  ]);

  // Apply CSRF protection except skipPaths
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (skipPaths.has(req.path)) return next();
    return csrfProtection(req, res, next);
  });

  // Explicit endpoint to fetch token
  app.get('/api/security/csrf-token', csrfProtection, (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.json({ csrfToken: req.csrfToken?.() });
  });
}
