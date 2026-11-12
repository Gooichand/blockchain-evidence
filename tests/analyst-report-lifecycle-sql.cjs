// Optional actual PostgreSQL WASM checks. Install @electric-sql/pglite outside
// this repository, then NODE_PATH=/path/to/node_modules node this-file.cjs.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const db = new PGlite();
  const orig = fs.readFileSync(
    path.join(__dirname, '../migrations/add-analysis-module.sql'),
    'utf8',
  );
  await db.exec(
    `CREATE ROLE service_role;CREATE TABLE users(id int primary key);CREATE TABLE evidence(id int primary key);CREATE TABLE cases(id int primary key);`,
  );
  await db.exec(
    orig.slice(
      orig.indexOf('CREATE TABLE IF NOT EXISTS analysis_tasks'),
      orig.indexOf('-- 3. EVIDENCE EXTENSIONS'),
    ),
  );
  await db.exec(
    fs.readFileSync(path.join(__dirname, '../migrations/2026-11-12-report-lifecycle.sql'), 'utf8'),
  );
  await db.exec(
    `INSERT INTO users VALUES(1),(2);INSERT INTO evidence VALUES(1),(2);INSERT INTO cases VALUES(1);INSERT INTO analysis_tasks(id,evidence_id,analyst_id,analyst_wallet) VALUES(1,1,1,'a'),(2,2,1,'a');`,
  );
  const call = async (op, id, rev, submit = false, summary = 'one', analyst = 1, wallet = 'a') => {
    const q = await db.query(
      `SELECT analyst_report_transition($1,$2,$3,$8,$4,'findings',$5,$6,$7,50,null,'medium',null) AS r`,
      [op, id, analyst, summary, 'a'.repeat(64), submit, rev, wallet],
    );
    return q.rows[0].r;
  };
  assert.equal((await call('save', 1, 0, false, 'one', 2, 'other')).code, 'NOT_ASSIGNED');
  assert.equal((await call('save', 999, 0)).code, 'NOT_ASSIGNED');
  assert.equal((await call('save', 1, 0)).revision, 1);
  assert.equal((await call('save', 1, 0)).code, 'STALE_REVISION');
  assert.equal((await call('save', 1, 1, true)).revision, 2);
  assert.equal((await call('save', 1, 1, true)).did_submit, false);
  assert.equal((await call('save', 1, 2, false)).code, 'FINALIZED');
  assert.equal((await call('start', 1, null)).code, 'FINALIZED');
  assert.equal((await call('progress', 1, null)).code, 'FINALIZED');
  await db.exec(
    `CREATE FUNCTION fail_task_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id=2 THEN RAISE EXCEPTION 'injected task failure'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_task BEFORE UPDATE ON analysis_tasks FOR EACH ROW EXECUTE FUNCTION fail_task_update();`,
  );
  await assert.rejects(call('save', 2, 0), /injected task failure/);
  assert.equal(
    (await db.query('SELECT count(*)::int AS n FROM analysis_reports WHERE task_id=2')).rows[0].n,
    0,
  );
  await db.exec('DROP TRIGGER fail_task ON analysis_tasks;');
  const results = await Promise.all([call('save', 2, 0), call('save', 2, 0)]);
  assert.deepEqual(results.map((x) => x.code).sort(), ['OK', 'STALE_REVISION']);
  await db.exec(`INSERT INTO analysis_reports(task_id,evidence_id,analyst_id) VALUES(2,2,1)`);
  assert.equal((await call('save', 2, 1)).code, 'DUPLICATE_REPORTS');
  console.log(
    'PASS: actual PostgreSQL WASM SQL compile, revision/finality/idempotent retry, second-write rollback, queued competing creation, duplicate fail-closed. Multi-session lock contention not tested by this single-engine test.',
  );
  await db.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
