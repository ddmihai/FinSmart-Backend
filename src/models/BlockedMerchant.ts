import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBlockedMerchant extends Document {
  user: Types.ObjectId;
  name: string; // merchant name from transaction
  createdAt: Date;
}

const schema = new Schema<IBlockedMerchant>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

schema.index({ user: 1, name: 1 }, { unique: true });

export const BlockedMerchant = mongoose.model<IBlockedMerchant>('BlockedMerchant', schema);

