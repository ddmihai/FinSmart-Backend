import PDFDocument from 'pdfkit';
import { Transaction } from '../models/Transaction.js';
import { Types } from 'mongoose';

export async function statementSummary(accountId: Types.ObjectId, filters: any) {
  const filter: any = { account: accountId };
  if (filters.from) filter.createdAt = { ...filter.createdAt, $gte: new Date(filters.from) };
  if (filters.to) filter.createdAt = { ...filter.createdAt, $lte: new Date(filters.to) };
  if (filters.name) filter.name = new RegExp(String(filters.name), 'i');
  const txs = await Transaction.find(filter).sort({ createdAt: -1 });
  const income = txs.filter(t => t.type === 'income' || t.type === 'deposit' || t.type === 'transfer-in').reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense' || t.type === 'transfer-out').reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, number> = {};
  txs.forEach(t => { if (t.category) byCategory[t.category] = (byCategory[t.category] || 0) + (t.type === 'expense' ? -t.amount : t.amount); });
  return { txs, income, expenses, byCategory };
}

export async function generateStatementPdf(accountId: Types.ObjectId, filters: any) {
  const { txs, income, expenses } = await statementSummary(accountId, filters);
  const doc = new PDFDocument({ margin: 36 });
  doc.fontSize(18).text('FinSmart Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Income: £${(income/100).toFixed(2)}  Expenses: £${(expenses/100).toFixed(2)}`);
  doc.moveDown();
  txs.slice(0, 200).forEach(t => {
    const sign = (t.type === 'expense' || t.type === 'transfer-out') ? '-' : '+';
    doc.text(`${t.createdAt.toISOString().slice(0,10)}  ${t.name}  ${sign}£${(t.amount/100).toFixed(2)}  ${t.category ?? ''}`);
  });
  return doc;
}
