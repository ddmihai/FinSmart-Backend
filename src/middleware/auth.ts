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
  let token: string | undefined;
  if (auth && auth.startsWith('Bearer ')) token = auth.slice('Bearer '.length);
  if (!token && req.cookies?.accessToken) token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: 'Missing Authorization' });
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
