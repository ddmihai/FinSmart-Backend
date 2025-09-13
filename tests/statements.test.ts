import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcrypt';
import { createDefaultAccountForUser } from '../src/services/accountService.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { createTransaction } from '../src/services/transactionService.js';

describe('Statements', () => {
  let token: string; let accountId: string;
  beforeAll(async () => {
    await connectDB();
    const user = await User.create({ email: 's@s.com', name: 'S', passwordHash: await bcrypt.hash('passpass', 10) });
    const acc = await createDefaultAccountForUser(user._id as any);
    accountId = String(acc._id);
    token = signAccessToken({ sub: String(user._id) });
    await createTransaction({ accountId: acc._id as any, type: 'income', amount: 5000, name: 'Init' });
    await createTransaction({ accountId: acc._id as any, type: 'expense', amount: 1200, name: 'Groceries', category: 'Food' });
  });

  it('returns statement summary', async () => {
    const res = await request(app)
      .get(`/api/statements?accountId=${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.income).toBeGreaterThan(0);
  });

  it('downloads statement PDF', async () => {
    const res = await request(app)
      .get(`/api/statements/download?accountId=${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });
});

