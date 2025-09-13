import PDFDocument from 'pdfkit';
import { Transaction } from '../models/Transaction.js';
import { Types } from 'mongoose';

export async function statementSummary(accountId: Types.ObjectId, filters: any) {
  const match: any = { account: accountId };
  if (filters.from) match.createdAt = { ...match.createdAt, $gte: new Date(filters.from) };
  if (filters.to) match.createdAt = { ...match.createdAt, $lte: new Date(filters.to) };
  if (filters.name) match.name = new RegExp(String(filters.name), 'i');

  // Aggregate totals efficiently in MongoDB
  const [totals] = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['income', 'deposit', 'transfer-in']] },
              '$amount',
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [
              { $in: ['$type', ['expense', 'transfer-out']] },
              '$amount',
              0
            ]
          }
        }
      }
    }
  ]);

  const cats = await Transaction.aggregate([
    { $match: match },
    { $match: { category: { $type: 'string' } } },
    {
      $group: {
        _id: '$category',
        sum: {
          $sum: {
            $cond: [
              { $in: ['$type', ['expense', 'transfer-out']] },
              { $multiply: [-1, '$amount'] },
              '$amount'
            ]
          }
        }
      }
    }
  ]);

  const byCategory: Record<string, number> = {};
  for (const c of cats) byCategory[c._id] = c.sum;

  const txs = await Transaction.find(match).sort({ createdAt: -1 }).lean();
  return { txs, income: totals?.income || 0, expenses: totals?.expenses || 0, byCategory };
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
