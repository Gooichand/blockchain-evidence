// Unit tests for the authentication controller (wallet + email login with JWT)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-jest';

const bcrypt = require('bcryptjs');

// Mock Supabase before requiring the controller
jest.mock('../config', () => ({
  supabase: {
    from: jest.fn(),
  },
  allowedRoles: [
    'public_viewer',
    'investigator',
    'forensic_analyst',
    'legal_professional',
    'court_official',
    'evidence_manager',
    'auditor',
  ],
}));

const { supabase } = require('../config');
const { walletLogin, emailLogin } = require('../controllers/authController');

// Canonical 40-hex-char test wallet
const TEST_WALLET = '0x0123456789abcdef0123456789abcdef01234567';

// Build a chainable from().select().eq().eq().single() mock
const mockUserLookup = (singleResult) => {
  const single = jest.fn().mockResolvedValue(singleResult);
  const eq2 = jest.fn().mockReturnValue({ single });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { from: jest.fn().mockReturnValue({ select }), select, eq1, eq2, single };
};

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  return res;
};

describe('walletLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success + JWT token for a registered wallet', async () => {
    const lookup = mockUserLookup({
      data: {
        id: 1,
        wallet_address: TEST_WALLET.toLowerCase(),
        full_name: 'Test Admin',
        role: 'admin',
        department: 'IT',
        jurisdiction: 'Global',
        badge_number: 'ADMIN-001',
        auth_type: 'wallet',
      },
      error: null,
    });
    const logs = { insert: jest.fn().mockResolvedValue({ error: null }) };
    supabase.from.mockImplementation((table) => (table === 'users' ? lookup.from() : logs));

    const req = { body: { walletAddress: '0x0123456789ABCDEF0123456789ABCDEF01234567' } }; // mixed-case hex on purpose
    const res = mockRes();

    await walletLogin(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.token).toBeDefined();
    expect(payload.user.role).toBe('admin');
    expect(payload.user.wallet_address).toBe(TEST_WALLET.toLowerCase());

    // Wallet must be looked up lowercased
    expect(lookup.eq1.mock.calls[0][1]).toBe(TEST_WALLET.toLowerCase());
  });

  it('returns 401 when the wallet is not registered', async () => {
    const lookup = mockUserLookup({ data: null, error: { code: 'PGRST116' } });
    supabase.from.mockImplementation((table) => (table === 'users' ? lookup.from() : { insert: jest.fn() }));

    const req = { body: { walletAddress: TEST_WALLET } };
    const res = mockRes();

    await walletLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Wallet address not registered' });
  });

  it('returns 400 for an invalid wallet format', async () => {
    const req = { body: { walletAddress: 'not-a-wallet' } };
    const res = mockRes();

    await walletLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid wallet address format' });
  });

  it('returns 400 when wallet address is missing', async () => {
    const req = { body: {} };
    const res = mockRes();

    await walletLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Wallet address is required' });
  });
});

describe('emailLogin', () => {
  const passwordHash = bcrypt.hashSync('password123', 4);

  const baseUser = {
    id: 2,
    email: 'investigator@evid-dgc.com',
    full_name: 'Test Investigator',
    role: 'investigator',
    department: 'CID',
    jurisdiction: 'NYC',
    auth_type: 'email',
    password_hash: passwordHash,
    email_verified: true,
    is_active: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success + JWT token for valid credentials', async () => {
    const lookup = mockUserLookup({ data: baseUser, error: null });
    const logs = { insert: jest.fn().mockResolvedValue({ error: null }) };
    supabase.from.mockImplementation((table) => (table === 'users' ? lookup.from() : logs));

    const req = { body: { email: 'Investigator@Evid-Dgc.com', password: 'password123' } };
    const res = mockRes();

    await emailLogin(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.token).toBeDefined();
    expect(payload.user.role).toBe('investigator');

    // Email must be looked up lowercased
    expect(lookup.eq1.mock.calls[0][1]).toBe('investigator@evid-dgc.com');
  });

  it('returns 401 for a wrong password', async () => {
    const lookup = mockUserLookup({ data: baseUser, error: null });
    supabase.from.mockImplementation((table) => (table === 'users' ? lookup.from() : { insert: jest.fn() }));

    const req = { body: { email: 'investigator@evid-dgc.com', password: 'wrongpassword' } };
    const res = mockRes();

    await emailLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
  });

  it('returns 401 for an unverified email account', async () => {
    const lookup = mockUserLookup({ data: { ...baseUser, email_verified: false }, error: null });
    supabase.from.mockImplementation((table) => (table === 'users' ? lookup.from() : { insert: jest.fn() }));

    const req = { body: { email: 'investigator@evid-dgc.com', password: 'password123' } };
    const res = mockRes();

    await emailLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
  });

  it('returns 400 when email or password is missing', async () => {
    const req = { body: { email: 'investigator@evid-dgc.com' } };
    const res = mockRes();

    await emailLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
  });
});
