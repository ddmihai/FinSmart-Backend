import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBudget extends Document {
  user: Types.ObjectId;
  category: string;
  limit: number; // minor units per month
  createdAt: Date;
}

const schema = new Schema<IBudget>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

schema.index({ user: 1, category: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', schema);

