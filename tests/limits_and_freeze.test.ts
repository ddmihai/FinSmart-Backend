import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcrypt';
import { createDefaultAccountForUser } from '../src/services/accountService.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { TransferLimit } from '../src/models/TransferLimit.js';
import { Card } from '../src/models/Card.js';

describe('Transfer limits and card freeze', () => {
  let tokenA: string; let accA: any; let accB: any;
  beforeAll(async () => {
    await connectDB();
    const a = await User.create({ email: 'la@u.com', name: 'LA', passwordHash: await bcrypt.hash('passpass', 10) });
    const b = await User.create({ email: 'lb@u.com', name: 'LB', passwordHash: await bcrypt.hash('passpass', 10) });
    accA = await createDefaultAccountForUser(a._id as any);
    accB = await createDefaultAccountForUser(b._id as any);
    tokenA = signAccessToken({ sub: String(a._id) });
    await TransferLimit.create({ user: a._id as any, dailyMax: 1000 });
  });

  it('enforces daily P2P transfer limit', async () => {
    await request(app)
      .post('/api/transfers/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ fromAccountId: String(accA._id), toName: 'LB', toSortCode: accB.sortCode, toAccountNumber: accB.accountNumber, amount: 800 })
      .expect(201);
    await request(app)
      .post('/api/transfers/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ fromAccountId: String(accA._id), toName: 'LB', toSortCode: accB.sortCode, toAccountNumber: accB.accountNumber, amount: 300 })
      .expect(403);
  });

  it('blocks expense with frozen card', async () => {
    const card = await Card.findOne({ account: accA._id });
    expect(card).toBeTruthy();
    card!.frozen = true; await card!.save();
    await request(app)
      .post('/api/transactions/expense')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ accountId: String(accA._id), amount: 100, name: 'Test', cardId: String(card!._id) })
      .expect(403);
  });
});

