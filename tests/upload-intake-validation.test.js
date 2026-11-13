jest.mock('../config', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../services/integratedEvidenceService', () => ({ uploadEvidence: jest.fn() }));
jest.mock('../middleware/identity', () => ({ getAuthUser: jest.fn(), getStableWallet: jest.fn() }));
jest.mock('../middleware/caseAccess', () => ({ canAccessCase: jest.fn() }));
jest.mock('../services/caseHelpers', () => ({ isCaseClosed: jest.fn() }));
jest.mock('../services/blockchain/blockchainService', () => ({ getExplorerUrl: jest.fn() }));
jest.mock('../services/storage/ipfsStorageService', () => ({ getGatewayUrl: jest.fn() }));
jest.mock('../controllers/custodyController', () => ({ logCustody: jest.fn() }));
const { supabase } = require('../config'),
  service = require('../services/integratedEvidenceService'),
  identity = require('../middleware/identity'),
  access = require('../middleware/caseAccess'),
  cases = require('../services/caseHelpers');
const { uploadEvidence } = require('../controllers/EvidenceUploadController');
const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });
const req = (caseId = '1') => ({
  body: { caseId, type: 'document' },
  file: {
    buffer: Buffer.from('%PDF-1.4 synthetic'),
    size: 18,
    originalname: 'synthetic.pdf',
    mimetype: 'application/pdf',
  },
});
beforeEach(() => {
  jest.clearAllMocks();
  identity.getAuthUser.mockResolvedValue({ id: 1, role: 'investigator' });
  identity.getStableWallet.mockReturnValue('synthetic-owner');
  access.canAccessCase.mockResolvedValue(true);
  cases.isCaseClosed.mockResolvedValue(false);
  service.uploadEvidence.mockResolvedValue({ database: { id: 1 }, errors: [] });
  supabase.from.mockImplementation((table) => {
    const q = {};
    for (const k of ['select', 'eq']) q[k] = jest.fn(() => q);
    q.single = async () => ({ data: { id: 1 } });
    q.limit = async () => ({ data: [] });
    return q;
  });
});
test.each(['1suffix', '1.5', '-1', '0', '2147483648', ['1']])(
  'invalid case ID rejected without storage side effects: %j',
  async (id) => {
    const r = res();
    await uploadEvidence(req(id), r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(service.uploadEvidence).not.toHaveBeenCalled();
  },
);
test('dangerous executable disguised as PDF requires explicit confirmation', async () => {
  const r = res(),
    q = req();
  q.file.buffer = Buffer.from('MZ' + 'x'.repeat(100));
  await uploadEvidence(q, r);
  expect(r.status).toHaveBeenCalledWith(400);
  expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DANGEROUS_FILE' }));
  expect(service.uploadEvidence).not.toHaveBeenCalled();
});
test('case access denial and closed case stop pipeline', async () => {
  access.canAccessCase.mockResolvedValue(false);
  let r = res();
  await uploadEvidence(req(), r);
  expect(r.status).toHaveBeenCalledWith(403);
  access.canAccessCase.mockResolvedValue(true);
  cases.isCaseClosed.mockResolvedValue(true);
  r = res();
  await uploadEvidence(req(), r);
  expect(r.status).toHaveBeenCalledWith(409);
  expect(service.uploadEvidence).not.toHaveBeenCalled();
});
test('duplicate lookup source failure cannot proceed as if no duplicate exists', async () => {
  supabase.from.mockImplementation((table) => {
    const q = {};
    for (const k of ['select', 'eq']) q[k] = () => q;
    q.single = async () => ({ data: { id: 1 } });
    q.limit = async () => ({ data: null, error: { message: 'synthetic source unavailable' } });
    return q;
  });
  const r = res();
  await uploadEvidence(req(), r);
  expect(service.uploadEvidence).not.toHaveBeenCalled();
  expect(r.status).toHaveBeenCalledWith(503);
});
test.each([1, '1'])(
  'valid integer case ID reaches pipeline with numeric case ID: %j',
  async (id) => {
    const r = res();
    await uploadEvidence(req(id), r);
    expect(service.uploadEvidence).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(String),
      expect.objectContaining({ caseId: 1 }),
      expect.any(String),
    );
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  },
);
