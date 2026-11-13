// Local PostgREST integration harness; requires disposable fixture database.
// Set BE_TEST_POSTGREST_URL to a localhost service with the inventory fixture.
const assert = require('node:assert/strict');
const Module = require('node:module');
const { createClient } = require('@supabase/supabase-js');
const url = process.env.BE_TEST_POSTGREST_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url || '')) throw Error('Local test service only');
// Supabase client normally adds /rest/v1. Local fixture routes that same path.
const client = createClient('http://127.0.0.1:55440', 'local-test-placeholder', {
  global: {
    fetch: (u, o) => {
      const headers = new Headers(o.headers);
      headers.delete('authorization');
      return fetch(String(u).replace('http://127.0.0.1:55440/rest/v1', url), { ...o, headers });
    },
  },
});
const load = Module._load;
Module._load = function (name, parent, ...args) {
  if (parent?.filename.endsWith('/controllers/analystController.js')) {
    if (name === '../config') return { supabase: client };
    if (
      name === '../services/blockchain/blockchainService' ||
      name === '../services/integratedEvidenceService'
    )
      return {};
  }
  return load.call(this, name, parent, ...args);
};
const C = require('../controllers/analystController');
async function call(handler, query = {}, id = 1) {
  const r = {
    body: null,
    statusCode: 200,
    json(x) {
      this.body = x;
      return this;
    },
    status(x) {
      this.statusCode = x;
      return this;
    },
  };
  await C[handler]({ user: { id, email: id === 1 ? 'a' : id === 2 ? 'other' : 'none' }, query }, r);
  assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  return r.body;
}
(async () => {
  const first = await call('getAnalystEvidence', { page: '1', limit: '3' });
  assert.deepEqual(
    first.data.map((x) => x.id),
    [9, 8, 7],
  );
  assert.equal(first.pagination.total, 9);
  assert.equal(first.data[0].task_status, 'in_progress');
  assert.equal(first.data[0].task_id, 22);
  // Case numbers resolve without any PostgREST embed (evidence.case_id has no
  // FK on legacy deployments); absent cases stay null instead of failing.
  assert.equal(first.data.find((x) => x.id === 9).case_number, 'DEMO-2');
  const second = await call('getAnalystEvidence', { page: '2', limit: '3' });
  assert.deepEqual(
    second.data.map((x) => x.id),
    [6, 5, 4],
  );
  assert.equal(second.data.find((x) => x.id === 6).case_number, 'DEMO-1');
  const last = await call('getAnalystEvidence', { page: '3', limit: '3' });
  assert.deepEqual(
    last.data.map((x) => x.id),
    [3, 2, 1],
  );
  assert.equal(last.data.filter((x) => x.id === 1).length, 1); //1500 additional assignment rows, one parent.
  const ownCase = await call('getAnalystEvidence', { case_id: '2' });
  assert.deepEqual(
    ownCase.data.map((x) => x.id),
    [9, 8, 7],
  );
  assert.equal(ownCase.pagination.total, 3);
  const leaked = await call('getAnalystEvidence', { search: 'secret' });
  assert.equal(leaked.pagination.total, 0);
  assert.deepEqual(leaked.data, []);
  const other = await call('getAnalystEvidence', {}, 2);
  assert.deepEqual(
    other.data.map((x) => x.id),
    [10],
  );
  assert.equal(other.data[0].case_number, 'DEMO-3');
  const nobody = await call('getAnalystEvidence', {}, 999);
  assert.deepEqual(nobody.data, []);
  assert.equal(nobody.pagination.pages, 0);
  const cases = await call('getAnalystCases', { limit: '1' });
  assert.deepEqual(
    cases.data.map((x) => x.id),
    [2],
  );
  assert.equal(cases.pagination.total, 2);
  const cases2 = await call('getAnalystCases', { page: '2', limit: '1' });
  assert.deepEqual(
    cases2.data.map((x) => x.id),
    [1],
  );
  console.log(
    'PASS: real PostgreSQL/PostgREST + installed Supabase client/controller. Stable nonoverlapping pages, exact scoped counts,1500duplicate assignments, latest-task tie-break, case filter, cross-analyst search negative, unassigned user, case paging and embed-free case-number lookup.',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
