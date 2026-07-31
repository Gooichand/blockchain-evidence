// Unit tests for the global signature verification middleware
const { verifySignature } = require('../middleware/verifySignature');

const TEST_WALLET = '0x0123456789abcdef0123456789abcdef01234567';

describe('verifySignature middleware', () => {
  it('exempts /auth/ routes (wallet login must work without a signature)', () => {
    const req = {
      path: '/auth/wallet/login',
      originalUrl: '/api/auth/wallet/login',
      method: 'POST',
      body: { walletAddress: TEST_WALLET },
      headers: {}, // no signature headers at all
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    verifySignature(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('exempts all /auth/ sub-routes (email login, register, nonce, verify)', () => {
    for (const p of ['/auth/email/login', '/auth/email/register', '/auth/wallet/nonce', '/auth/email/verify']) {
      const req = { path: p, originalUrl: `/api${p}`, method: 'GET', body: {}, headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      verifySignature(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('allows public routes that claim no wallet', () => {
    const req = {
      path: '/health',
      originalUrl: '/api/health',
      method: 'GET',
      body: {},
      headers: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    verifySignature(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects a claimed wallet without a signature (the previous login-breaking case)', () => {
    const req = {
      path: '/evidence/list',
      originalUrl: '/api/evidence/list',
      method: 'GET',
      body: { wallet: TEST_WALLET },
      headers: {}, // wallet claimed but no proof
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    verifySignature(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed wallet claim', () => {
    const req = {
      path: '/evidence/list',
      originalUrl: '/api/evidence/list',
      method: 'GET',
      body: { wallet: 'not-a-wallet' },
      headers: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    verifySignature(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid wallet address format' });
  });
});
