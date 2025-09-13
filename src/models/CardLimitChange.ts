import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICardLimitChange extends Document {
  user: Types.ObjectId;
  card: Types.ObjectId;
  dailyLimit?: number;
  weeklyLimit?: number;
  createdAt: Date;
}

const schema = new Schema<ICardLimitChange>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  card: { type: Schema.Types.ObjectId, ref: 'Card', required: true, index: true },
  dailyLimit: { type: Number },
  weeklyLimit: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

export const CardLimitChange = mongoose.model<ICardLimitChange>('CardLimitChange', schema);

