import mongoose, { Schema, Document, Types } from 'mongoose';

export type Interval = 'daily' | 'weekly' | 'monthly';

export interface IRecurringIncome extends Document {
  account: Types.ObjectId;
  amount: number;
  category?: string;
  name: string;
  note?: string;
  interval: Interval;
  nextRunAt: Date;
  active: boolean;
  createdAt: Date;
}

const schema = new Schema<IRecurringIncome>({
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  amount: { type: Number, required: true },
  category: { type: String },
  name: { type: String, required: true },
  note: { type: String },
  interval: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  nextRunAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const RecurringIncome = mongoose.model<IRecurringIncome>('RecurringIncome', schema);

