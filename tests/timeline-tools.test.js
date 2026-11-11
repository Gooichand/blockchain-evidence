const { normalize, timestamp } = require('../public/timeline-tools');
test('explicit offsets sort by instant and preserve source claims', () => {
  const r = normalize(
    'evidence-timeline',
    JSON.stringify([
      { type: 'evidence', timestamp: '2026-11-11T10:00:00+05:30', description: 'first' },
      { type: 'evidence', timestamp: '2026-11-11T04:00:00Z', description: 'earlier' },
    ]),
  );
  expect(r.events.map((e) => e.description)).toEqual(['earlier', 'first']);
  expect(r.events[1].utc).toBe('2026-11-11T04:30:00.000Z');
});
test('invalid calendar dates and missing offsets fail instead of timezone guesses', () => {
  for (const s of [
    '2026-02-30T12:00:00Z',
    '2026-11-11T12:00:00',
    '2026-11-11T25:00:00Z',
    '2026-11-11T12:00:00+14:30',
  ])
    expect(() => timestamp(s)).toThrow();
});
test('type filter and tied timestamps do not invent event order', () => {
  const r = normalize(
    'custody-timeline',
    JSON.stringify([
      { type: 'evidence', timestamp: '2026-11-11T00:00:00Z', description: 'hide' },
      { type: 'custody', timestamp: '2026-11-11T00:00:00Z', description: 'claim' },
    ]),
  );
  expect(r.displayedCount).toBe(1);
  expect(r.limit).toContain('not proven event sequence');
});
test('ISO year zero leap day is treated as year zero not JavaScript 1900', () => {
  expect(new Date(timestamp('0000-02-29T00:00:00Z')).toISOString()).toBe(
    '0000-02-29T00:00:00.000Z',
  );
});
test('cross-source exact evidence and time rule never treats same-source or blank ID as a match', () => {
  const { correlate } = require('../public/timeline-tools');
  const event = (s, row, t, id = 'CASE1') => ({
    sourceId: s,
    sourceIndex: row,
    timestamp: t,
    evidenceId: id,
  });
  const events = [
    event('one', 1, '2026-11-11T00:00:00Z'),
    event('one', 2, '2026-11-11T00:00:10Z'),
    event('two', 1, '2026-11-11T00:00:20Z'),
    event('three', 1, '2026-11-11T00:30:00Z'),
    event('four', 1, '2026-11-11T00:00:20Z', ''),
  ];
  const r = correlate(events, 30);
  expect(r).toHaveLength(2);
  expect(r[0].secondsApart).toBe(20);
  expect(r.every((x) => x.first.sourceId !== x.second.sourceId)).toBe(true);
  expect(() => correlate(events, -1)).toThrow();
});
test('source merge fingerprints exact bytes and retains provenance rather than deduplicating claims', async () => {
  global.crypto = require('crypto').webcrypto;
  const { analyze } = require('../public/timeline-tools');
  const make = (name, time) => {
    const b = Buffer.from(
      JSON.stringify([
        { type: 'investigation', timestamp: time, description: 'Synthetic', evidenceId: 'CASE1' },
      ]),
    );
    return {
      name,
      size: b.length,
      arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    };
  };
  const r = await analyze(
    'invest-timeline',
    make('a.json', '2026-11-11T00:00:00Z'),
    [make('b.json', '2026-11-11T05:30:10+05:30')],
    30,
  );
  expect(r.displayedCount).toBe(2);
  expect(r.correlationCandidates).toHaveLength(1);
  expect(r.correlationCandidates[0].secondsApart).toBe(10);
  expect(r.sources[0].sha256).toHaveLength(64);
  expect(r.sources[0].sha256).not.toBe(r.sources[1].sha256);
  expect(r.events[1].sourceId).toBe('source-2');
  await expect(
    analyze(
      'invest-timeline',
      make('a.json', '2026-11-11T00:00:00Z'),
      Array(10).fill(make('b', '2026-11-11T00:00:00Z')),
    ),
  ).rejects.toThrow('Source limit');
});
test('derived DOCX source times skip invalid and timezone-free dates without guesses', async () => {
  global.crypto = require('crypto').webcrypto;
  const T = require('../public/timeline-tools');
  global.DocumentForensics = {
    analyze: async () => ({
      embeddedRevisionEvents: [
        { kind: 'ins', date: '2026-11-11T00:00:00', text: 'missing offset', id: '1' },
        { kind: 'del', date: '2026-02-30T00:00:00Z', text: 'invalid', id: '2' },
        {
          kind: 'ins',
          date: '2026-11-11T00:00:00Z',
          text: 'valid claim',
          author: 'Unverified',
          id: '3',
        },
      ],
      properties: {},
    }),
  };
  const file = { name: 'test.docx', size: 1, arrayBuffer: async () => new Uint8Array([1]).buffer };
  const r = await T.analyze('evidence-timeline', file);
  expect(r.displayedCount).toBe(1);
  expect(r.skippedSourceTimes).toHaveLength(2);
  expect(r.events[0].actor).toBe('Unverified');
  expect(r.events[0].sourceReference).toContain('id 3');
  expect(r.sources[0].sha256).toHaveLength(64);
  expect(r.limit).toContain('not verified');
  delete global.DocumentForensics;
});
