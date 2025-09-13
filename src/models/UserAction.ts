import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAction extends Document {
  user: mongoose.Types.ObjectId;
  type: 'hide_tx' | 'unhide_tx' | 'block_merchant' | 'unblock_merchant';
  txId?: mongoose.Types.ObjectId;
  merchant?: string;
  createdAt: Date;
}

const schema = new Schema<IUserAction>({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  type: { type: String, required: true },
  txId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  merchant: { type: String },
  createdAt: { type: Date, default: Date.now }
});

schema.index({ user: 1, createdAt: -1 });

export const UserAction = mongoose.model<IUserAction>('UserAction', schema);

