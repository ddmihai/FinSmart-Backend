import { Request, Response } from 'express';
import { Account } from '../models/Account.js';
import { analyticsOverview } from '../services/analyticsService.js';

export async function getAnalytics(req: Request, res: Response) {
  const { accountId } = req.query as any;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const data = await analyticsOverview(account._id as any);
  res.json(data);
}
