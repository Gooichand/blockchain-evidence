const calls = [];
const results = {};
function mockBuilder(table) {
  const result = results[table]?.shift() || { data: [], error: null, count: 0 };
  const call = { table, ops: [] };
  calls.push(call);
  const b = {};
  for (const op of ['select', 'or', 'eq', 'in', 'order', 'range', 'limit', 'single']) {
    b[op] = (...args) => {
      call.ops.push([op, ...args]);
      return b;
    };
  }
  b.then = (yes, no) => Promise.resolve(result).then(yes, no);
  return b;
}
jest.mock('../config', () => ({ supabase: { from: jest.fn((table) => mockBuilder(table)) } }));
jest.mock('../services/blockchain/blockchainService', () => ({}));
jest.mock('../services/integratedEvidenceService', () => ({}));
const C = require('../controllers/analystController');
function response() {
  const r = { status: jest.fn(), json: jest.fn() };
  r.status.mockReturnValue(r);
  return r;
}
async function run(handler, query = {}, id = '1') {
  const r = response();
  await C[handler]({ user: { id: 17, email: 'qa@example.invalid' }, query, params: { id } }, r);
  return r;
}
beforeEach(() => {
  calls.length = 0;
  for (const key of Object.keys(results)) delete results[key];
});
test.each(['getQueue', 'getReports'])(
  '%s rejects malformed pagination before querying',
  async (handler) => {
    for (const query of [
      { page: '0' },
      { page: '-1' },
      { page: '2junk' },
      { page: ['1', '2'] },
      { limit: '-4' },
      { limit: '101' },
      { limit: '1.5' },
      { page: '1000001' },
    ]) {
      expect((await run(handler, query)).status).toHaveBeenCalledWith(400);
    }
    expect(calls).toHaveLength(0);
  },
);
test('filter and search validation rejects unknown or repeated values', async () => {
  for (const query of [
    { status: 'bogus' },
    { priority: 'urgent' },
    { search: ['a', 'b'] },
    { search: 'x'.repeat(201) },
  ])
    expect((await run('getQueue', query)).status).toHaveBeenCalledWith(400);
  expect((await run('getReports', { status: ['draft', 'submitted'] })).status).toHaveBeenCalledWith(
    400,
  );
  expect(calls).toHaveLength(0);
});
test('queue row and count queries retain analyst scope and identical filters', async () => {
  results.evidence = [{ data: [{ id: 4 }, { id: 9 }] }];
  results.analysis_tasks = [{ data: [] }, { count: 7 }];
  const r = await run('getQueue', {
    status: 'pending',
    priority: 'high',
    search: 'sample',
    page: '2',
    limit: '3',
  });
  const queries = calls.filter((c) => c.table === 'analysis_tasks');
  expect(queries).toHaveLength(2);
  for (const q of queries) {
    expect(q.ops).toContainEqual(['eq', 'status', 'pending']);
    expect(q.ops).toContainEqual(['eq', 'priority', 'high']);
    expect(q.ops).toContainEqual(['in', 'evidence_id', [4, 9]]);
    expect(q.ops).toContainEqual(['or', 'analyst_id.eq.17,analyst_wallet.eq.qa@example.invalid']);
  }
  expect(queries[0].ops).toContainEqual(['range', 3, 5]);
  expect(r.json).toHaveBeenCalledWith(
    expect.objectContaining({ pagination: { page: 2, limit: 3, total: 7, pages: 3 } }),
  );
});
test('report status applies to count and rows, including zero-page result', async () => {
  results.analysis_reports = [{ data: [] }, { count: 0 }];
  const r = await run('getReports', { status: 'draft' });
  for (const q of calls) expect(q.ops).toContainEqual(['eq', 'status', 'draft']);
  expect(r.json).toHaveBeenCalledWith(
    expect.objectContaining({ pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
  );
});
test.each([
  'getTaskDetail',
  'startAnalysis',
  'updateTaskProgress',
  'saveReport',
  'verifyEvidenceIntegrity',
  'getEvidenceBlockchain',
])('%s rejects partial/nonpositive ids before database access', async (handler) => {
  for (const id of ['0', '-1', '12junk', '1.5', '9007199254740992'])
    expect((await run(handler, {}, id)).status).toHaveBeenCalledWith(400);
  expect(calls).toHaveLength(0);
});

test('no search matches returns zero total without an unfiltered task read', async () => {
  results.evidence = [{ data: [] }];
  const r = await run('getQueue', { search: 'no-such-sample' });
  expect(calls.filter((c) => c.table === 'analysis_tasks')).toHaveLength(1);
  expect(calls[0].ops.some((op) => op[0] === 'range')).toBe(false);
  expect(r.json).toHaveBeenCalledWith(
    expect.objectContaining({ pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
  );
});
test('report final page uses a bounded range and scoped count', async () => {
  results.analysis_reports = [{ data: [] }, { count: 5 }];
  const r = await run('getReports', { page: '3', limit: '2', status: 'submitted' });
  expect(calls[0].ops).toContainEqual(['range', 4, 5]);
  for (const c of calls)
    expect(c.ops).toContainEqual(['or', 'analyst_id.eq.17,analyst_wallet.eq.qa@example.invalid']);
  expect(r.json).toHaveBeenCalledWith(
    expect.objectContaining({ pagination: { page: 3, limit: 2, total: 5, pages: 3 } }),
  );
});
