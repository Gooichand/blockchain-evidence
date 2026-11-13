const mockCalls = [];
// Per-table mock results: evidence.case_id has no FK, so case numbers arrive
// through a second query on cases, never an embed.
let mockResults;
function mockBuilder(table) {
  const c = { table, ops: [] };
  mockCalls.push(c);
  const b = {};
  for (const m of ['select', 'or', 'eq', 'in', 'order', 'limit', 'range'])
    b[m] = (...args) => {
      c.ops.push([m, ...args]);
      return b;
    };
  b.then = (yes, no) =>
    Promise.resolve(mockResults[table] || { data: [], count: 0, error: null }).then(yes, no);
  return b;
}
jest.mock('../config', () => ({ supabase: { from: jest.fn((t) => mockBuilder(t)) } }));
jest.mock('../services/blockchain/blockchainService', () => ({}));
jest.mock('../services/integratedEvidenceService', () => ({}));
const C = require('../controllers/analystController');
async function call(handler, query = {}) {
  const r = { json: jest.fn(), status: jest.fn() };
  r.status.mockReturnValue(r);
  await C[handler]({ user: { id: 7, email: 'a@example.invalid' }, query }, r);
  return r;
}
beforeEach(() => {
  mockCalls.length = 0;
  mockResults = {};
});
test.each(['getAnalystEvidence', 'getAnalystCases'])(
  '%s rejects malformed paging/filter inputs',
  async (h) => {
    for (const q of [
      { page: '0' },
      { limit: '101' },
      { page: ['1', '2'] },
      { search: 'x'.repeat(201) },
      { status: 'pending' },
    ])
      expect((await call(h, q)).status).toHaveBeenCalledWith(400);
    expect(mockCalls).toHaveLength(0);
  },
);
test('evidence page filters parent rows through assigned tasks before database paging', async () => {
  mockResults = {
    evidence: {
      data: [
        {
          id: 5,
          name: 'Example',
          case_id: '42',
          analysis_tasks: [{ id: 8, status: 'in_progress' }],
          private: 'omit',
        },
      ],
      count: 25000,
    },
    cases: { data: [{ id: 42, case_number: 'DEMO' }] },
  };
  const r = await call('getAnalystEvidence', {
    page: '2',
    limit: '3',
    search: 'file',
    file_type: 'text/plain',
    case_id: '9',
  });
  const c = mockCalls[0];
  expect(mockCalls).toHaveLength(2);
  expect(c.table).toBe('evidence');
  // No PostgREST embed of cases: PGRST200 on deployments where
  // evidence.case_id is TEXT without a foreign key.
  const selectArg = c.ops.find(([m]) => m === 'select')[1];
  expect(selectArg).not.toMatch(/cases\s*\(/);
  expect(selectArg).not.toContain('case:cases');
  expect(mockCalls[1].table).toBe('cases');
  expect(mockCalls[1].ops).toContainEqual(['select', 'id,case_number']);
  expect(mockCalls[1].ops).toContainEqual(['in', 'id', [42]]);
  expect(c.ops).toContainEqual([
    'or',
    'analyst_id.eq.7,analyst_wallet.eq.a@example.invalid',
    { referencedTable: 'analysis_tasks' },
  ]);
  expect(c.ops).toContainEqual(['eq', 'case_id', 9]);
  expect(c.ops).toContainEqual(['eq', 'file_type', 'text/plain']);
  expect(c.ops).toContainEqual(['range', 3, 5]);
  expect(c.ops).toContainEqual(['order', 'id', { ascending: false }]);
  expect(c.ops).toContainEqual([
    'order',
    'assigned_at',
    { referencedTable: 'analysis_tasks', ascending: false, nullsFirst: false },
  ]);
  expect(c.ops).toContainEqual([
    'order',
    'id',
    { referencedTable: 'analysis_tasks', ascending: false },
  ]);
  expect(c.ops).toContainEqual(['limit', 1, { referencedTable: 'analysis_tasks' }]);
  const body = r.json.mock.calls[0][0];
  expect(body.pagination).toEqual({ page: 2, limit: 3, total: 25000, pages: 8334 });
  expect(body.data[0]).toMatchObject({
    task_status: 'in_progress',
    task_id: 8,
    case_number: 'DEMO',
  });
  expect(body.data[0].private).toBeUndefined();
  expect(body.data[0].analysis_tasks).toBeUndefined();
});
test('case page scopes relational count, stable order and allowlisted rows', async () => {
  mockResults = {
    cases: {
      data: [{ id: 1, title: 'Example', analysis_tasks: [{ id: 3 }], private: 'omit' }],
      count: 1,
    },
  };
  const r = await call('getAnalystCases', { search: 'Example' });
  expect(mockCalls[0].ops).toContainEqual([
    'or',
    'analyst_id.eq.7,analyst_wallet.eq.a@example.invalid',
    { referencedTable: 'analysis_tasks' },
  ]);
  expect(mockCalls[0].ops).toContainEqual(['range', 0, 19]);
  expect(mockCalls[0].ops).toContainEqual(['order', 'id', { ascending: false }]);
  expect(r.json.mock.calls[0][0].data[0]).not.toHaveProperty('analysis_tasks');
});
test('known empty result has zero pages and no fallback unscoped read', async () => {
  for (const h of ['getAnalystEvidence', 'getAnalystCases']) {
    const r = await call(h);
    expect(r.json).toHaveBeenCalledWith({
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  }
  expect(mockCalls).toHaveLength(2);
});
test('missing exact count fails rather than publishing an invented total', async () => {
  mockResults = { evidence: { data: [], count: null } };
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect((await call('getAnalystEvidence')).status).toHaveBeenCalledWith(500);
  spy.mockRestore();
});
