import Agenda from 'agenda';
import { env } from '../config/env.js';
import { RecurringIncome } from '../models/RecurringIncome.js';
import { createTransaction } from './transactionService.js';
import { RecurringTransfer } from '../models/RecurringTransfer.js';
import { ScheduledPayment } from '../models/ScheduledPayment.js';

let agenda: Agenda | null = null;

export async function initJobs() {
  if (!env.AGENDA_ENABLED) {
    // eslint-disable-next-line no-console
    console.log('Agenda jobs disabled by env');
    return;
  }
  if (agenda) return;
  agenda = new Agenda({ db: { address: process.env.MONGO_URI!, collection: env.AGENDA_DB_COLLECTION } });

  agenda.define('process recurring incomes', async () => {
    const now = new Date();
    const due = await RecurringIncome.find({ active: true, nextRunAt: { $lte: now } });
    for (const r of due) {
      await createTransaction({ accountId: r.account as any, type: 'income', amount: r.amount, category: r.category, name: r.name, note: r.note });
      // Schedule next
      const next = new Date(r.nextRunAt);
      if (r.interval === 'daily') next.setDate(next.getDate() + 1);
      if (r.interval === 'weekly') next.setDate(next.getDate() + 7);
      if (r.interval === 'monthly') next.setMonth(next.getMonth() + 1);
      r.nextRunAt = next;
      await r.save();
    }
  });

  agenda.define('process recurring transfers', async () => {
    const now = new Date();
    const due = await RecurringTransfer.find({ active: true, nextRunAt: { $lte: now } });
    for (const r of due) {
      await (await import('./transactionService.js')).transferBetweenAccounts({ fromAccount: r.fromAccount as any, toDetails: r.to as any, amount: r.amount, name: 'Recurring transfer', reference: r.reference, userId: r.user as any });
      // schedule next month
      const next = new Date(r.nextRunAt);
      next.setMonth(next.getMonth() + 1);
      r.nextRunAt = next; await r.save();
    }
  });

  agenda.define('process scheduled payments', async () => {
    const now = new Date();
    const due = await ScheduledPayment.find({ status: 'pending', runAt: { $lte: now } });
    for (const s of due) {
      try {
        await (await import('./transactionService.js')).transferBetweenAccounts({ fromAccount: s.fromAccount as any, toDetails: s.to as any, amount: s.amount, name: 'Scheduled payment', reference: s.reference, userId: s.user as any });
        s.status = 'processed';
      } catch (e) {
        // leave as pending if fails; could add retry/error state
      }
      await s.save();
    }
  });

  await agenda.start();
  await agenda.every('5 minutes', 'process recurring incomes');
  await agenda.every('10 minutes', 'process recurring transfers');
  await agenda.every('2 minutes', 'process scheduled payments');
}

export function getAgenda() {
  if (!agenda) throw new Error('Agenda not initialized');
  return agenda;
}
