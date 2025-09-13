import { Request, Response } from 'express';
import { RecurringTransfer } from '../models/RecurringTransfer.js';
import { ScheduledPayment } from '../models/ScheduledPayment.js';
import { transferBetweenAccounts } from '../services/transactionService.js';
import { TransferLimit } from '../models/TransferLimit.js';

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
