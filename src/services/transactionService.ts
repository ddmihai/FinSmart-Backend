import { Account } from '../models/Account.js';
import { Card, ICard } from '../models/Card.js';
import { Transaction, TransactionType } from '../models/Transaction.js';
import { TransferLimit } from '../models/TransferLimit.js';
import { notify } from './notificationService.js';
import { SavedRecipient } from '../models/SavedRecipient.js';
import { Budget } from '../models/Budget.js';
import { Types } from 'mongoose';

export async function createTransaction(opts: {
  accountId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  category?: string;
  name: string;
  note?: string;
  reference?: string;
  method?: string;
  cardId?: Types.ObjectId;
  counterpart?: { name?: string; sortCode?: string; accountNumber?: string };
}) {
  const { accountId, type, amount } = opts;
  const acc = await Account.findById(accountId);
  if (!acc) throw Object.assign(new Error('Account not found'), { status: 404 });

  // Card checks (if provided)
  let cardDoc: ICard | null = null;
  if (opts.cardId) {
    cardDoc = await Card.findById(opts.cardId);
    if (!cardDoc || String(cardDoc.account) !== String(acc._id)) {
      throw Object.assign(new Error('Card not found for account'), { status: 404 });
    }
    if (!cardDoc.active || cardDoc.frozen) {
      throw Object.assign(new Error('Card is inactive or frozen'), { status: 403 });
    }
    // Enforce card limits
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const startOfWeek = new Date(); const day = startOfWeek.getDay(); const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); startOfWeek.setDate(diff); startOfWeek.setHours(0,0,0,0);
    if (cardDoc.dailyLimit) {
      const spentToday = await Transaction.aggregate([
        { $match: { card: cardDoc._id, type: { $in: ['expense','transfer-out'] }, createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      const total = (spentToday[0]?.sum || 0) + (type === 'expense' || type === 'transfer-out' ? amount : 0);
      if (total > cardDoc.dailyLimit) throw Object.assign(new Error('Card daily limit exceeded'), { status: 403 });
    }
    if (cardDoc.weeklyLimit) {
      const spentWeek = await Transaction.aggregate([
        { $match: { card: cardDoc._id, type: { $in: ['expense','transfer-out'] }, createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      const total = (spentWeek[0]?.sum || 0) + (type === 'expense' || type === 'transfer-out' ? amount : 0);
      if (total > cardDoc.weeklyLimit) throw Object.assign(new Error('Card weekly limit exceeded'), { status: 403 });
    }
  }

  let delta = 0;
  if (type === 'income' || type === 'deposit' || type === 'transfer-in') delta = amount;
  if (type === 'expense' || type === 'transfer-out') delta = -amount;

  acc.balance += delta;
  await acc.save();

  const tx = await Transaction.create({
    account: acc._id,
    type,
    amount,
    category: opts.category,
    name: opts.name,
    note: opts.note,
    reference: opts.reference,
    method: opts.method,
    card: opts.cardId,
    counterpart: opts.counterpart
  });
  try {
    const uid = (acc.user as any) as Types.ObjectId;
    if (type === 'deposit' || type === 'income') await notify(uid, 'deposit', `${opts.name}`, `+£${(amount/100).toFixed(2)}`);
    if (type === 'expense' || type === 'transfer-out') await notify(uid, 'spend', `${opts.name}`, `-£${(amount/100).toFixed(2)}`);
    if (type === 'transfer-in') await notify(uid, 'transfer-in', `${opts.name}`, `+£${(amount/100).toFixed(2)}`);
  } catch {}

  // Budget alerts: warn when approaching/exceeding
  if (['expense','transfer-out'].includes(type)) {
    try {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const accUser = acc.user as any;
      if (opts.category) {
        const budget = await Budget.findOne({ user: accUser, category: opts.category });
        if (budget) {
          const agg = await Transaction.aggregate([
            { $match: { account: acc._id, category: opts.category, createdAt: { $gte: monthStart }, type: { $in: ['expense','transfer-out'] } } },
            { $group: { _id: null, sum: { $sum: '$amount' } } }
          ]);
          const spent = (agg[0]?.sum || 0);
          const ratio = spent / Math.max(1, budget.limit);
          if (ratio >= 0.8 && ratio < 1.0) await notify(accUser, 'budget-warning', `Approaching ${opts.category} budget`, `Spent £${(spent/100).toFixed(2)} of £${(budget.limit/100).toFixed(2)}`);
          if (ratio >= 1.0) await notify(accUser, 'budget-exceeded', `${opts.category} budget exceeded`, `Spent £${(spent/100).toFixed(2)} of £${(budget.limit/100).toFixed(2)}`);
        }
      }
    } catch {}
  }
  return tx;
}

export async function transferBetweenAccounts(opts: {
  fromAccount: Types.ObjectId;
  toDetails: { name: string; sortCode: string; accountNumber: string };
  amount: number;
  name?: string;
  note?: string;
  reference?: string;
  userId?: Types.ObjectId;
}) {
  const from = await Account.findById(opts.fromAccount);
  if (!from) throw Object.assign(new Error('Source account not found'), { status: 404 });

  // Enforce daily P2P transfer limit per user
  if (opts.userId) {
    const today = new Date(); today.setHours(0,0,0,0);
    const limitDoc = await TransferLimit.findOne({ user: opts.userId });
    const dailyMax = limitDoc?.dailyMax ?? 500000;
    const transferred = await Transaction.aggregate([
      { $match: { type: 'transfer-out', createdAt: { $gte: today }, account: { $in: await Account.find({ user: opts.userId }).distinct('_id') } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    const total = (transferred[0]?.sum || 0) + opts.amount;
    if (total > dailyMax) throw Object.assign(new Error('Daily transfer limit exceeded'), { status: 403 });
  }

  const to = await Account.findOne({ sortCode: opts.toDetails.sortCode, accountNumber: opts.toDetails.accountNumber });
  // Always record the outgoing; incoming only if receiver is in our system
  await createTransaction({
    accountId: from._id as any,
    type: 'transfer-out',
    amount: opts.amount,
    name: opts.name ?? 'Transfer out',
    note: opts.note,
    reference: opts.reference,
    counterpart: opts.toDetails
  });

  if (to) {
    await createTransaction({
      accountId: to._id as any,
      type: 'transfer-in',
      amount: opts.amount,
      name: 'Transfer in',
      note: opts.note,
      reference: opts.reference,
      counterpart: { name: '', sortCode: from.sortCode, accountNumber: from.accountNumber }
    });
  }

  // Track frequently paid recipients for this user
  if (opts.userId) {
    await SavedRecipient.findOneAndUpdate(
      { user: opts.userId, sortCode: opts.toDetails.sortCode, accountNumber: opts.toDetails.accountNumber },
      { $set: { name: opts.toDetails.name, lastUsedAt: new Date() }, $inc: { count: 1 } },
      { upsert: true }
    );
  }
}
