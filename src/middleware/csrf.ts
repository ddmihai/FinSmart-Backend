import csurf from 'csurf';
import { Application, Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function csrfInit(app: Application) {
  if (env.NODE_ENV === 'test') {
    app.get('/api/security/csrf-token', (_req: Request, res: Response) => {
      res.json({ csrfToken: 'test' });
    });
    return;
  }

  const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

  const skipPaths = new Set<string>([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/auth/refresh'
  ]);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (skipPaths.has(req.path)) return next();
    return csrfProtection(req, res, next);
  });

  app.get('/api/security/csrf-token', (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken?.() });
  });
}
