import { Request, Response } from 'express';
import { Account } from '../models/Account.js';
import { statementSummary, generateStatementPdf } from '../services/statementService.js';
import { StatementShare } from '../models/StatementShare.js';
import { randomBytes } from 'crypto';

export async function getStatement(req: Request, res: Response) {
  const { accountId } = req.query as any;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const summary = await statementSummary(account._id as any, req.query);
  res.json(summary);
}

export async function downloadStatement(req: Request, res: Response) {
  const { accountId } = req.query as any;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const pdf = await generateStatementPdf(account._id as any, req.query);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="statement.pdf"');
  pdf.pipe(res);
  pdf.end();
}

export async function exportStatement(req: Request, res: Response) {
  const { accountId, format } = req.query as any;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const { txs, income, expenses, byCategory } = await statementSummary(account._id as any, req.query);
  // For now, CSV only; Excel users can open CSV directly
  const csv: string[] = [];
  csv.push('date,name,category,type,amount_pence,note');
  for (const t of txs) {
    const row = [
      new Date(t.createdAt as any).toISOString().slice(0,10),
      escapeCsv((t as any).name || ''),
      escapeCsv((t as any).category || ''),
      (t as any).type,
      String((t as any).amount),
      escapeCsv((t as any).note || '')
    ].join(',');
    csv.push(row);
  }
  csv.push('');
  csv.push(`totals,, , , ,`);
  csv.push(`income,, , , ${income},`);
  csv.push(`expenses,, , , ${expenses},`);
  csv.push('');
  csv.push('category,sum_pence');
  for (const [k,v] of Object.entries(byCategory)) csv.push(`${escapeCsv(k)},${v}`);
  const buf = Buffer.from(csv.join('\n'),'utf8');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="statement.csv"');
  res.send(buf);
}

function escapeCsv(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g,'""') + '"';
  }
  return v;
}

export async function shareStatement(req: Request, res: Response) {
  const { accountId, ttlHours } = req.body;
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const token = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + Number(ttlHours ?? 24) * 3600 * 1000);
  const share = await StatementShare.create({ user: req.userId, token, expiresAt, filters: req.body.filters ?? {} });
  res.status(201).json({ token: share.token, expiresAt });
}

export async function viewSharedStatement(req: Request, res: Response) {
  const { token } = req.params;
  const share = await StatementShare.findOne({ token });
  if (!share) return res.status(404).json({ error: 'Invalid token' });
  // For demo purposes, shared view requires filters to include an accountId
  const accountId = (share.filters as any)?.accountId;
  if (!accountId) return res.status(400).json({ error: 'Shared statement missing account filter' });
  const summary = await statementSummary(accountId, share.filters || {});
  res.json(summary);
}
