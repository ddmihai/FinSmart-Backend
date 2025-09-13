import { Request, Response } from 'express';
import { RecurringTransfer } from '../models/RecurringTransfer.js';
import { ScheduledPayment } from '../models/ScheduledPayment.js';
import { transferBetweenAccounts } from '../services/transactionService.js';
import { TransferLimit } from '../models/TransferLimit.js';
import { SavedRecipient } from '../models/SavedRecipient.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';

export async function createRecurringTransfer(req: Request, res: Response) {
  const { fromAccountId, toName, toSortCode, toAccountNumber, amount, monthlyDay, reference } = req.body;
  const next = nextMonthlyRun(new Date(), Number(monthlyDay || 1));
  const doc = await RecurringTransfer.create({
    user: req.userId as any,
    fromAccount: fromAccountId,
    to: { name: toName, sortCode: toSortCode, accountNumber: toAccountNumber },
    amount,
    monthlyDay,
    reference,
    nextRunAt: next,
    active: true
  });
  res.status(201).json(doc);
}

export async function cancelRecurringTransfer(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await RecurringTransfer.findOneAndUpdate({ _id: id, user: req.userId }, { $set: { active: false } }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
}

export async function listRecurringTransfers(req: Request, res: Response) {
  const list = await RecurringTransfer.find({ user: req.userId, active: true }).sort({ nextRunAt: 1 });
  res.json(list);
}

export async function schedulePayment(req: Request, res: Response) {
  const { fromAccountId, toName, toSortCode, toAccountNumber, amount, runAt, reference } = req.body;
  const doc = await ScheduledPayment.create({ user: req.userId as any, fromAccount: fromAccountId, to: { name: toName, sortCode: toSortCode, accountNumber: toAccountNumber }, amount, runAt, reference, status: 'pending' });
  res.status(201).json(doc);
}

export async function cancelScheduledPayment(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await ScheduledPayment.findOneAndUpdate({ _id: id, user: req.userId }, { $set: { status: 'canceled' } }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
}

export async function listScheduledPayments(req: Request, res: Response) {
  const list = await ScheduledPayment.find({ user: req.userId, status: 'pending' }).sort({ runAt: 1 });
  res.json(list);
}

export async function immediateTransfer(req: Request, res: Response) {
  const { fromAccountId, toName, toSortCode, toAccountNumber, amount, note, reference } = req.body;
  await transferBetweenAccounts({ fromAccount: fromAccountId, toDetails: { name: toName, sortCode: toSortCode, accountNumber: toAccountNumber }, amount, note, name: 'Transfer', reference, userId: req.userId as any });
  res.status(201).json({ ok: true });
}

function nextMonthlyRun(from: Date, day: number) {
  const d = new Date(from);
  d.setDate(day);
  if (d <= from) d.setMonth(d.getMonth() + 1);
  d.setHours(9,0,0,0);
  return d;
}

export async function getTransferLimit(req: Request, res: Response) {
  const doc = await TransferLimit.findOne({ user: req.userId });
  res.json({ dailyMax: doc?.dailyMax ?? 500000 });
}

export async function setTransferLimit(req: Request, res: Response) {
  const { dailyMax } = req.body;
  const doc = await TransferLimit.findOneAndUpdate({ user: req.userId }, { $set: { dailyMax: Number(dailyMax) } }, { new: true, upsert: true });
  res.json({ dailyMax: doc.dailyMax });
}

export async function listRecipients(req: Request, res: Response) {
  const list = await SavedRecipient.find({ user: req.userId }).sort({ lastUsedAt: -1, count: -1 }).limit(50);
  res.json(list);
}

export async function addRecipient(req: Request, res: Response) {
  const { name, sortCode, accountNumber } = req.body;
  const doc = await SavedRecipient.findOneAndUpdate({ user: req.userId, sortCode, accountNumber }, { $set: { name }, $setOnInsert: { count: 0, lastUsedAt: new Date() } }, { upsert: true, new: true });
  res.status(201).json(doc);
}

export async function deleteRecipient(req: Request, res: Response) {
  const { id } = req.params;
  await SavedRecipient.deleteOne({ _id: id, user: req.userId });
  res.json({ ok: true });
}

export async function findUser(req: Request, res: Response) {
  const { email, name } = req.query as any;
  let user: any = null;
  if (email) user = await User.findOne({ email: String(email) });
  else if (name) user = await User.findOne({ name: new RegExp(String(name), 'i') });
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Return first account details if present
  const acc = await Account.findOne({ user: user._id }).sort({ createdAt: 1 });
  res.json({
    user: { id: user._id, name: user.name, email: user.email },
    account: acc ? { sortCode: acc.sortCode, accountNumber: acc.accountNumber } : null
  });
}
