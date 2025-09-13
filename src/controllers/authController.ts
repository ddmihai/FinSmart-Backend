import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { issueRefreshToken, signAccessToken } from '../services/tokenService.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import { RefreshToken } from '../models/RefreshToken.js';
import { createDefaultAccountForUser } from '../services/accountService.js';

function sameSiteForOrigin(originHost: string | null, serverHost: string | null): 'none' | 'lax' {
  try {
    if (!originHost || !serverHost) return 'none';
    const originParts = originHost.split('.').slice(-2).join('.');
    const serverParts = serverHost.split('.').slice(-2).join('.');
    // If both share the same eTLD+1 (e.g., onrender.com), treat as same-site
    return originParts === serverParts ? 'lax' : 'none';
  } catch { return 'none'; }
}

function setRefreshCookie(req: Request, res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,  // true in Render, false in local dev
    sameSite: 'none',           // always none for cross-site (frontend+backend on different subdomains)
    path: '/',                  // cookie valid for all paths
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

export async function signup(req: Request, res: Response) {
  const { email, name, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, passwordHash });
  // Create default account + card on signup
  await createDefaultAccountForUser(user._id as any);
  const access = signAccessToken({ sub: String(user._id) });
  const refresh = await issueRefreshToken(user._id as any);
  setRefreshCookie(req, res, refresh);
  res.status(201).json({ accessToken: access, user: { id: user._id, email: user.email, name: user.name } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const access = signAccessToken({ sub: String(user._id) });
  const refresh = await issueRefreshToken(user._id as any);
  setRefreshCookie(req, res, refresh);
  res.json({ accessToken: access, user: { id: user._id, email: user.email, name: user.name } });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Missing refresh token' });
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
    const doc = await RefreshToken.findOne({ token });
    if (!doc) return res.status(401).json({ error: 'Invalid refresh token' });

    const access = signAccessToken({ sub: decoded.sub });

    // Rotate refresh token
    const newRefresh = await issueRefreshToken(doc.user as any);
    await RefreshToken.deleteOne({ token });
    setRefreshCookie(req, res, newRefresh);

    res.json({ accessToken: access });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}


export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (token) await RefreshToken.deleteOne({ token });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ ok: true });
}


export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user._id, email: user.email, name: user.name });
}
