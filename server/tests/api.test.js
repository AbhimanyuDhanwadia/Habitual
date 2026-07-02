import request from 'supertest';
import { app } from '../src/index.js';

describe('Health Check API', () => {
  it('should return 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

describe('Non-existent route', () => {
  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Route not found');
  });
});
