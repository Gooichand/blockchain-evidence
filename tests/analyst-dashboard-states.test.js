const mockResults = {};
function mockBuilder(table) {
  const value = mockResults[table] ?? { data: [], count: 0 };
  const b = {};
  for (const k of ['select', 'or', 'eq', 'order', 'limit', 'in']) b[k] = () => b;
  b.then = (yes, no) => Promise.resolve(value).then(yes, no);
  return b;
}
jest.mock('../config', () => ({ supabase: { from: jest.fn((t) => mockBuilder(t)) } }));
jest.mock('../services/blockchain/blockchainService', () => ({
  initialize: jest.fn(),
  isInitialized: jest.fn(() => true),
  getBlockNumber: jest.fn(() => 100),
  getNetworkInfo: () => ({ name: 'test' }),
}));
jest.mock('../services/integratedEvidenceService', () => ({}));
const chain = require('../services/blockchain/blockchainService');
const { getStats } = require('../controllers/analystController');
async function run() {
  const r = { json: jest.fn(), status: jest.fn() };
  r.status.mockReturnValue(r);
  await getStats({ user: { id: 1, email: 'a@example.invalid' } }, r);
  return r.json.mock.calls[0][0].data;
}
beforeEach(() => {
  for (const k of Object.keys(mockResults)) delete mockResults[k];
  chain.initialize.mockResolvedValue();
  chain.getBlockNumber.mockResolvedValue(100);
  chain.isInitialized.mockReturnValue(true);
});
afterEach(() => jest.useRealTimers());
test('no tasks gives known zero counts but no invented integrity percentage', async () => {
  const r = await run();
  expect(r.pending).toBe(0);
  expect(r.assigned_evidence).toBe(0);
  expect(r.evidence_verified).toBe(0);
  expect(r.integrity_score).toBeNull();
  expect(r.average_processing_minutes).toBeNull();
  expect(r.sources.evidence.fresh_integrity_check).toBe(false);
});
test('missing evidence rows are unknown, not100percent or zero verified', async () => {
  mockResults.analysis_tasks = { data: [{ id: 1, evidence_id: 4, status: 'completed' }], count: 1 };
  mockResults.evidence = { data: [] };
  const r = await run();
  expect(r.completed).toBe(1);
  expect(r.evidence_verified).toBeNull();
  expect(r.integrity_score).toBeNull();
  expect(r.sources.evidence.state).toBe('partial');
});
test('stored flags are explicitly labelled and use a complete known denominator', async () => {
  mockResults.analysis_tasks = {
    data: [
      { id: 1, evidence_id: 4 },
      { id: 2, evidence_id: 5 },
    ],
    count: 2,
  };
  mockResults.evidence = {
    data: [
      { id: 4, blockchain_verified: true },
      { id: 5, blockchain_verified: false },
    ],
  };
  const r = await run();
  expect(r.evidence_verified).toBe(1);
  expect(r.integrity_score).toBe(50);
  expect(r.sources.evidence.source).toContain('stored');
});
test('task truncation or error does not claim exact aggregates', async () => {
  for (const v of [{ data: [{ id: 1 }], count: 50 }, { error: { message: 'db failed' } }]) {
    mockResults.analysis_tasks = v;
    const r = await run();
    expect(r.pending).toBeNull();
    expect(r.assigned_cases).toBeNull();
    expect(r.partial).toBe(true);
    expect(r.lab_equipment).toEqual([]);
  }
});
test('equipment/activity failures preserve successful task counts with null failed panels', async () => {
  mockResults.lab_equipment = { error: { message: 'no' } };
  mockResults.activity_logs = { error: { message: 'no' } };
  const r = await run();
  expect(r.pending).toBe(0);
  expect(r.lab_equipment).toBeNull();
  expect(r.recent_activity).toBeNull();
  expect(r.sources.activity.state).toBe('unavailable');
});
test('non-finite completion durations do not become NaN averages', async () => {
  mockResults.analysis_tasks = {
    data: [{ id: 1, status: 'completed', started_at: 'bad', completed_at: 'bad' }],
    count: 1,
  };
  expect((await run()).average_processing_minutes).toBeNull();
});
test('never-resolving RPC probe is bounded and does not discard other panels', async () => {
  jest.useFakeTimers();
  chain.initialize.mockImplementation(() => new Promise(() => {}));
  const pending = run();
  await jest.advanceTimersByTimeAsync(2501);
  const r = await pending;
  expect(r.pending).toBe(0);
  expect(r.blockchain.state).toBe('unavailable');
  expect(r.blockchain.block).toBeNull();
  expect(r.partial).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});
test('unavailable blockchain does not say synced with a null block', async () => {
  chain.getBlockNumber.mockRejectedValue(new Error('offline'));
  const r = await run();
  expect(r.blockchain.state).toBe('unavailable');
  expect(r.blockchain.block).toBeNull();
});
