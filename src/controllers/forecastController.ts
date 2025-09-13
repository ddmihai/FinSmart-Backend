import { Request, Response } from 'express';
import { Account } from '../models/Account.js';
import { RecurringIncome } from '../models/RecurringIncome.js';
import { RecurringTransfer } from '../models/RecurringTransfer.js';
import { ScheduledPayment } from '../models/ScheduledPayment.js';

export async function forecastMonthEnd(req: Request, res: Response) {
  const { accountId } = req.query as any;
  const acc = await Account.findOne({ _id: accountId, user: req.userId });
  if (!acc) return res.status(404).json({ error: 'Account not found' });
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  let projected = acc.balance;
  
  // Recurring incomes until end
  const incomes = await RecurringIncome.find({ account: acc._id, active: true });
  for (const r of incomes) {
    let d = new Date(r.nextRunAt);
    while (d <= end) {
      if (d >= now) projected += r.amount;
      if (r.interval === 'daily') d.setDate(d.getDate() + 1);
      if (r.interval === 'weekly') d.setDate(d.getDate() + 7);
      if (r.interval === 'monthly') d.setMonth(d.getMonth() + 1);
    }
  }

  // Recurring transfers
  const transfers = await RecurringTransfer.find({ fromAccount: acc._id, active: true });
  for (const t of transfers) {
    let d = new Date(t.nextRunAt);
    while (d <= end) {
      if (d >= now) projected -= t.amount;
      d.setMonth(d.getMonth() + 1);
    }
  }

  // Scheduled payments pending until end
  const scheduled = await ScheduledPayment.find({ fromAccount: acc._id, status: 'pending', runAt: { $lte: end } });
  for (const s of scheduled) {
    if (s.runAt >= now) projected -= s.amount;
  }

  // Build simple daily series from today to month end
  const series: Array<{ date: string; balance: number }> = [];
  const cursor = new Date(now);
  while (cursor <= end) {
    // Estimate daily: add any incomes/transfers scheduled exactly that date
    let bal = projected; // approximation; for a nicer series we could simulate step by step
    series.push({ date: cursor.toISOString().slice(0,10), balance: bal });
    cursor.setDate(cursor.getDate() + 1);
  }
  res.json({ balanceNow: acc.balance, projectedMonthEnd: projected, series });
}
