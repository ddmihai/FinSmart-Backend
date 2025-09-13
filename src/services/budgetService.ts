import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { Types } from 'mongoose';

export async function upsertBudget(userId: Types.ObjectId, category: string, limit: number) {
  const budget = await Budget.findOneAndUpdate({ user: userId, category }, { $set: { limit } }, { upsert: true, new: true });
  return budget;
}

export async function budgetUsage(userId: Types.ObjectId) {
  const budgets = await Budget.find({ user: userId });
  const accounts = await Account.find({ user: userId }).select('_id');
  const accountIds = accounts.map(a => a._id);
  const usage: Record<string, { limit: number; spent: number }> = {};
  for (const b of budgets) {
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const spent = await Transaction.aggregate([
      { $match: { account: { $in: accountIds }, category: b.category, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, sum: { $sum: { $cond: [ { $in: ['$type', ['expense','transfer-out']] }, '$amount', 0 ] } } } }
    ]);
    usage[b.category] = { limit: b.limit, spent: spent[0]?.sum || 0 };
  }
  return usage;
}
