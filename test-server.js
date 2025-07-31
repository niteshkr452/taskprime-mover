const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./server'); // Import the Express app from server.js

describe('PrimeTask Movers Backend API Tests', () => {
  beforeAll(async () => {
    // Wait for mongoose connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('GET / should serve index.html', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('POST /contact with valid data should succeed', async () => {
    const validData = {
      name: 'Test User',
      email: 'testuser@example.com',
      subject: 'Test Subject',
      message: 'This is a test message'
    };
    const res = await request(app).post('/contact').send(validData);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/thank you/i);
    expect(res.body.data).toHaveProperty('id');
  });

  test('POST /contact with missing fields should fail', async () => {
    const invalidData = {
      name: 'Test User',
      email: 'testuser@example.com',
      subject: ''
    };
    const res = await request(app).post('/contact').send(invalidData);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /contact with invalid email should fail', async () => {
    const invalidEmailData = {
      name: 'Test User',
      email: 'invalid-email',
      subject: 'Test Subject',
      message: 'Message'
    };
    const res = await request(app).post('/contact').send(invalidEmailData);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/contacts should return contacts', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /health should return server health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/backend is running/i);
  });

  test('Unknown route should return 404', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
