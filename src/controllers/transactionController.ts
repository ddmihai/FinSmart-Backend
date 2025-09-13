import { Request, Response } from 'express';
import { Account } from '../models/Account.js';
import { RecurringIncome } from '../models/RecurringIncome.js';
import { Transaction } from '../models/Transaction.js';
import { createTransaction, transferBetweenAccounts } from '../services/transactionService.js';
import { BlockedMerchant } from '../models/BlockedMerchant.js';

export async function addIncome(req: Request, res: Response) {
  const { accountId, amount, category, name, note, recurring, interval } = req.body;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });

  if (recurring) {
    if (!interval) return res.status(400).json({ error: 'Interval required for recurring' });
    const nextRunAt = nextFromInterval(interval as any);
    const r = await RecurringIncome.create({ account: account._id, amount, category, name, note, interval, nextRunAt, active: true });
    return res.status(201).json({ recurringIncome: r });
  }

  const tx = await createTransaction({ accountId: account._id as any, type: 'income', amount, category, name, note, method: 'bank' });
  res.status(201).json(tx);
}

export async function addExpense(req: Request, res: Response) {
  const { accountId, amount, category, name, note, cardId } = req.body;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const tx = await createTransaction({ accountId: account._id as any, type: 'expense', amount, category, name, note, method: cardId ? 'card' : 'bank', cardId });
  res.status(201).json(tx);
}

export async function deposit(req: Request, res: Response) {
  const { accountId, amount, note, method } = req.body;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const tx = await createTransaction({ accountId: account._id as any, type: 'deposit', amount, name: 'Deposit', note, method: method || 'topup-bank' });
  res.status(201).json(tx);
}

export async function transfer(req: Request, res: Response) {
  const { fromAccountId, toName, toSortCode, toAccountNumber, amount, note, reference } = req.body;
  const from = await Account.findOne({ _id: fromAccountId, user: req.userId });
  if (!from) return res.status(404).json({ error: 'Source account not found' });
  await transferBetweenAccounts({ fromAccount: from._id as any, toDetails: { name: toName, sortCode: toSortCode, accountNumber: toAccountNumber }, amount, note, name: 'Transfer', reference, userId: req.userId as any });
  res.status(201).json({ ok: true });
}

function nextFromInterval(interval: 'daily' | 'weekly' | 'monthly') {
  const d = new Date();
  if (interval === 'daily') d.setDate(d.getDate() + 1);
  if (interval === 'weekly') d.setDate(d.getDate() + 7);
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
  return d;
}

export async function listTransactions(req: Request, res: Response) {
  const { accountId, q, from, to, name, min, max, includeHidden, hiddenOnly } = req.query as any;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const filter: any = { account: account._id };
  if (hiddenOnly) filter.hidden = true;
  else if (!includeHidden) filter.hidden = { $ne: true };
  if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
  if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };
  if (name) filter.name = new RegExp(String(name), 'i');
  if (q) filter.$text = { $search: String(q) };
  if (min) filter.amount = { ...filter.amount, $gte: Number(min) };
  if (max) filter.amount = { ...filter.amount, $lte: Number(max) };
  const txs = await Transaction.find(filter).sort({ createdAt: -1 }).lean();
  res.json(txs);
}

export async function hideTransaction(req: Request, res: Response) {
  const { id } = req.params as any;
  const doc = await Transaction.findOne({ _id: id }).populate('account');
  if (!doc || String((doc as any).account.user) !== String(req.userId)) return res.status(404).json({ error: 'Not found' });
  doc.hidden = true; await doc.save();
  res.json({ ok: true });
}

export async function unhideTransaction(req: Request, res: Response) {
  const { id } = req.params as any;
  const doc = await Transaction.findOne({ _id: id }).populate('account');
  if (!doc || String((doc as any).account.user) !== String(req.userId)) return res.status(404).json({ error: 'Not found' });
  doc.hidden = false; await doc.save();
  res.json({ ok: true });
}

export async function blockMerchant(req: Request, res: Response) {
  const { id } = req.params as any;
  const doc = await Transaction.findOne({ _id: id }).populate('account');
  if (!doc || String((doc as any).account.user) !== String(req.userId)) return res.status(404).json({ error: 'Not found' });
  if (!doc.name) return res.status(400).json({ error: 'Transaction has no merchant name' });
  await BlockedMerchant.findOneAndUpdate({ user: (doc as any).account.user, name: doc.name }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  res.json({ ok: true });
}

export async function unblockMerchant(req: Request, res: Response) {
  const { id } = req.params as any;
  const doc = await Transaction.findOne({ _id: id }).populate('account');
  if (!doc || String((doc as any).account.user) !== String(req.userId)) return res.status(404).json({ error: 'Not found' });
  if (!doc.name) return res.status(400).json({ error: 'Transaction has no merchant name' });
  await BlockedMerchant.deleteOne({ user: (doc as any).account.user, name: doc.name });
  res.json({ ok: true });
}

export async function listBlockedMerchants(req: Request, res: Response) {
  const list = await BlockedMerchant.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
  res.json(list);
}

export async function deleteBlockedMerchant(req: Request, res: Response) {
  const { id } = req.params as any;
  const removed = await BlockedMerchant.findOneAndDelete({ _id: id, user: req.userId });
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}

export async function updateTransaction(req: Request, res: Response) {
  const { id } = req.params as any;
  const { name, category, note } = req.body as { name?: string; category?: string; note?: string };
  const tx = await Transaction.findOne({ _id: id }).populate('account');
  if (!tx || String((tx as any).account.user) !== String(req.userId)) return res.status(404).json({ error: 'Not found' });
  if (name !== undefined) (tx as any).name = name;
  if (category !== undefined) (tx as any).category = category || undefined;
  if (note !== undefined) (tx as any).note = note || undefined;
  await tx.save();
  res.json({ ok: true });
}
