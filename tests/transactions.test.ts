import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { createDefaultAccountForUser } from '../src/services/accountService.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcrypt';
import { signAccessToken } from '../src/services/tokenService.js';

describe('Transactions', () => {
  let token: string; let accountId: string;
  beforeAll(async () => {
    await connectDB();
    const user = await User.create({ email: 'u@u.com', name: 'U', passwordHash: await bcrypt.hash('passpass', 10) });
    const acc = await createDefaultAccountForUser(user._id as any);
    accountId = String(acc._id);
    token = signAccessToken({ sub: String(user._id) });
  });

  it('creates income and expense', async () => {
    await request(app)
      .post('/api/transactions/income')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountId, amount: 1000, name: 'Salary' })
      .expect(201);

    await request(app)
      .post('/api/transactions/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountId, amount: 300, name: 'Food' })
      .expect(201);

    const list = await request(app)
      .get(`/api/transactions?accountId=${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.length).toBe(2);
  });
});
