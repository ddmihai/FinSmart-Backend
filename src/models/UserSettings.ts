import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserSettings extends Document {
  user: Types.ObjectId;
  balanceThreshold?: number; // pence
  logoutPolicy?: 'immediate' | 'onClose' | 'idle30m';
  createdAt: Date;
}

const schema = new Schema<IUserSettings>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  balanceThreshold: { type: Number },
  logoutPolicy: { type: String, enum: ['immediate','onClose','idle30m'], default: 'immediate' },
  createdAt: { type: Date, default: Date.now }
});

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', schema);
