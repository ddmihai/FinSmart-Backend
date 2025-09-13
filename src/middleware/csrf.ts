import csurf from 'csurf';
import { Application, Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function csrfInit(app: Application) {
  // Simplify CSRF in non-production for easier local development and mobile testing
  if (env.NODE_ENV !== 'production') {
    app.get('/api/security/csrf-token', (_req: Request, res: Response) => {
      res.json({ csrfToken: 'dev' });
    });
    return;
  }

  const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'none', secure: env.COOKIE_SECURE } });

  const skipPaths = new Set<string>([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/auth/refresh',
    '/api/auth/bootstrap'
  ]);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (skipPaths.has(req.path)) return next();
    return csrfProtection(req, res, next);
  });

  app.get('/api/security/csrf-token', (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.json({ csrfToken: req.csrfToken?.() });
  });
}
