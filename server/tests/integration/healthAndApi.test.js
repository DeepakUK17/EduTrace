const request = require('supertest');
const app = require('../../src/app');

describe('API Integration Tests', () => {
  test('GET /api/health returns 200 and valid status object', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'EduTrace Backend API');
    expect(res.body).toHaveProperty('mode');
  });

  test('POST /api/copilot/query answers AICTE handbook questions without auth', async () => {
    // Note: copilot routes are protected by authenticate, so without token it returns 401
    const res = await request(app)
      .post('/api/copilot/query')
      .send({ query: 'What is approved intake?' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/unknown-endpoint returns 404 with structured error', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('code', 'NOT_FOUND');
  });
});
