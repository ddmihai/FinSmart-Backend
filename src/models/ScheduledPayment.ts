import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IScheduledPayment extends Document {
  user: Types.ObjectId;
  fromAccount: Types.ObjectId;
  to: { name: string; sortCode: string; accountNumber: string };
  amount: number;
  runAt: Date;
  reference?: string;
  status: 'pending' | 'processed' | 'canceled';
  createdAt: Date;
}

const schema = new Schema<IScheduledPayment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromAccount: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  to: {
    name: { type: String, required: true },
    sortCode: { type: String, required: true },
    accountNumber: { type: String, required: true }
  },
  amount: { type: Number, required: true },
  runAt: { type: Date, required: true, index: true },
  reference: { type: String },
  status: { type: String, enum: ['pending','processed','canceled'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now }
});

export const ScheduledPayment = mongoose.model<IScheduledPayment>('ScheduledPayment', schema);

