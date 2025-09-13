import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

describe('Auth', () => {
  beforeAll(async () => {
    await connectDB();
  });

  it('signs up and logs in', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'a@b.com', name: 'A', password: 'password123' })
      .expect(201);
    expect(signup.body.accessToken).toBeDefined();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'password123' })
      .expect(200);
    expect(login.body.accessToken).toBeDefined();
  });
});

