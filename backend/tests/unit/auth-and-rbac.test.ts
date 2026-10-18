import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { resetRepositoryForTesting } from '../../src/db/index.js';

describe('Admin Authentication & Role-Based Access Control (RBAC)', () => {
  const app = createApp();

  beforeEach(() => {
    resetRepositoryForTesting();
  });

  it('should reject unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/businesses');
    expect(res.status).toBe(401);
  });

  it('should authenticate super admin and allow global business listing', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@platform.local',
      password: 'Password@123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.role).toBe('super_admin');

    const token = loginRes.body.token;

    const bizRes = await request(app)
      .get('/api/businesses')
      .set('Authorization', `Bearer ${token}`);

    expect(bizRes.status).toBe(200);
    expect(bizRes.body.length).toBe(2);
  });

  it('should authenticate Edu Alt Tech brand admin and scope businesses list', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@edualttech.com',
      password: 'Password@123',
    });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const bizRes = await request(app)
      .get('/api/businesses')
      .set('Authorization', `Bearer ${token}`);

    expect(bizRes.status).toBe(200);
    expect(bizRes.body.length).toBe(1);
    expect(bizRes.body[0].slug).toBe('edu-alt-tech');
  });

  it('should prohibit brand admin from accessing or editing another brand settings (403)', async () => {
    // Login as Edu Alt Tech Admin
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@edualttech.com',
      password: 'Password@123',
    });

    const token = loginRes.body.token;
    const setsuBusinessId = '22222222-2222-2222-2222-222222222222';

    // Attempt to update Setsuzoku settings
    const attackRes = await request(app)
      .put(`/api/businesses/${setsuBusinessId}/settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        system_prompt: 'Malicious override of Setsuzoku prompt',
      });

    expect(attackRes.status).toBe(403);
    expect(attackRes.body.error).toContain('Forbidden');
  });
});
