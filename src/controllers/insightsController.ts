import { Request, Response } from 'express';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';

export async function categoryInsights(req: Request, res: Response) {
  const { accountId } = req.query as any;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const txs = await Transaction.find({ account: account._id, createdAt: { $gte: monthStart } });
  const incomeTotal = txs.filter(t => ['income','deposit','transfer-in'].includes(t.type)).reduce((s,t)=>s+t.amount, 0);
  const spendByCat: Record<string, number> = {};
  txs.filter(t => ['expense','transfer-out'].includes(t.type)).forEach(t => { if (t.category) spendByCat[t.category] = (spendByCat[t.category] || 0) + t.amount; });
  const insights = Object.entries(spendByCat).map(([cat, spent]) => ({ category: cat, spent, percentage: incomeTotal > 0 ? Math.round((spent / incomeTotal) * 100) : 0 }));
  res.json({ incomeTotal, insights });
}

