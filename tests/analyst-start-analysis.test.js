// Regression tests for analystController.startAnalysis access enforcement
// and status transition semantics (local dashboard fixes, Nov 2026).
const results = {};
const mockRpc = jest.fn();
const recorded = { updatePayloads: [], inserts: [] };
const makeBuilder = (table) => {
  const result = (results[table] && results[table].length ? results[table].shift() : null) || {
    data: null,
    error: null,
  };
  const b = {};
  ['select', 'eq', 'or', 'in', 'order', 'limit', 'range', 'single'].forEach((m) => {
    b[m] = () => b;
  });
  b.update = (payload) => {
    if (table === 'analysis_tasks') recorded.updatePayloads.push(payload);
    return b;
  };
  b.insert = (payload) => {
    recorded.inserts.push({ table, payload });
    return b;
  };
  b.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return b;
};
jest.mock('../config', () => ({
  supabase: { from: jest.fn((table) => makeBuilder(table)), rpc: (...args) => mockRpc(...args) },
}));
jest.mock('../services/blockchain/blockchainService', () => ({}));
jest.mock('../services/integratedEvidenceService', () => ({}));

const { startAnalysis } = require('../controllers/analystController');

const analyst = {
  id: 1,
  email: 'analyst@example.invalid',
  wallet_address: null,
  full_name: 'Test Analyst',
};
const mockRes = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};
const call = (id, body) => {
  const res = mockRes();
  return startAnalysis({ user: analyst, params: { id: String(id) }, body: body || {} }, res).then(
    () => res,
  );
};

beforeEach(() => {
  for (const k of Object.keys(results)) delete results[k];
  mockRpc.mockReset();
  recorded.updatePayloads.length = 0;
  recorded.inserts.length = 0;
});

test('rejects evidence with no pre-existing assignment (403, no task insert)', async () => {
  results.analysis_tasks = [{ data: [], error: null }];
  results.activity_logs = [{ error: null }];
  const res = await call(14, { caseId: 101 });
  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ success: false, error: 'Evidence not assigned to you' }),
  );
  expect(recorded.inserts.filter((i) => i.table === 'analysis_tasks')).toHaveLength(0);
  expect(recorded.updatePayloads).toHaveLength(0);
});

test('starting a pending assignment delegates its transition to the locked RPC', async () => {
  results.analysis_tasks = [{ data: [{ id: 201, status: 'pending' }], error: null }];
  mockRpc.mockResolvedValue({ data: { code: 'OK', task_id: 201, status: 'in_progress' } });
  const res = await call(11, { priority: 'high', caseId: 101 });
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  expect(mockRpc).toHaveBeenCalledWith(
    'analyst_report_transition',
    expect.objectContaining({ p_operation: 'start', p_task_id: 201, p_priority: 'high' }),
  );
  expect(recorded.updatePayloads).toHaveLength(0);
});

// Intentional approved behavior change: submitted
// reports stay immutable; completed tasks require a future new-version workflow.
test('a completed assignment cannot be reopened (409)', async () => {
  results.analysis_tasks = [{ data: [{ id: 203, status: 'completed' }], error: null }];
  mockRpc.mockResolvedValue({ data: { code: 'FINALIZED' } });
  const res = await call(13, {});
  expect(res.status).toHaveBeenCalledWith(409);
  expect(recorded.updatePayloads).toHaveLength(0);
});

test('invalid evidence id returns 400', async () => {
  const res = await call('abc');
  expect(res.status).toHaveBeenCalledWith(400);
});
