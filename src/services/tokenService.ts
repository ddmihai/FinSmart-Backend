import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Types } from 'mongoose';

export function signAccessToken(payload: object) {
  return (jwt as any).sign(payload, env.JWT_ACCESS_SECRET as any, { expiresIn: env.ACCESS_TOKEN_TTL } as any);
}

export async function issueRefreshToken(userId: Types.ObjectId) {
  const token = (jwt as any).sign({ sub: String(userId) }, env.JWT_REFRESH_SECRET as any, { expiresIn: env.REFRESH_TOKEN_TTL } as any);
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const exp = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: userId, token, expiresAt: exp });
  return token;
}

export async function rotateRefreshToken(oldToken: string) {
  const doc = await RefreshToken.findOneAndDelete({ token: oldToken });
  if (!doc) throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  const userId = doc.user as Types.ObjectId;
  const newToken = await issueRefreshToken(userId);
  const access = signAccessToken({ sub: String(userId) });
  return { access, refresh: newToken };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}
