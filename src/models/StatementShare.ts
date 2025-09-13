import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStatementShare extends Document {
  user: Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  filters?: Record<string, unknown>;
}

const schema = new Schema<IStatementShare>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  filters: { type: Object }
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const StatementShare = mongoose.model<IStatementShare>('StatementShare', schema);
