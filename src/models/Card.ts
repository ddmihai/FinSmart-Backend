import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICard extends Document {
  account: Types.ObjectId;
  number: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  active: boolean;
  frozen: boolean;
  dailyLimit?: number; // minor units
  weeklyLimit?: number; // minor units
  createdAt: Date;
}

const cardSchema = new Schema<ICard>({
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  number: { type: String, required: true },
  cvv: { type: String, required: true },
  expiryMonth: { type: Number, required: true },
  expiryYear: { type: Number, required: true },
  active: { type: Boolean, default: true },
  frozen: { type: Boolean, default: false },
  dailyLimit: { type: Number },
  weeklyLimit: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

export const Card = mongoose.model<ICard>('Card', cardSchema);
