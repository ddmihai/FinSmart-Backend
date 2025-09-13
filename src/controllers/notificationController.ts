import { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';
import { getEmitter } from '../services/notificationService.js';

export async function listNotifications(req: Request, res: Response) {
  const items = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(100);
  res.json(items);
}

export async function markRead(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };
  await Notification.updateMany({ user: req.userId, _id: { $in: ids } }, { $set: { read: true } });
  res.json({ ok: true });
}

export async function stream(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const uid = String(req.userId);
  const emitter = getEmitter();
  const handler = (evt: any) => {
    if (evt.userId !== uid) return;
    res.write(`data: ${JSON.stringify(evt.doc)}\n\n`);
  };
  emitter.on('notify', handler);
  req.on('close', () => { emitter.off('notify', handler); });
}

