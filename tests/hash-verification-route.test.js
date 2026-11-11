process.env.JWT_SECRET = 'local-test-only-not-a-real-secret';
jest.mock('../config', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../controllers/blockchainController', () => ({
  getSystemStatus: jest.fn(), getBlockchainConfig: jest.fn(), getBlockchainStats: jest.fn(),
  getIPFSStats: jest.fn(), verifyTransaction: jest.fn(), estimateGas: jest.fn(), healthCheck: jest.fn(),
}));
jest.mock('../services/blockchain/readOnlyVerificationService', () => ({ initialize: jest.fn() }));
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const service = require('../services/blockchain/readOnlyVerificationService');
const { supabase } = require('../config');
const app = express();
app.use('/api/blockchain', require('../routes/blockchainRoutes'));
const url = '/api/blockchain/verify-hash/' + 'a'.repeat(64);
test('anonymous request is denied before blockchain access', async () => {
  await request(app).get(url).expect(401);
  expect(service.initialize).not.toHaveBeenCalled();
});
test('invalid session is denied before blockchain access', async () => {
  await request(app).get(url).set('Authorization', 'Bearer invalid').expect(401);
  expect(service.initialize).not.toHaveBeenCalled();
});
test('authenticated active user reaches hash validation', async () => {
  supabase.from.mockReturnValue({ select: () => ({ eq: () => ({ single: async () => ({ data: { id: 1, is_active: true, role: 'forensic_analyst' } }) }) }) });
  const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
  await request(app).get('/api/blockchain/verify-hash/invalid').set('Authorization', 'Bearer ' + token).expect(400);
  expect(service.initialize).not.toHaveBeenCalled();
});
test('health endpoint is authenticated', async () => {
  await request(app).get('/api/blockchain/verification-health').expect(401);
});
