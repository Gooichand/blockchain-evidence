const CustodyStore = require('../public/custody-store.js');
const TimelineTools = require('../public/timeline-tools.js');

test('local custody records become a sorted custody timeline with honest limit', async () => {
  const st = CustodyStore.createLocalStore();
  await st.recordHandover({
    evidenceId: 'EV-3',
    from: 'Unit B',
    to: 'Locker',
    purpose: 'Return',
    at: '2026-02-02T10:00:00Z',
  });
  await st.recordHandover({
    evidenceId: 'EV-3',
    from: 'Unit A',
    to: 'Unit B',
    purpose: 'Seizure',
    at: '2026-01-01T10:00:00Z',
  });
  const r = await TimelineTools.custodyFromStore(st, 'EV-3');
  expect(r.localRecordsOnly).toBe(true);
  expect(r.limit).toContain('Local custody records only');
  expect(r.events).toHaveLength(2);
  expect(r.events[0].description).toContain('Unit A -> Unit B');
  expect(r.events[1].description).toContain('Unit B -> Locker');
  expect(r.events[0].actor).toBe('Unit A');
});

test('empty and invalid local timeline requests fail closed', async () => {
  const st = CustodyStore.createLocalStore();
  const r = await TimelineTools.custodyFromStore(st, 'EV-none');
  expect(r.events).toHaveLength(0);
  await expect(TimelineTools.custodyFromStore(st, '')).rejects.toThrow('evidence ID');
  await expect(TimelineTools.custodyFromStore(null, 'EV-1')).rejects.toThrow('unavailable');
});
