import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcrypt';
import { createDefaultAccountForUser } from '../src/services/accountService.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { Account } from '../src/models/Account.js';

describe('Transfers', () => {
  let tokenA: string; let tokenB: string; let accA: any; let accB: any;
  beforeAll(async () => {
    await connectDB();
    const userA = await User.create({ email: 'ta@u.com', name: 'TA', passwordHash: await bcrypt.hash('passpass', 10) });
    const userB = await User.create({ email: 'tb@u.com', name: 'TB', passwordHash: await bcrypt.hash('passpass', 10) });
    accA = await createDefaultAccountForUser(userA._id as any);
    accB = await createDefaultAccountForUser(userB._id as any);
    tokenA = signAccessToken({ sub: String(userA._id) });
    tokenB = signAccessToken({ sub: String(userB._id) });
  });

  it('transfers between users by UK details', async () => {
    await request(app)
      .post('/api/transactions/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ fromAccountId: String(accA._id), toName: 'TB', toSortCode: accB.sortCode, toAccountNumber: accB.accountNumber, amount: 2500 })
      .expect(201);

    const aTxs = await request(app)
      .get(`/api/transactions?accountId=${accA._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const out = aTxs.body.find((t: any) => t.type === 'transfer-out');
    expect(out).toBeTruthy();

    const bTxs = await request(app)
      .get(`/api/transactions?accountId=${accB._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    const inc = bTxs.body.find((t: any) => t.type === 'transfer-in');
    expect(inc).toBeTruthy();
  });
});

