import mongoose, { Schema, Document, Types } from 'mongoose';

export type AccountType = 'Basic' | 'Credit' | 'Platinum' | 'Gold';

export interface IAccount extends Document {
  user: Types.ObjectId;
  type: AccountType;
  sortCode: string;
  accountNumber: string;
  balance: number; // in minor units (pence)
  createdAt: Date;
}

const accountSchema = new Schema<IAccount>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['Basic', 'Credit', 'Platinum', 'Gold'], default: 'Basic' },
  sortCode: { type: String, required: true },
  accountNumber: { type: String, required: true },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

accountSchema.index({ sortCode: 1, accountNumber: 1 }, { unique: true });

export const Account = mongoose.model<IAccount>('Account', accountSchema);

