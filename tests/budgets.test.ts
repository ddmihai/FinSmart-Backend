import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcrypt';
import { createDefaultAccountForUser } from '../src/services/accountService.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { createTransaction } from '../src/services/transactionService.js';

describe('Budgets', () => {
  let token: string; let accountId: string;
  beforeAll(async () => {
    await connectDB();
    const user = await User.create({ email: 'b@b.com', name: 'B', passwordHash: await bcrypt.hash('passpass', 10) });
    const acc = await createDefaultAccountForUser(user._id as any);
    accountId = String(acc._id);
    token = signAccessToken({ sub: String(user._id) });
  });

  it('upserts budget and reports usage', async () => {
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Food', limit: 10000 })
      .expect(201);

    await createTransaction({ accountId: accountId as any, type: 'expense', amount: 1500, name: 'Lunch', category: 'Food' });

    const res = await request(app)
      .get('/api/budgets/usage')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.Food.spent).toBeGreaterThan(0);
  });
});

