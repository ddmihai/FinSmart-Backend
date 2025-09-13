import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { Types } from 'mongoose';

export async function upsertBudget(userId: Types.ObjectId, category: string, limit: number) {
  const budget = await Budget.findOneAndUpdate({ user: userId, category }, { $set: { limit } }, { upsert: true, new: true });
  return budget;
}

export async function budgetUsage(userId: Types.ObjectId) {
  const budgets = await Budget.find({ user: userId }).lean();
  const accountIds = await Account.find({ user: userId }).distinct('_id');
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0,0,0,0);

  const spentByCat = await Transaction.aggregate([
    { $match: { account: { $in: accountIds }, createdAt: { $gte: monthStart } } },
    {
      $group: {
        _id: '$category',
        sum: {
          $sum: {
            $cond: [ { $in: ['$type', ['expense','transfer-out']] }, '$amount', 0 ]
          }
        }
      }
    }
  ]);
  const spentMap = new Map<string, number>();
  for (const s of spentByCat) if (s._id) spentMap.set(String(s._id), s.sum || 0);

  const usage: Record<string, { limit: number; spent: number }> = {};
  for (const b of budgets) usage[b.category] = { limit: b.limit, spent: spentMap.get(b.category) || 0 };
  return usage;
}
