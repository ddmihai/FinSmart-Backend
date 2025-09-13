import { Request, Response } from 'express';
import { Card } from '../models/Card.js';
import { Account } from '../models/Account.js';
import bcrypt from 'bcrypt';
import { CardLimitChange } from '../models/CardLimitChange.js';

export async function freezeCard(req: Request, res: Response) {
  const { cardId } = req.params;
  const card = await Card.findById(cardId).populate('account');
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (String((card as any).account.user) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });
  card.frozen = true; await card.save();
  res.json({ ok: true });
}

export async function unfreezeCard(req: Request, res: Response) {
  const { cardId } = req.params;
  const card = await Card.findById(cardId).populate('account');
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (String((card as any).account.user) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });
  card.frozen = false; await card.save();
  res.json({ ok: true });
}

export async function setCardLimits(req: Request, res: Response) {
  const { cardId } = req.params;
  const { dailyLimit, weeklyLimit } = req.body;
  const card = await Card.findById(cardId).populate('account');
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (String((card as any).account.user) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });
  if (dailyLimit !== undefined) card.dailyLimit = Number(dailyLimit);
  if (weeklyLimit !== undefined) card.weeklyLimit = Number(weeklyLimit);
  await card.save();
  await CardLimitChange.create({ user: (card as any).account.user, card: card._id, dailyLimit: card.dailyLimit, weeklyLimit: card.weeklyLimit });
  res.json(card);
}

export async function revealCard(req: Request, res: Response) {
  const { cardId } = req.params;
  const { password } = req.body;
  const card = await Card.findById(cardId).populate({ path: 'account', populate: { path: 'user' } });
  if (!card) return res.status(404).json({ error: 'Card not found' });
  const account = (card as any).account;
  const user = account?.user;
  if (!user || String(user._id) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });
  const bcryptHash = user.passwordHash;
  const ok = await bcrypt.compare(password, bcryptHash);
  if (!ok) return res.status(401).json({ error: 'Invalid password' });
  res.json({ number: card.number, cvv: card.cvv, expiryMonth: card.expiryMonth, expiryYear: card.expiryYear });
}

export async function listLimitChanges(req: Request, res: Response) {
  const { cardId } = req.params;
  const card = await Card.findById(cardId).populate('account');
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (String((card as any).account.user) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });
  const list = await CardLimitChange.find({ user: (card as any).account.user, card: card._id }).sort({ createdAt: -1 }).limit(50);
  res.json(list);
}

export async function deleteLimitChange(req: Request, res: Response) {
  const { id } = req.params;
  const change = await CardLimitChange.findById(id);
  if (!change || String(change.user) !== String(req.userId)) return res.status(404).json({ error: 'Not found' });
  await change.deleteOne();
  res.json({ ok: true });
}

