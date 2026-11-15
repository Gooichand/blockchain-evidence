const CustodyStore = require('../public/custody-store.js');

test('record, list in time order, and field validation', async () => {
  const st = CustodyStore.createLocalStore();
  await st.recordHandover({
    evidenceId: 'EV-9',
    from: 'Unit A',
    to: 'Unit B',
    purpose: 'Later handover',
    at: '2026-02-02T10:00:00Z',
  });
  await st.recordHandover({
    evidenceId: 'EV-9',
    from: 'Lab',
    to: 'Unit A',
    purpose: 'Earlier handover',
    at: '2026-01-01T10:00:00Z',
  });
  const list = await st.listHandovers('EV-9');
  expect(list).toHaveLength(2);
  expect(list[0].purpose).toBe('Earlier handover');
  expect(list[1].purpose).toBe('Later handover');
  await expect(st.recordHandover({ evidenceId: 'EV-9', from: '', to: 'B', purpose: 'x' }))
    .rejects.toThrow('From is required');
  await expect(
    st.recordHandover({ evidenceId: 'bad id!', from: 'A', to: 'B', purpose: 'x' }),
  ).rejects.toThrow('Evidence ID');
  await expect(
    st.recordHandover({ evidenceId: 'EV-9', from: 'A', to: 'B', purpose: 'x', at: 'not-a-date' }),
  ).rejects.toThrow('date/time');
  await expect(
    st.recordHandover({ evidenceId: 'EV-9', from: 'A'.repeat(121), to: 'B', purpose: 'x' }),
  ).rejects.toThrow('at most 120');
});

test('export/import round-trips and never duplicates ids', async () => {
  const a = CustodyStore.createLocalStore();
  await a.recordHandover({ evidenceId: 'EV-1', from: 'A', to: 'B', purpose: 'One' });
  const payload = await a.exportAll();
  expect(payload.limit).toContain('Local records only');
  const b = CustodyStore.createLocalStore();
  expect(await b.importAll(payload)).toEqual({ added: 1, skipped: 0 });
  expect(await b.importAll(payload)).toEqual({ added: 0, skipped: 1 });
  expect(await b.listHandovers('EV-1')).toHaveLength(1);
  await expect(b.importAll('not json')).rejects.toThrow('not valid JSON');
  await expect(b.importAll({ nope: true })).rejects.toThrow('no custody records');
});

test('demo store is separate, sample-marked and capped evidence IDs enforced', async () => {
  const demo = await CustodyStore.createDemoStore();
  const rows = await demo.listHandovers('SAMPLE-EV-001');
  expect(rows).toHaveLength(3);
  expect(rows.every((r) => r.sample)).toBe(true);
  const own = CustodyStore.createLocalStore();
  expect(await own.listHandovers('SAMPLE-EV-001')).toHaveLength(0);
  for (let i = 0; i < 64; i++)
    await own.recordHandover({ evidenceId: 'EV-' + i, from: 'A', to: 'B', purpose: 'x' });
  await expect(
    own.recordHandover({ evidenceId: 'EV-64', from: 'A', to: 'B', purpose: 'x' }),
  ).rejects.toThrow('evidence ID limit');
  await expect(own.removeHandover('missing')).rejects.toThrow('No local record');
});
