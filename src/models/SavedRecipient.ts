import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedRecipient extends Document {
  user: Types.ObjectId; // owner who pays
  name: string;
  sortCode: string;
  accountNumber: string;
  count: number;
  lastUsedAt: Date;
  createdAt: Date;
}

const schema = new Schema<ISavedRecipient>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  sortCode: { type: String, required: true },
  accountNumber: { type: String, required: true },
  count: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

schema.index({ user: 1, sortCode: 1, accountNumber: 1 }, { unique: true });

export const SavedRecipient = mongoose.model<ISavedRecipient>('SavedRecipient', schema);

