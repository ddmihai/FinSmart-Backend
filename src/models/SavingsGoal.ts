import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavingsGoal extends Document {
  user: Types.ObjectId;
  name: string;
  target: number; // pence
  saved: number; // pence
  createdAt: Date;
}

const schema = new Schema<ISavingsGoal>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  target: { type: Number, required: true, min: 0 },
  saved: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const SavingsGoal = mongoose.model<ISavingsGoal>('SavingsGoal', schema);

