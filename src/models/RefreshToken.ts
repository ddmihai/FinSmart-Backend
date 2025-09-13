import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  user: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const schema = new Schema<IRefreshToken>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', schema);
