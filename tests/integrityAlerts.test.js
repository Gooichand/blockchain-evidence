// M5: access control on integrity alert acknowledgement.
// The route must never let a user acknowledge an alert on evidence they
// cannot access, must reject public viewers and malformed IDs, and must
// 404 cleanly for missing alerts.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-jest';

const mockState = {
  user: { id: 57, role: 'investigator' },
  alert: { id: 3, evidence_id: 42 },
  evidence: { id: 42, case_id: 8, submitted_by: 'user_58' },
  access: true,
  updates: 0,
};

jest.mock('../config', () => ({
  supabase: {
    from: (table) => {
      let updated = false;
      const q = {
        select: () => q,
        eq: () => q,
        update: () => { updated = true; mockState.updates++; return q; },
        maybeSingle: () => Promise.resolve({
          data: table === 'integrity_alerts' ? mockState.alert : mockState.evidence,
          error: null,
        }),
        then: (resolve, reject) => Promise.resolve({
          data: updated ? [{ id: 3, acknowledged: true }] : [],
          error: null,
        }).then(resolve, reject),
      };
      return q;
    },
  },
}));

jest.mock('../middleware/identity', () => ({
  getAuthUser: async () => mockState.user,
  getStableWallet: () => 'user_57',
}));

jest.mock('../middleware/caseAccess', () => ({
  canAccessEvidence: async (_user, row) => {
    if (!row || row.id !== 42) throw new Error('expected the alert evidence row');
    return mockState.access;
  },
}));

jest.mock('../services/integratedEvidenceService', () => ({}));
jest.mock('../services/blockchain/blockchainService', () => ({}));

const { acknowledgeIntegrityAlert } = require('../controllers/EvidenceVerificationController');

const mockRes = () => {
  const res = { statusCode: 200 };
  res.status = (n) => { res.statusCode = n; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
};

describe('acknowledgeIntegrityAlert access control', () => {
  beforeEach(() => {
    mockState.user = { id: 57, role: 'investigator' };
    mockState.alert = { id: 3, evidence_id: 42 };
    mockState.evidence = { id: 42, case_id: 8, submitted_by: 'user_58' };
    mockState.access = true;
    mockState.updates = 0;
  });

  test('denies acknowledgement without evidence access and writes nothing', async () => {
    mockState.access = false;
    const res = mockRes();
    await acknowledgeIntegrityAlert({ params: { id: '3' } }, res);
    expect(res.statusCode).toBe(403);
    expect(mockState.updates).toBe(0);
  });

  test('allows acknowledgement with evidence access', async () => {
    const res = mockRes();
    await acknowledgeIntegrityAlert({ params: { id: '3' } }, res);
    expect(res.statusCode).toBe(200);
    expect(mockState.updates).toBe(1);
  });

  test('denies public viewers', async () => {
    mockState.user = { id: 99, role: 'public_viewer' };
    const res = mockRes();
    await acknowledgeIntegrityAlert({ params: { id: '3' } }, res);
    expect(res.statusCode).toBe(403);
    expect(mockState.updates).toBe(0);
  });

  test('rejects malformed alert IDs with 400', async () => {
    const res = mockRes();
    await acknowledgeIntegrityAlert({ params: { id: '1junk' } }, res);
    expect(res.statusCode).toBe(400);
    expect(mockState.updates).toBe(0);
  });

  test('404s for a missing alert without writing', async () => {
    mockState.alert = null;
    const res = mockRes();
    await acknowledgeIntegrityAlert({ params: { id: '3' } }, res);
    expect(res.statusCode).toBe(404);
    expect(mockState.updates).toBe(0);
  });
});
