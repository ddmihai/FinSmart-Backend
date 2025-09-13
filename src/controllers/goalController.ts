import { Request, Response } from 'express';
import { SavingsGoal } from '../models/SavingsGoal.js';
import { Account } from '../models/Account.js';
import { createTransaction } from '../services/transactionService.js';

export async function listGoals(req: Request, res: Response) {
  const goals = await SavingsGoal.find({ user: req.userId }).sort({ createdAt: 1 });
  res.json(goals);
}

export async function createGoal(req: Request, res: Response) {
  const { name, target } = req.body;
  const goal = await SavingsGoal.create({ user: req.userId as any, name, target: Number(target) });
  res.status(201).json(goal);
}

export async function depositToGoal(req: Request, res: Response) {
  const { id } = req.params;
  const { accountId, amount, note } = req.body;
  const goal = await SavingsGoal.findOne({ _id: id, user: req.userId });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  const account = await Account.findOne({ _id: accountId, user: req.userId });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  await createTransaction({ accountId: account._id as any, type: 'transfer-out', amount: amt, name: `Goal deposit: ${goal.name}`, note, category: 'Savings' });
  goal.saved += amt; await goal.save();
  res.json(goal);
}

