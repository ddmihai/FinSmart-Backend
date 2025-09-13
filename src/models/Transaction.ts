import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransactionType = 'income' | 'expense' | 'transfer-in' | 'transfer-out' | 'deposit';

export interface ITransaction extends Document {
  account: Types.ObjectId;
  type: TransactionType;
  amount: number; // minor units
  category?: string;
  name: string;
  note?: string;
  reference?: string;
  method?: string; // bank|card|paypal|topup-card|topup-bank
  card?: Types.ObjectId;
  counterpart?: {
    name?: string;
    sortCode?: string;
    accountNumber?: string;
  };
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  type: { type: String, enum: ['income', 'expense', 'transfer-in', 'transfer-out', 'deposit'], required: true },
  amount: { type: Number, required: true },
  category: { type: String },
  name: { type: String, required: true },
  note: { type: String },
  reference: { type: String },
  method: { type: String },
  card: { type: Schema.Types.ObjectId, ref: 'Card' },
  counterpart: {
    name: String,
    sortCode: String,
    accountNumber: String
  },
  createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ name: 'text', note: 'text' });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
