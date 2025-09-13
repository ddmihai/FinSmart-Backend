import { Transaction } from '../models/Transaction.js';
import { Types } from 'mongoose';

export async function analyticsOverview(accountId: Types.ObjectId) {
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const txs = await Transaction.find({ account: accountId, createdAt: { $gte: monthStart } });
  let income = 0, expenses = 0;
  const byCategory: Record<string, number> = {};
  for (const t of txs) {
    const sign = (t.type === 'expense' || t.type === 'transfer-out') ? -1 : 1;
    const amount = sign * t.amount;
    if (sign > 0) income += t.amount; else expenses += t.amount;
    if (t.category) byCategory[t.category] = (byCategory[t.category] || 0) + amount;
  }
  return { income, expenses, byCategory };
}

