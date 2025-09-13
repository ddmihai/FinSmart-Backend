import { Request, Response } from 'express';
import { upsertBudget, budgetUsage } from '../services/budgetService.js';

export async function setBudget(req: Request, res: Response) {
  const { category, limit } = req.body;
  const b = await upsertBudget(req.userId as any, category, Number(limit));
  res.status(201).json(b);
}

export async function getBudgetUsage(req: Request, res: Response) {
  const usage = await budgetUsage(req.userId as any);
  res.json(usage);
}

