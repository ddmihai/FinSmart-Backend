import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransferLimit extends Document {
  user: Types.ObjectId;
  dailyMax: number; // pence
  createdAt: Date;
}

const schema = new Schema<ITransferLimit>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  dailyMax: { type: Number, default: 500000 }, // £5,000
  createdAt: { type: Date, default: Date.now }
});

export const TransferLimit = mongoose.model<ITransferLimit>('TransferLimit', schema);

