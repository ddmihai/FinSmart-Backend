import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: Date;
}

const schema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>('Notification', schema);

