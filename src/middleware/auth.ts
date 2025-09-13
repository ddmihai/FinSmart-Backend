import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/tokenService.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization' });
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid Authorization' });
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

