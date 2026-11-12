const fs = require('fs');
const N = require('../public/network-forensics');
const fixture = () => new Uint8Array(fs.readFileSync('public/samples/network/demo.pcap'));
test('original PCAP packets decode DNS, TCP and HTTP; bidirectional flows are real counts', () => {
  const c = N.capture(fixture());
  expect(c.packetCount).toBe(4);
  expect(c.packets[0].dns.questions[0].name).toBe('demo.example');
  expect(c.packets[3].http.firstLine).toBe('GET /demo HTTP/1.1');
  const f = N.flows(c);
  expect(f.flowCount).toBe(2);
  expect(f.flows[0]).toMatchObject({
    protocol: 'TCP',
    packets: 3,
    aToB: 2,
    bToA: 1,
    durationSeconds: 2,
    tcpSyn: 2,
    tcpSynAck: 1,
    observation: null,
  });
});
test('PCAPNG and PCAP preserve packet bytes, timestamp and flow counts', () => {
  const a = N.capture(fixture()),
    b = N.capture(new Uint8Array(fs.readFileSync('public/samples/network/demo.pcapng')));
  expect(b.packetCount).toBe(a.packetCount);
  expect(b.packets).toEqual(a.packets);
  expect(N.flows(b)).toEqual(N.flows(a));
});
test('big endian PCAP and nanosecond timestamps parse', () => {
  const original = fixture(),
    c = N.capture(original),
    packet = original.slice(40, 40 + c.packets[0].capturedLength);
  const b = new Uint8Array(40 + packet.length),
    v = new DataView(b.buffer);
  v.setUint32(0, 0xa1b23c4d);
  v.setUint16(4, 2);
  v.setUint16(6, 4);
  v.setUint32(16, 65535);
  v.setUint32(20, 1);
  v.setUint32(24, 100);
  v.setUint32(28, 250000000);
  v.setUint32(32, packet.length);
  v.setUint32(36, packet.length);
  b.set(packet, 40);
  expect(N.capture(b).packets[0].timestampSeconds).toBe(100.25);
});
test('reject malformed capture headers, lengths and packet truncation', () => {
  expect(() => N.capture(new Uint8Array(3))).toThrow('Truncated');
  expect(() => N.capture(new Uint8Array(24))).toThrow('required');
  const b = fixture();
  new DataView(b.buffer).setUint32(32, 999999, true);
  expect(() => N.capture(b)).toThrow('length');
  expect(() => N.capture(fixture().slice(0, -1))).toThrow('Truncated');
  const ng = new Uint8Array(fs.readFileSync('public/samples/network/demo.pcapng'));
  ng[27] = 1;
  expect(() => N.capture(ng)).toThrow('mismatch');
});
test('unsupported links are marked, packet decode failures do not invent headers', () => {
  const b = fixture();
  new DataView(b.buffer).setUint32(20, 147, true);
  const c = N.capture(b);
  expect(c.packets[0].unsupported).toContain('Unsupported link');
  expect(N.flows(c).nonIPOrUnsupported).toBe(4);
  const bad = fixture();
  bad[40 + 14] = 0x40;
  expect(N.capture(bad).packets[0].decodeError).toContain('Invalid IPv4');
});
test('DNS pointer loops fail closed and compressed question names work', () => {
  const b = new Uint8Array(18);
  b[5] = 1;
  b[12] = 0xc0;
  b[13] = 12;
  expect(() => N.dns(b)).toThrow('loop');
  const x = new Uint8Array(22);
  x[5] = 1;
  x[12] = 0xc0;
  x[13] = 18;
  x.set([0, 1, 0, 1, 1, 97, 0, 0], 14);
  expect(N.dns(x).questions[0].name).toBe('a');
});
test('hex input rejects odd invalid and oversized values', () => {
  expect(Array.from(N.fromHex('00 ff\n12'))).toEqual([0, 255, 18]);
  for (const s of ['0', 'gg', '', 'ab'.repeat(65536)]) expect(() => N.fromHex(s)).toThrow();
});
test('IPv6 UDP, VLAN and fragments retain honest decode limits', () => {
  const v6 = new Uint8Array(48);
  v6[0] = 0x60;
  v6[5] = 8;
  v6[6] = 17;
  v6[7] = 64;
  v6[23] = 1;
  v6[39] = 2;
  v6[45] = 8;
  expect(N.decode(v6, 101).transport.protocol).toBe('UDP');
  v6[6] = 44;
  expect(N.decode(v6, 101).note).toContain('extension');
  const p = fixture().slice(40, 40 + N.capture(fixture()).packets[0].capturedLength);
  p[20] = 0;
  p[21] = 1;
  expect(N.decode(p).note).toContain('Non-initial');
});
test('all unbuilt network operations stay unavailable; no service calls', () => {
  for (const id of ['port-scanner', 'dns-lookup', 'traceroute', 'netstat', 'ssl-inspect'])
    expect(N.ready(id)).toBe(false);
  for (const id of ['packet-capture', 'traffic-analysis', 'protocol-decode'])
    expect(N.ready(id)).toBe(true);
});
test('custom declarative protocol schema decodes exact bytes without executing code', () => {
  const r = N.customDecode(Uint8Array.from([0xfe, 0x34, 0x12, 65, 66]), {
    fields: [
      { name: 'signed', offset: 0, length: 1, type: 'int' },
      { name: 'size', offset: 1, length: 2, type: 'uint', endian: 'little' },
      { name: 'text', offset: 3, length: 2, type: 'utf8' },
    ],
  });
  expect(r.fields.map((x) => x.value)).toEqual([-2, 0x1234, 'AB']);
  expect(
    N.customDecode(new Uint8Array(8).fill(255), {
      fields: [{ name: 'large', offset: 0, length: 8, type: 'uint' }],
    }).fields[0].value,
  ).toBe('18446744073709551615');
  for (const fields of [
    [{ name: 'x', offset: 0, length: 6, type: 'uint' }],
    [{ name: 'x', offset: 0, length: 1, type: 'script' }],
    [{ name: 'x', offset: 9, length: 1, type: 'hex' }],
    [
      { name: 'x', offset: 0, length: 1, type: 'uint' },
      { name: 'x', offset: 0, length: 1, type: 'uint' },
    ],
  ])
    expect(() => N.customDecode(new Uint8Array(8), { fields })).toThrow();
});
test('flow anomaly candidates follow explicit user thresholds, not attack claims', () => {
  const c = N.capture(fixture());
  expect(N.flowRules(c).flags).toEqual([]);
  const r = N.flowRules(c, { fanoutThreshold: 2, synThreshold: 1 });
  expect(r.flags.map((x) => x.rule)).toEqual(
    expect.arrayContaining(['DESTINATION_FANOUT', 'DESTINATION_PORT_FANOUT', 'SYN_COUNT']),
  );
  expect(r.limit).toContain('not a validated attack classifier');
  expect(() => N.flowRules(c, { synThreshold: 0 })).toThrow();
});
