import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecurringTransfer extends Document {
  user: Types.ObjectId;
  fromAccount: Types.ObjectId;
  to: { name: string; sortCode: string; accountNumber: string };
  amount: number;
  monthlyDay: number; // 1..28/30/31
  reference?: string;
  nextRunAt: Date;
  active: boolean;
  createdAt: Date;
}

const schema = new Schema<IRecurringTransfer>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromAccount: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  to: {
    name: { type: String, required: true },
    sortCode: { type: String, required: true },
    accountNumber: { type: String, required: true }
  },
  amount: { type: Number, required: true },
  monthlyDay: { type: Number, required: true },
  reference: { type: String },
  nextRunAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const RecurringTransfer = mongoose.model<IRecurringTransfer>('RecurringTransfer', schema);

