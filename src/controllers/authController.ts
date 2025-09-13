import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { User } from "../models/User.js";
import { issueRefreshToken, signAccessToken } from "../services/tokenService.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";
import { RefreshToken } from "../models/RefreshToken.js";
import { createDefaultAccountForUser } from "../services/accountService.js";
import { Types } from "mongoose";
import { UserSettings } from "../models/UserSettings.js";

/**
 * Helper: Set refresh token as secure, HttpOnly cookie.
 */
async function setRefreshCookie(res: Response, token: string, userId?: string) {
  const prod = env.NODE_ENV === 'production';
  const settings = userId ? await UserSettings.findOne({ user: userId }) : null;
  const onClose = settings?.logoutPolicy === 'onClose';
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: prod ? env.COOKIE_SECURE : false,
    sameSite: prod ? "none" : "lax",
    path: "/",
    ...(onClose ? {} : { maxAge: 30 * 24 * 60 * 60 * 1000 })
  });
  // Clear any stale path-scoped cookies that may conflict (seen during dev)
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
}

async function setAccessCookie(res: Response, token: string, userId?: string) {
  const prod = env.NODE_ENV === 'production';
  const settings = userId ? await UserSettings.findOne({ user: userId }) : null;
  const onClose = settings?.logoutPolicy === 'onClose';
  const idle = settings?.logoutPolicy === 'idle30m';
  // Keep access token short-lived; cookie expiry in sync ~15 minutes
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: prod ? env.COOKIE_SECURE : false,
    sameSite: prod ? 'none' : 'lax',
    path: '/',
    ...(onClose ? {} : { maxAge: (idle ? 30 : 15) * 60 * 1000 })
  });
}

/**
 * Signup: Register new user and create default account.
 */
export async function signup(req: Request, res: Response) {
  const { name, password } = req.body;
  const email: string = String(req.body.email || '').toLowerCase().trim();

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, passwordHash });

  // Auto-create default account + card
  await createDefaultAccountForUser(user._id as any);

  const access = signAccessToken({ sub: String(user._id) });
  const refresh = await issueRefreshToken(user._id as any);

  await setRefreshCookie(res, refresh, String(user._id));
  await setAccessCookie(res, access, String(user._id));

  res.status(201).json({
    accessToken: access,
    user: { id: user._id, email: user.email, name: user.name }
  });
}

/**
 * Login: Validate credentials and issue tokens.
 */
export async function login(req: Request, res: Response) {
  const password: string = req.body.password;
  const email: string = String(req.body.email || '').toLowerCase().trim();

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const access = signAccessToken({ sub: String(user._id) });
  const refresh = await issueRefreshToken(user._id as any);

  await setRefreshCookie(res, refresh, String(user._id));
  await setAccessCookie(res, access, String(user._id));

  res.json({
    accessToken: access,
    user: { id: user._id, email: user.email, name: user.name }
  });
}

/**
 * Refresh: Rotate refresh token and issue new access token.
 */
export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "Missing refresh token" });

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
    const doc = await RefreshToken.findOne({ token });
    if (!doc) {
      // In development, tolerate stale/missing DB token and recover by issuing a new one
      if (env.NODE_ENV !== 'production') {
        const userId = new Types.ObjectId(decoded.sub);
        const access = signAccessToken({ sub: decoded.sub });
        const newRefresh = await issueRefreshToken(userId as any);
        await setRefreshCookie(res, newRefresh, decoded.sub);
        return res.json({ accessToken: access });
      }
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const access = signAccessToken({ sub: decoded.sub });

    // Rotate refresh token → new cookie + DB update
    const newRefresh = await issueRefreshToken(doc.user as any);
    await RefreshToken.deleteOne({ token });

    await setRefreshCookie(res, newRefresh, decoded.sub);
    await setAccessCookie(res, access, decoded.sub);

    res.json({ accessToken: access });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

/**
 * Logout: Clear refresh cookie and delete token.
 */
export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (token) await RefreshToken.deleteOne({ token });

  res.clearCookie("refreshToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  res.clearCookie('accessToken', { path: '/' });
  res.json({ ok: true });
}

/**
 * Me: Return authenticated user profile.
 */
export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Not found" });

  res.json({ id: user._id, email: user.email, name: user.name });
}

/**
 * Bootstrap: Single-call refresh + user fetch (for initial app load).
 * Expects refreshToken cookie. Rotates it, issues access token, and returns user.
 */
export async function bootstrap(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Missing refresh token' });

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
    const doc = await RefreshToken.findOne({ token });
    if (!doc) return res.status(401).json({ error: 'Invalid refresh token' });

    const user = await User.findById(decoded.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });

    const access = signAccessToken({ sub: decoded.sub });
    const newRefresh = await issueRefreshToken(doc.user as any);
    await RefreshToken.deleteOne({ token });

    await setRefreshCookie(res, newRefresh, decoded.sub);
    await setAccessCookie(res, access, decoded.sub);

    res.json({ accessToken: access, user: { id: user._id, email: user.email, name: user.name } });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}
