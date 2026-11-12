const mockResults = {};
const mockRpc = jest.fn();
const mockWrites = [];
function mockBuilder(table) {
  const result = mockResults[table]?.shift() || { data: [], error: null };
  const b = {};
  for (const m of ['select', 'eq', 'or', 'in', 'order', 'limit', 'range', 'single']) b[m] = () => b;
  b.insert = (payload) => {
    mockWrites.push({ table, payload });
    return b;
  };
  b.update = (payload) => {
    mockWrites.push({ table, payload });
    return b;
  };
  b.then = (yes, no) => Promise.resolve(result).then(yes, no);
  return b;
}
jest.mock('../config', () => ({
  supabase: { from: jest.fn((t) => mockBuilder(t)), rpc: (...args) => mockRpc(...args) },
}));
jest.mock('../services/blockchain/blockchainService', () => ({}));
jest.mock('../services/integratedEvidenceService', () => ({}));
jest.mock('../services/notificationService', () => ({ notifyUser: jest.fn() }));
const C = require('../controllers/analystController');
const { notifyUser } = require('../services/notificationService');
const user = { id: 1, email: 'analyst@example.invalid' };
async function call(handler, body = {}, id = '1') {
  const r = { status: jest.fn(), json: jest.fn() };
  r.status.mockReturnValue(r);
  await C[handler]({ user, params: { id }, body }, r);
  return r;
}
beforeEach(() => {
  mockRpc.mockReset();
  mockWrites.length = 0;
  notifyUser.mockClear();
  for (const k of Object.keys(mockResults)) delete mockResults[k];
});
test('save uses one RPC with scope and revision; no application report/task writes', async () => {
  mockRpc.mockResolvedValue({
    data: { code: 'OK', report_id: 9, status: 'draft', revision: 2, did_submit: false },
  });
  const r = await call('saveReport', {
    result_summary: 'one',
    findings: 'two',
    expected_revision: 1,
  });
  expect(mockRpc).toHaveBeenCalledTimes(1);
  expect(mockRpc).toHaveBeenCalledWith(
    'analyst_report_transition',
    expect.objectContaining({
      p_analyst_id: 1,
      p_wallet: user.email,
      p_task_id: 1,
      p_expected_revision: 1,
      p_operation: 'save',
    }),
  );
  expect(
    mockWrites.filter((x) => ['analysis_tasks', 'analysis_reports'].includes(x.table)),
  ).toHaveLength(0);
  expect(r.json).toHaveBeenCalledWith(
    expect.objectContaining({ success: true, data: expect.objectContaining({ revision: 2 }) }),
  );
});
test.each(['STALE_REVISION', 'DUPLICATE_REPORTS', 'FINALIZED'])(
  '%s is409 with no followup write',
  async (code) => {
    mockRpc.mockResolvedValue({ data: { code } });
    const r = await call('saveReport', { findings: 'x', expected_revision: 1 });
    expect(r.status).toHaveBeenCalledWith(409);
    expect(mockWrites).toHaveLength(0);
    expect(notifyUser).not.toHaveBeenCalled();
  },
);
test('unassigned RPC response returns404 without private details', async () => {
  mockRpc.mockResolvedValue({ data: { code: 'NOT_ASSIGNED' } });
  const r = await call('saveReport', { findings: 'x' });
  expect(r.status).toHaveBeenCalledWith(404);
  expect(mockWrites).toHaveLength(0);
});
test.each(['PGRST202', '42883', '42501'])(
  'missing/unavailable transition %s fails closed503',
  async (code) => {
    mockRpc.mockResolvedValue({ error: { code } });
    const r = await call('saveReport', { findings: 'x' });
    expect(r.status).toHaveBeenCalledWith(503);
    expect(mockWrites).toHaveLength(0);
  },
);
test.each([
  { findings: ' ' },
  { findings: 5 },
  { findings: 'x', submit: 'true' },
  { findings: 'x', expected_revision: -1 },
  { findings: 'x', expected_revision: '1' },
  { findings: 'x'.repeat(50001) },
])('bad report input does not call RPC', async (body) => {
  expect((await call('saveReport', body)).status).toHaveBeenCalledWith(400);
  expect(mockRpc).not.toHaveBeenCalled();
});
test('only winning submission emits completion notification', async () => {
  mockRpc
    .mockResolvedValueOnce({
      data: {
        code: 'OK',
        report_id: 9,
        status: 'submitted',
        revision: 2,
        did_submit: true,
        requested_by: 'requester',
        evidence_id: 4,
      },
    })
    .mockResolvedValueOnce({
      data: { code: 'OK', report_id: 9, status: 'submitted', revision: 2, did_submit: false },
    });
  for (let n = 0; n < 2; n++)
    expect(
      (await call('saveReport', { findings: 'x', submit: true, expected_revision: 1 })).json,
    ).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  expect(notifyUser).toHaveBeenCalledTimes(1);
  expect(mockWrites.filter((x) => x.payload?.action === 'report_submitted')).toHaveLength(1);
});
test('progress on completed/finalized task409 and strict progress validation', async () => {
  mockRpc.mockResolvedValue({ data: { code: 'FINALIZED' } });
  expect((await call('updateTaskProgress', { progress: 50 })).status).toHaveBeenCalledWith(409);
  for (const progress of ['50', -1, 101, 1.5])
    expect((await call('updateTaskProgress', { progress })).status).toHaveBeenCalledWith(400);
  expect(mockRpc).toHaveBeenCalledTimes(1);
});
