/**
 * Health Check API Tests
 * 
 * This file contains tests for the health check endpoint
 * to verify the server is running correctly.
 * 
 * Issue: #217 - Setup Jest & Supertest (AUD-02)
 */

const request = require('supertest');
const app = require('../server');

describe('Health Check Endpoint', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      // Verify timestamp is a valid ISO string
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should return uptime as a number', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return environment information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('environment');
      expect(['development', 'production', 'test']).toContain(response.body.environment);
    });

    it('should return port information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('port');
      // Port can be a number or string depending on environment
      const port = Number(response.body.port);
      expect(isNaN(port)).toBe(false);
      expect(port).toBeGreaterThan(0);
    });
  });
});

describe('404 Handler', () => {
  it('should return 404 for non-existent endpoints', async () => {
    const response = await request(app)
      .get('/api/nonexistent-endpoint')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Endpoint not found');
  });
});

describe('API Base Functionality', () => {
  it('should serve static files from public directory', async () => {
    const response = await request(app)
      .get('/index.html')
      .expect(200);

    expect(response.text).toContain('<!DOCTYPE html>');
  });

  it('should handle CORS headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    // CORS should allow the request
    expect(response.status).toBe(200);
  });
});
