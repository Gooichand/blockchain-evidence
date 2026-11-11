/* Offline bounded packet inspection. No live capture, scanning or host requests. */
(function (root) {
  'use strict';
  const LIMIT = 20 * 1024 * 1024,
    MAX = 100000;
  const guides = {
    'packet-capture': [
      'Offline PCAP / PCAPNG Analyzer',
      'Select a classic PCAP or PCAPNG file. Reads packet timestamps, lengths, link types and decoded headers. No live capture, decryption, stream reassembly or complete protocol coverage. Truncated/unsupported formats are rejected or marked; capture contents are untrusted.',
    ],
    'protocol-decode': [
      'Offline Protocol Decoder',
      'Select PCAP/PCAPNG or paste hexadecimal bytes and choose Ethernet, raw IP or DNS. Decodes Ethernet/VLAN, IPv4/IPv6, TCP/UDP/ICMP, uncompressed or compressed DNS names, HTTP request/status lines and TLS record headers. Custom mode decodes fields from a fixed-offset JSON schema (uint/int/hex/ascii/utf8). No executable dissectors, encrypted payload decryption or stream reassembly.',
    ],
    'traffic-analysis': [
      'Offline Traffic Flow Analysis',
      'Select PCAP/PCAPNG. Groups observed IP packets by bidirectional endpoint/protocol, counts packets and captured/wire bytes, and reports duration and TCP flags. Configurable deterministic rules flag destination IP/port fanout and SYN counts. These are threshold candidates, not an attack verdict or a validated anomaly classifier. Incomplete capture can hide replies. No live monitoring or stream reassembly.',
    ],
    'port-scanner': [
      'Port Scanner - unavailable',
      'No active scanning service is configured. This page never probes a host or port.',
    ],
    'dns-lookup': [
      'DNS / WHOIS Lookup - unavailable',
      'No live DNS, reverse-DNS or WHOIS service is configured. Offline DNS packet decoding is available in Protocol Decoder, but is not a live lookup.',
    ],
    traceroute: [
      'Traceroute / Path Analysis - unavailable',
      'No network probe service is configured. A browser cannot perform raw ICMP/UDP traceroute here.',
    ],
    netstat: [
      'Connection Monitor - unavailable',
      'The page has no permission or native service for reading operating-system socket states.',
    ],
    'ssl-inspect': [
      'Offline TLS Hello and Certificate Inspection',
      'Reads supplied complete ClientHello/ServerHello records and optional ordered PEM certificate signatures. No live server scan, handshake authentication, reassembly, trusted roots, hostname or revocation validation.',
    ],
  };
  function need(bytes, p, n) {
    if (!Number.isSafeInteger(p) || p < 0 || n < 0 || p + n > bytes.length)
      throw Error('Truncated packet or capture field.');
  }
  function ascii(b) {
    return Array.from(b, (x) => (x >= 32 && x <= 126 ? String.fromCharCode(x) : '.')).join('');
  }
  function ip(b) {
    return b.length === 4
      ? Array.from(b).join('.')
      : Array.from({ length: 8 }, (_, i) => ((b[2 * i] << 8) | b[2 * i + 1]).toString(16)).join(
          ':',
        );
  }
  function dns(bytes) {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    need(bytes, 0, 12);
    let visited = new Set();
    function name(start) {
      let labels = [],
        p = start,
        end = null;
      visited = new Set();
      for (let count = 0; count < 128; count++) {
        need(bytes, p, 1);
        if (visited.has(p)) throw Error('DNS compression pointer loop.');
        visited.add(p);
        const n = bytes[p++];
        if (n === 0) return { text: labels.join('.'), next: end === null ? p : end };
        if ((n & 192) === 192) {
          need(bytes, p, 1);
          const dest = ((n & 63) << 8) | bytes[p++];
          if (end === null) end = p;
          p = dest;
          continue;
        }
        if (n & 192 || n > 63) throw Error('Unsupported DNS label.');
        need(bytes, p, n);
        labels.push(ascii(bytes.subarray(p, p + n)));
        p += n;
      }
      throw Error('DNS name limit exceeded.');
    }
    const questions = [];
    const count = v.getUint16(4);
    if (count > 100) throw Error('DNS question limit:100.');
    let p = 12;
    for (let i = 0; i < count; i++) {
      const x = name(p);
      p = x.next;
      need(bytes, p, 4);
      questions.push({ name: x.text, type: v.getUint16(p), class: v.getUint16(p + 2) });
      p += 4;
    }
    return {
      id: v.getUint16(0),
      response: !!(v.getUint16(2) & 32768),
      rcode: v.getUint16(2) & 15,
      questions,
      answerCount: v.getUint16(6),
      authorityCount: v.getUint16(8),
      additionalCount: v.getUint16(10),
      limit: 'Question names decoded; answer RDATA not dissected.',
    };
  }
  function decode(bytes, link = 1) {
    const out = { capturedBytes: bytes.length, linkType: link },
      v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let p = 0,
      type;
    if (link === 1) {
      need(bytes, 0, 14);
      out.ethernet = {
        destination: Array.from(bytes.subarray(0, 6), (x) => x.toString(16).padStart(2, '0')).join(
          ':',
        ),
        source: Array.from(bytes.subarray(6, 12), (x) => x.toString(16).padStart(2, '0')).join(':'),
      };
      type = v.getUint16(12);
      p = 14;
      let tags = 0;
      while (type === 0x8100 || type === 0x88a8) {
        need(bytes, p, 4);
        if (++tags > 2) throw Error('VLAN nesting limit.');
        out.vlan = (out.vlan || []).concat(v.getUint16(p) & 4095);
        type = v.getUint16(p + 2);
        p += 4;
      }
    } else if (link === 101 || link === 228 || link === 229) {
      need(bytes, 0, 1);
      type = bytes[0] >> 4 === 4 ? 0x0800 : bytes[0] >> 4 === 6 ? 0x86dd : 0;
    } else return { ...out, unsupported: 'Unsupported link type; bytes not decoded.' };
    let proto,
      end = bytes.length;
    if (type === 0x0800) {
      need(bytes, p, 20);
      const h = (bytes[p] & 15) * 4,
        total = v.getUint16(p + 2);
      if (bytes[p] >> 4 !== 4 || h < 20 || total < h) throw Error('Invalid IPv4 header.');
      need(bytes, p, h);
      end = Math.min(bytes.length, p + total);
      out.truncated = bytes.length < p + total;
      out.ip = {
        version: 4,
        source: ip(bytes.subarray(p + 12, p + 16)),
        destination: ip(bytes.subarray(p + 16, p + 20)),
        ttl: bytes[p + 8],
        protocol: bytes[p + 9],
        totalBytes: total,
      };
      proto = bytes[p + 9];
      const frag = v.getUint16(p + 6);
      out.ip.fragmentOffset = (frag & 8191) * 8;
      out.ip.moreFragments = !!(frag & 8192);
      p += h;
      if (frag & 8191) return { ...out, note: 'Non-initial fragment; transport not decoded.' };
    } else if (type === 0x86dd) {
      need(bytes, p, 40);
      if (bytes[p] >> 4 !== 6) throw Error('Invalid IPv6 header.');
      const total = 40 + v.getUint16(p + 4);
      end = Math.min(bytes.length, p + total);
      out.truncated = bytes.length < p + total;
      proto = bytes[p + 6];
      out.ip = {
        version: 6,
        source: ip(bytes.subarray(p + 8, p + 24)),
        destination: ip(bytes.subarray(p + 24, p + 40)),
        ttl: bytes[p + 7],
        protocol: proto,
        totalBytes: total,
      };
      p += 40;
      if ([0, 43, 44, 50, 51, 60].includes(proto))
        return { ...out, note: 'IPv6 extension/fragment chain not decoded.' };
    } else return { ...out, etherType: type, unsupported: 'Non-IP Ethernet payload.' };
    const data = bytes.subarray(0, end);
    function requireN(n) {
      need(data, p, n);
    }
    if (proto === 6) {
      requireN(20);
      const h = (bytes[p + 12] >> 4) * 4;
      if (h < 20) throw Error('Invalid TCP header.');
      requireN(h);
      out.transport = {
        protocol: 'TCP',
        sourcePort: v.getUint16(p),
        destinationPort: v.getUint16(p + 2),
        sequence: v.getUint32(p + 4),
        acknowledgment: v.getUint32(p + 8),
        flags: {
          fin: !!(bytes[p + 13] & 1),
          syn: !!(bytes[p + 13] & 2),
          rst: !!(bytes[p + 13] & 4),
          psh: !!(bytes[p + 13] & 8),
          ack: !!(bytes[p + 13] & 16),
        },
        window: v.getUint16(p + 14),
      };
      p += h;
    } else if (proto === 17) {
      requireN(8);
      const len = v.getUint16(p + 4);
      if (len < 8) throw Error('Invalid UDP length.');
      end = Math.min(end, p + len);
      out.transport = {
        protocol: 'UDP',
        sourcePort: v.getUint16(p),
        destinationPort: v.getUint16(p + 2),
        length: len,
      };
      p += 8;
    } else if (proto === 1 || proto === 58) {
      requireN(4);
      out.transport = {
        protocol: proto === 1 ? 'ICMP' : 'ICMPv6',
        type: bytes[p],
        code: bytes[p + 1],
      };
      p += 4;
    } else return { ...out, note: 'Transport protocol not decoded.' };
    const payload = bytes.subarray(p, end);
    out.payloadBytes = payload.length;
    if (
      out.transport.protocol === 'UDP' &&
      [out.transport.sourcePort, out.transport.destinationPort].includes(53)
    ) {
      try {
        out.dns = dns(payload);
      } catch (e) {
        out.applicationWarning = e.message;
      }
    }
    if (out.transport.protocol === 'TCP' && payload.length) {
      const text = ascii(payload.subarray(0, 512));
      if (
        /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|CONNECT) [^ ]+ HTTP\/1\.[01]|^HTTP\/1\.[01] \d{3}/.test(
          text,
        )
      )
        out.http = {
          firstLine: text.split('..')[0],
          limit: 'Only this packet, no reassembly; untrusted text.',
        };
      if (payload.length >= 5 && [20, 21, 22, 23].includes(payload[0]) && payload[1] === 3)
        out.tlsRecord = {
          contentType: payload[0],
          legacyVersion: payload[1] + '.' + payload[2],
          declaredLength: (payload[3] << 8) | payload[4],
          completeRecord: payload.length >= 5 + ((payload[3] << 8) | payload[4]),
          limit: 'Record header only; no decryption or certificate validation.',
        };
    }
    return out;
  }
  function capture(bytes) {
    if (bytes.length > LIMIT) throw Error('Capture limit:20 MiB.');
    need(bytes, 0, 4);
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      packets = [],
      interfaces = [];
    let format;
    function add(offset, len, wire, time, link, interfaceId) {
      if (packets.length >= MAX) throw Error('Packet limit:100000.');
      need(bytes, offset, len);
      let decoded;
      try {
        decoded = decode(bytes.subarray(offset, offset + len), link);
      } catch (e) {
        decoded = { decodeError: e.message };
      }
      packets.push({
        index: packets.length + 1,
        timestampSeconds: time,
        capturedLength: len,
        wireLength: wire,
        interfaceId,
        ...decoded,
      });
    }
    const magic = Array.from(bytes.subarray(0, 4), (x) => x.toString(16).padStart(2, '0')).join('');
    if (['d4c3b2a1', 'a1b2c3d4', '4d3cb2a1', 'a1b23c4d'].includes(magic)) {
      format = 'PCAP';
      need(bytes, 0, 24);
      const le = ['d4c3b2a1', '4d3cb2a1'].includes(magic),
        nano = ['4d3cb2a1', 'a1b23c4d'].includes(magic);
      if (v.getUint16(4, le) !== 2 || v.getUint16(6, le) !== 4)
        throw Error('Unsupported PCAP version.');
      const snap = v.getUint32(16, le),
        link = v.getUint32(20, le) & 65535;
      interfaces.push({
        linkType: link,
        snapLength: snap,
        timestampResolution: nano ? 1e-9 : 1e-6,
      });
      let p = 24;
      while (p < bytes.length) {
        need(bytes, p, 16);
        const sec = v.getUint32(p, le),
          frac = v.getUint32(p + 4, le),
          len = v.getUint32(p + 8, le),
          wire = v.getUint32(p + 12, le);
        if (len > wire || len > snap || frac >= (nano ? 1e9 : 1e6))
          throw Error('Invalid PCAP packet lengths/timestamp.');
        add(p + 16, len, wire, sec + frac * (nano ? 1e-9 : 1e-6), link, 0);
        p += 16 + len;
      }
    } else if (magic === '0a0d0d0a') {
      format = 'PCAPNG';
      let p = 0,
        le = true,
        sectionInterfaces = [];
      while (p < bytes.length) {
        need(bytes, p, 12);
        const isSection = v.getUint32(p) === 0x0a0d0d0a;
        if (isSection) {
          need(bytes, p, 28);
          const bom = v.getUint32(p + 8);
          if (![0x1a2b3c4d, 0x4d3c2b1a].includes(bom)) throw Error('Invalid PCAPNG byte order.');
          le = bom === 0x4d3c2b1a;
        }
        const type = v.getUint32(p, le),
          len = v.getUint32(p + 4, le);
        if (len < 12 || len % 4) throw Error('Invalid PCAPNG block length.');
        need(bytes, p, len);
        if (v.getUint32(p + len - 4, le) !== len) throw Error('PCAPNG block length mismatch.');
        if (isSection) {
          if (v.getUint16(p + 12, le) !== 1) throw Error('Unsupported PCAPNG version.');
          sectionInterfaces = [];
        } else if (type === 1) {
          if (len < 20) throw Error('Invalid interface block.');
          const face = {
            linkType: v.getUint16(p + 8, le),
            snapLength: v.getUint32(p + 12, le),
            timestampResolution: 1e-6,
            timestampOffsetSeconds: 0,
          };
          let q = p + 16;
          while (q + 4 <= p + len - 4) {
            const code = v.getUint16(q, le),
              n = v.getUint16(q + 2, le);
            q += 4;
            if (code === 0) break;
            need(bytes, q, n);
            if (q + n > p + len - 4) throw Error('Invalid interface option.');
            if (code === 9 && n === 1) {
              const x = bytes[q];
              face.timestampResolution = x & 128 ? Math.pow(2, -(x & 127)) : Math.pow(10, -x);
            }
            if (code === 14 && n === 8) face.timestampOffsetSeconds = Number(v.getBigInt64(q, le));
            q += Math.ceil(n / 4) * 4;
          }
          face.globalIndex = interfaces.length;
          interfaces.push(face);
          sectionInterfaces.push(face);
        } else if (type === 6) {
          if (len < 32) throw Error('Invalid enhanced packet block.');
          const id = v.getUint32(p + 8, le),
            face = sectionInterfaces[id];
          if (!face) throw Error('Unknown capture interface.');
          const cap = v.getUint32(p + 20, le),
            wire = v.getUint32(p + 24, le);
          if (cap > wire || cap > len - 32 || (face.snapLength && cap > face.snapLength))
            throw Error('Invalid enhanced packet length.');
          const ticks = (BigInt(v.getUint32(p + 12, le)) << 32n) | BigInt(v.getUint32(p + 16, le));
          add(
            p + 28,
            cap,
            wire,
            Number(ticks) * face.timestampResolution + face.timestampOffsetSeconds,
            face.linkType,
            face.globalIndex,
          );
        } else if (type === 3) {
          if (len < 16 || !sectionInterfaces[0]) throw Error('Invalid simple packet block.');
          const face = sectionInterfaces[0],
            wire = v.getUint32(p + 8, le),
            cap = Math.min(wire, face.snapLength || wire);
          if (cap > len - 16) throw Error('Truncated simple packet.');
          add(p + 12, cap, wire, null, face.linkType, face.globalIndex);
        } else if (type === 2) throw Error('Obsolete PCAPNG packet blocks are unsupported.');
        p += len;
      }
    } else throw Error('Classic PCAP or PCAPNG required.');
    return { format, interfaces, packetCount: packets.length, packets };
  }
  function flows(c) {
    const map = new Map();
    let nonIP = 0,
      failed = 0;
    for (const p of c.packets) {
      if (p.decodeError) failed++;
      if (!p.ip) {
        nonIP++;
        continue;
      }
      const t = p.transport || {},
        a = p.ip.source + ':' + (t.sourcePort ?? ''),
        b = p.ip.destination + ':' + (t.destinationPort ?? ''),
        ends = [a, b].sort(),
        key = JSON.stringify([p.interfaceId, p.ip.version, p.ip.protocol, ...ends]);
      let f = map.get(key);
      if (!f) {
        f = {
          interfaceId: p.interfaceId,
          protocol: t.protocol || String(p.ip.protocol),
          endpointA: ends[0],
          endpointB: ends[1],
          packets: 0,
          aToB: 0,
          bToA: 0,
          capturedBytes: 0,
          wireBytes: 0,
          first: null,
          last: null,
          tcpSyn: 0,
          tcpSynAck: 0,
          tcpRst: 0,
        };
        map.set(key, f);
      }
      f.packets++;
      f[a === ends[0] ? 'aToB' : 'bToA']++;
      f.capturedBytes += p.capturedLength;
      f.wireBytes += p.wireLength;
      if (p.timestampSeconds !== null) {
        f.first = f.first === null ? p.timestampSeconds : Math.min(f.first, p.timestampSeconds);
        f.last = f.last === null ? p.timestampSeconds : Math.max(f.last, p.timestampSeconds);
      }
      if (t.flags) {
        if (t.flags.syn) {
          f.tcpSyn++;
          if (t.flags.ack) f.tcpSynAck++;
        }
        if (t.flags.rst) f.tcpRst++;
      }
    }
    return {
      packetCount: c.packetCount,
      nonIPOrUnsupported: nonIP,
      decodeErrors: failed,
      flowCount: map.size,
      flows: [...map.values()]
        .map((f) => ({
          ...f,
          durationSeconds: f.first === null ? null : f.last - f.first,
          observation:
            f.tcpSyn && !f.tcpSynAck
              ? 'SYN seen, no SYN/ACK observed in this capture; incomplete capture may explain this.'
              : null,
        }))
        .sort((a, b) => b.packets - a.packets),
      limit:
        'Observed capture only. No inferred missing traffic, attack diagnosis or encrypted payload inspection.',
    };
  }
  function customDecode(bytes, schema) {
    if (typeof schema === 'string') {
      if (schema.length > 20000) throw Error('Schema limit:20000 characters.');
      schema = JSON.parse(schema);
    }
    if (
      !schema ||
      !Array.isArray(schema.fields) ||
      schema.fields.length > 64 ||
      !schema.fields.length
    )
      throw Error('Schema needs 1-64 fields.');
    const names = new Set();
    return {
      byteLength: bytes.length,
      fields: schema.fields.map((f) => {
        if (
          !f ||
          typeof f.name !== 'string' ||
          !f.name.trim() ||
          f.name.length > 100 ||
          names.has(f.name)
        )
          throw Error('Each field needs a unique name up to 100 characters.');
        names.add(f.name);
        if (
          !Number.isInteger(f.offset) ||
          !Number.isInteger(f.length) ||
          f.length < 1 ||
          f.length > 4096
        )
          throw Error('Integer field offset and length 1-4096 required.');
        need(bytes, f.offset, f.length);
        if (!['uint', 'int', 'hex', 'ascii', 'utf8'].includes(f.type))
          throw Error('Field type must be uint, int, hex, ascii or utf8.');
        if (f.endian !== undefined && !['little', 'big'].includes(f.endian))
          throw Error('Endian must be little or big.');
        const b = bytes.subarray(f.offset, f.offset + f.length);
        let value;
        if (['uint', 'int'].includes(f.type)) {
          if (![1, 2, 4, 8].includes(f.length)) throw Error('Integer length must be 1,2,4 or8.');
          let x = 0n;
          for (const n of f.endian === 'little' ? [...b].reverse() : b) x = (x << 8n) | BigInt(n);
          if (f.type === 'int' && x & (1n << BigInt(8 * f.length - 1)))
            x -= 1n << BigInt(8 * f.length);
          value = f.length === 8 ? x.toString() : Number(x);
        } else if (f.type === 'hex')
          value = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
        else if (f.type === 'utf8') value = new TextDecoder('utf8', { fatal: true }).decode(b);
        else value = ascii(b);
        return {
          name: f.name,
          offset: f.offset,
          length: f.length,
          type: f.type,
          endian: f.endian || 'big',
          value,
        };
      }),
      limit:
        'Declarative fixed-offset schema only; no expressions, executable scripts, reassembly or automatic protocol inference. 64-bit integers are decimal strings.',
    };
  }
  function flowRules(c, rules = {}) {
    const opts = {
      fanoutThreshold: rules.fanoutThreshold ?? 20,
      synThreshold: rules.synThreshold ?? 3,
    };
    for (const n of Object.values(opts))
      if (!Number.isInteger(n) || n < 1 || n > 100000)
        throw Error('Rule thresholds must be integers 1-100000.');
    const sources = new Map();
    for (const p of c.packets) {
      if (!p.ip || !p.transport) continue;
      const key = JSON.stringify([p.interfaceId, p.ip.source]),
        x = sources.get(key) || {
          interfaceId: p.interfaceId,
          source: p.ip.source,
          destinations: new Set(),
          destinationPorts: new Set(),
          syn: 0,
          synAck: 0,
        };
      x.destinations.add(p.ip.destination);
      if (p.transport.destinationPort !== undefined)
        x.destinationPorts.add(p.transport.destinationPort);
      if (p.transport.flags?.syn && !p.transport.flags.ack) x.syn++;
      sources.set(key, x);
    }
    const flags = [];
    for (const x of sources.values()) {
      if (x.destinations.size >= opts.fanoutThreshold)
        flags.push({
          rule: 'DESTINATION_FANOUT',
          source: x.source,
          interfaceId: x.interfaceId,
          observed: x.destinations.size,
          threshold: opts.fanoutThreshold,
          meaning: 'Distinct destination IP count in this capture meets threshold.',
        });
      if (x.destinationPorts.size >= opts.fanoutThreshold)
        flags.push({
          rule: 'DESTINATION_PORT_FANOUT',
          source: x.source,
          interfaceId: x.interfaceId,
          observed: x.destinationPorts.size,
          threshold: opts.fanoutThreshold,
          meaning: 'Distinct destination-port count in this capture meets threshold.',
        });
      if (x.syn >= opts.synThreshold)
        flags.push({
          rule: 'SYN_COUNT',
          source: x.source,
          interfaceId: x.interfaceId,
          observed: x.syn,
          threshold: opts.synThreshold,
          meaning:
            'Observed SYN-without-ACK packet count meets threshold. Retransmissions are not deduplicated.',
        });
    }
    return {
      thresholds: opts,
      flags,
      limit:
        'Deterministic rule candidates, not a validated attack classifier. Thresholds are user choices; legitimate traffic and incomplete capture can trigger them. No flags does not mean safe traffic.',
    };
  }
  function fromHex(s) {
    const clean = s.replace(/\s/g, '');
    if (!clean || clean.length % 2 || !/^[0-9a-f]+$/i.test(clean) || clean.length > 131070)
      throw Error('Paste even hexadecimal bytes, maximum 65535 bytes.');
    return Uint8Array.from(clean.match(/../g), (x) => parseInt(x, 16));
  }
  async function analyze(id, file, text = '', mode = 'capture', options = {}) {
    if (id === 'protocol-decode' && mode !== 'capture') {
      const b = fromHex(text);
      if (mode === 'custom') return customDecode(b, options.schema);
      if (!['dns', 'ethernet', 'ip'].includes(mode)) throw Error('Unknown protocol mode.');
      return mode === 'dns' ? dns(b) : decode(b, mode === 'ethernet' ? 1 : 101);
    }
    if (!file) throw Error('Select a PCAP/PCAPNG file or use Try example.');
    if (file.size > LIMIT) throw Error('Capture limit:20 MiB.');
    const c = capture(new Uint8Array(await file.arrayBuffer()));
    if (id === 'traffic-analysis') {
      const f = flows(c);
      const { flows: items, ...summary } = f;
      return {
        ...summary,
        anomalyCandidates: flowRules(c, options),
        flows: items.slice(0, 2000),
        displayTruncated: items.length > 2000,
      };
    }
    return {
      ...c,
      packets: c.packets.slice(0, 2000),
      displayTruncated: c.packets.length > 2000,
      limit:
        'First2000 packet reports displayed;20MiB/100000 packet input limit. No live capture, checksums, stream reassembly or decryption. Timestamps may lose sub-microsecond precision.',
    };
  }
  function ready(id) {
    if (id === 'ssl-inspect') return !!root.LocalTLS;
    return ['packet-capture', 'protocol-decode', 'traffic-analysis'].includes(id);
  }
  function n(tag, text, attrs = {}) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function mount(ws, tool, getFile) {
    if (tool.id === 'ssl-inspect' && root.LocalTLS) return root.LocalTLS.mount(ws);
    const [title, guide] = guides[tool.id];
    ws.append(
      n('h2', title),
      n('p', guide, {
        class: 'fl-tool-guide',
        style:
          'padding:16px;line-height:1.6;background:#f8fafc;border:1px solid #ddd;border-radius:10px;',
      }),
      n(
        'p',
        'Local only. No uploads, live capture, scans, DNS requests or automatic navigation. 20 MiB/100000 packets; first2000 reports/flows displayed.',
      ),
    );
    if (!ready(tool.id)) {
      ws.appendChild(n('p', 'Unavailable: no execution service is connected.', { role: 'status' }));
      return;
    }
    let mode, text, schema, fanout, syn;
    if (tool.id === 'protocol-decode') {
      mode = n('select', undefined, { 'aria-label': 'Protocol input mode' });
      for (const x of ['capture', 'ethernet', 'ip', 'dns', 'custom'])
        mode.appendChild(n('option', x, { value: x }));
      text = n('textarea', undefined, {
        'aria-label': 'Protocol hex bytes',
        rows: '4',
        style: 'width:100%;box-sizing:border-box;',
      });
      schema = n('textarea', undefined, {
        'aria-label': 'Custom protocol schema',
        rows: '4',
        style: 'width:100%;box-sizing:border-box;',
      });
      schema.value = JSON.stringify(
        {
          fields: [
            { name: 'version', offset: 0, length: 1, type: 'uint' },
            { name: 'payload', offset: 1, length: 2, type: 'hex' },
          ],
        },
        null,
        2,
      );
      ws.append(
        mode,
        n('p', 'Hex bytes (used outside capture mode)'),
        text,
        n(
          'p',
          'Custom mode: fixed-offset JSON schema. Types uint/int (1,2,4,8 bytes), hex/ascii/utf8; optional endian big/little. No scripts.',
        ),
        schema,
      );
    }
    if (tool.id === 'traffic-analysis') {
      fanout = n('input', undefined, {
        type: 'number',
        min: '1',
        max: '100000',
        value: '20',
        'aria-label': 'Flow fanout threshold',
      });
      syn = n('input', undefined, {
        type: 'number',
        min: '1',
        max: '100000',
        value: '3',
        'aria-label': 'Flow SYN threshold',
      });
      ws.append(
        n('p', 'Rule thresholds. These flag observed counts, not attacks.'),
        n('span', 'Destination IP/port fanout '),
        fanout,
        n('span', ' SYN-without-ACK count '),
        syn,
      );
    }
    const run = n('button', 'Analyze selected capture', {
        class: 'fl-btn fl-btn-primary',
        type: 'button',
      }),
      demo = n('button', '▶ Try example', {
        class: 'fl-btn fl-btn-ghost',
        type: 'button',
        'aria-label': 'Try network example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.append(run, demo, out);
    async function execute(d) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Parsing locally...'));
      try {
        let f = getFile();
        if (d) {
          const r = await fetch('/samples/network/demo.pcap');
          if (!r.ok) throw Error('Example missing.');
          f = new File([await r.arrayBuffer()], 'Synthetic-demo.pcap');
        }
        const result = await analyze(
          tool.id,
          f,
          d ? '' : text?.value,
          d ? 'capture' : mode?.value || 'capture',
          {
            schema: schema?.value,
            fanoutThreshold: d ? 20 : fanout ? Number(fanout.value) : 20,
            synThreshold: d ? 3 : syn ? Number(syn.value) : 3,
          },
        );
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (d)
          out.appendChild(
            n(
              'strong',
              'DEMO SAMPLE - original synthetic UDP DNS and TCP packets. Your evidence and typed input are unchanged.',
            ),
          );
        out.appendChild(
          n('pre', JSON.stringify(result, null, 2), {
            style:
              'padding:16px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;background:#f8fafc;',
          }),
        );
      } catch (e) {
        if (ws.contains(out)) out.replaceChildren(n('p', e.message, { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = {
    decode,
    dns,
    capture,
    flows,
    flowRules,
    customDecode,
    fromHex,
    analyze,
    ready,
    mount,
    guides,
  };
  root.NetworkForensics = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
