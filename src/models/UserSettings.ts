import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserSettings extends Document {
  user: Types.ObjectId;
  balanceThreshold?: number; // pence
  createdAt: Date;
}

const schema = new Schema<IUserSettings>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  balanceThreshold: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', schema);

