import { Request, Response } from 'express';
import { upsertBudget, budgetUsage } from '../services/budgetService.js';
import { Budget } from '../models/Budget.js';

export async function setBudget(req: Request, res: Response) {
  const { category, limit } = req.body;
  const b = await upsertBudget(req.userId as any, category, Number(limit));
  res.status(201).json(b);
}

export async function getBudgetUsage(req: Request, res: Response) {
  const usage = await budgetUsage(req.userId as any);
  res.json(usage);
}

export async function listBudgets(_req: Request, res: Response) {
  const list = await Budget.find({ user: res.req.userId }).sort({ category: 1 });
  res.json(list);
}

export async function updateBudget(req: Request, res: Response) {
  const { id } = req.params;
  const { limit } = req.body;
  const doc = await Budget.findOneAndUpdate({ _id: id, user: req.userId }, { $set: { limit: Number(limit) } }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Budget not found' });
  res.json(doc);
}

export async function deleteBudget(req: Request, res: Response) {
  const { id } = req.params;
  const del = await Budget.deleteOne({ _id: id, user: req.userId });
  if (del.deletedCount === 0) return res.status(404).json({ error: 'Budget not found' });
  res.json({ ok: true });
}
