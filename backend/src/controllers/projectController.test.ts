import request from 'supertest';
import app from '../index';

describe('POST /api/projects', () => {
  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Name and status are required/);
  });

  it('should return 400 if name is less than 3 characters', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'AB', status: 'ACTIVE' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ít nhất 3 ký tự/);
  });

  it('should create project with valid name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Project ABC', status: 'ACTIVE' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Project ABC');
  });
}); 