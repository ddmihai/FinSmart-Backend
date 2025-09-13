import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

function extractRefreshCookie(setCookie: string[] | undefined) {
  if (!setCookie) return undefined;
  const cookie = setCookie.find((c) => c.startsWith('refreshToken='));
  return cookie;
}

describe('Auth flow: refresh, me, logout', () => {
  beforeAll(async () => {
    await connectDB();
  });

  it('rotates refresh token, returns new access, serves me, and logout clears cookie', async () => {
    const agent = request.agent(app);

    const signup = await agent
      .post('/api/auth/signup')
      .send({ email: 'flow@user.com', name: 'Flow', password: 'password123' })
      .expect(201);

    const initialAccess = signup.body.accessToken as string;
    expect(initialAccess).toBeDefined();
    const initialCookie = extractRefreshCookie(signup.headers['set-cookie']);
    expect(initialCookie).toBeDefined();

    const refreshed = await agent
      .post('/api/auth/refresh')
      .expect(200);

    const newAccess = refreshed.body.accessToken as string;
    expect(newAccess).toBeDefined();
    const rotatedCookie = extractRefreshCookie(refreshed.headers['set-cookie']);
    expect(rotatedCookie).toBeDefined();
    // Should rotate to a different refresh token value
    expect(rotatedCookie).not.toEqual(initialCookie);

    // Me should work with the latest access token
    const me = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newAccess}`)
      .expect(200);
    expect(me.body.email).toBe('flow@user.com');

    // Logout clears refresh cookie and invalidates refresh
    await agent.post('/api/auth/logout').expect(200);

    await agent.post('/api/auth/refresh').expect(401);
  });

  it('rejects invalid refresh token', async () => {
    await connectDB();
    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=invalid; Path=/; HttpOnly')
      .expect(401);
  });
});

