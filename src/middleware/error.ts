import { NextFunction, Request, Response } from 'express';
import path from 'path';

export function notFoundHandler(req: Request, res: Response) {
  const acceptsHtml = req.accepts(['html', 'json']) === 'html';
  const isApi = req.path.startsWith('/api');
  if (acceptsHtml && !isApi) {
    const publicDir = path.resolve(process.cwd(), 'public');
    return res.status(404).sendFile(path.join(publicDir, '404.html'));
  }
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  // Provide helpful CSRF error details consistently
  if (status === 403 && (err.code === 'EBADCSRFTOKEN' || /csrf/i.test(message))) {
    return res.status(403).json({ error: 'Invalid CSRF token', code: 'EBADCSRFTOKEN' });
  }
  res.status(status).json({ error: message });
}
