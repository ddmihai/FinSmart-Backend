import { Request, Response } from 'express';
import { UserSettings } from '../models/UserSettings.js';

export async function getLogoutPolicy(req: Request, res: Response) {
  const s = await UserSettings.findOne({ user: req.userId });
  res.json({ policy: s?.logoutPolicy || 'immediate' });
}

export async function setLogoutPolicy(req: Request, res: Response) {
  const { policy } = req.body as { policy: 'immediate'|'onClose'|'idle30m' };
  const s = await UserSettings.findOneAndUpdate({ user: req.userId }, { $set: { logoutPolicy: policy } }, { upsert: true, new: true });
  res.json({ policy: s.logoutPolicy });
}

