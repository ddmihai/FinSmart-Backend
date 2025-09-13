import { EventEmitter } from 'node:events';
import { Notification } from '../models/Notification.js';
import { Types } from 'mongoose';

const emitter = new EventEmitter();

export async function notify(userId: Types.ObjectId, type: string, title: string, body?: string) {
  const doc = await Notification.create({ user: userId, type, title, body });
  emitter.emit('notify', { userId: String(userId), doc });
  return doc;
}

export function getEmitter() { return emitter; }

