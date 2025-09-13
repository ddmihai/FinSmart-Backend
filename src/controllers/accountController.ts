import { Request, Response } from 'express';
import { Account } from '../models/Account.js';
import { Card } from '../models/Card.js';
import { createDefaultAccountForUser, issueReplacementCard } from '../services/accountService.js';

export async function myAccounts(req: Request, res: Response) {
  const accounts = await Account.find({ user: req.userId });
  res.json(accounts);
}

export async function createAccount(req: Request, res: Response) {
  const type = req.body.type as 'Basic' | 'Credit' | 'Platinum' | 'Gold' | undefined;
  const acc = await createDefaultAccountForUser(req.userId as any);
  if (type && type !== acc.type) {
    acc.type = type;
    await acc.save();
  }
  res.status(201).json(acc);
}

export async function myCards(req: Request, res: Response) {
  const accounts = await Account.find({ user: req.userId }).select('_id');
  const ids = accounts.map((a) => a._id);
  const cards = await Card.find({ account: { $in: ids }, active: true });
  res.json(cards);
}

export async function replaceCard(req: Request, res: Response) {
  const { accountId } = req.params;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const card = await issueReplacementCard(account._id as any);
  res.json(card);
}
