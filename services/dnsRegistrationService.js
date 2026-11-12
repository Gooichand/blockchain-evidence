/* Public DNS and RDAP reads only. Never connect to the queried host or follow supplied URLs. */
const { Resolver } = require('node:dns').promises;
const { domainToASCII } = require('node:url');
const net = require('node:net');
const axios = require('axios');
const bootstrap = require('../data/rdap-dns-bootstrap.json');
const excluded4 = new net.BlockList(),
  excluded6 = new net.BlockList();
for (const [ip, bits] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 3],
])
  excluded4.addSubnet(ip, bits, 'ipv4');
for (const [ip, bits] of [
  ['::', 96],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
])
  excluded6.addSubnet(ip, bits, 'ipv6');
function normalize(value) {
  if (typeof value !== 'string' || value.length > 253 || value !== value.trim())
    throw Error('Enter a plain public domain or IP, not a URL.');
  const family = net.isIP(value);
  if (family) {
    if ((family === 4 ? excluded4 : excluded6).check(value, family === 4 ? 'ipv4' : 'ipv6'))
      throw Error('Private, special-use and reserved reverse queries are disabled.');
    return { kind: 'ip', value, family };
  }
  if (/[\/\\?#:@%\[\]\s]/.test(value)) throw Error('Enter a domain, not a URL or path.');
  const domain = domainToASCII(value.replace(/\.$/, '')).toLowerCase();
  if (
    !domain ||
    domain.length > 253 ||
    !domain.includes('.') ||
    net.isIP(domain) ||
    !domain.split('.').every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l)) ||
    /\.(local|localhost|internal|test|invalid|example|onion|arpa)$/.test(domain)
  )
    throw Error('Enter a plain public DNS domain. Special-use domains are disabled.');
  return { kind: 'domain', value: domain };
}
function endpoint(domain) {
  const matches = bootstrap.services
    .filter(([suffixes]) => suffixes.some((s) => domain === s || domain.endsWith('.' + s)))
    .sort(
      (a, b) => Math.max(...b[0].map((s) => s.length)) - Math.max(...a[0].map((s) => s.length)),
    );
  const url = matches[0]?.[1].find((s) => s.startsWith('https://'));
  if (!url) return null;
  const u = new URL(url);
  if (u.username || u.password || u.port || u.search || u.hash)
    throw Error('Invalid bootstrap endpoint.');
  return url.replace(/\/?$/, '/') + 'domain/' + domain;
}
function failed(error) {
  return {
    state: 'UNAVAILABLE',
    code: String(error.code || error.response?.status || 'LOOKUP_FAILED').slice(0, 50),
  };
}
async function rdap(domain, client = axios) {
  const url = endpoint(domain);
  if (!url)
    return { state: 'NO_HTTPS_BOOTSTRAP_SERVICE', bootstrapPublication: bootstrap.publication };
  try {
    const r = await client.get(url, {
      timeout: 7000,
      maxRedirects: 0,
      maxContentLength: 1024 * 1024,
      responseType: 'json',
      headers: {
        Accept: 'application/rdap+json',
        'User-Agent': 'DGC-public-registration-read/1.0',
      },
    });
    if (
      r.status !== 200 ||
      !r.data ||
      r.data.objectClassName !== 'domain' ||
      domainToASCII(r.data.ldhName || r.data.unicodeName || '').toLowerCase() !== domain
    )
      return { state: 'UNEXPECTED_REGISTRATION_OBJECT', source: url };
    return {
      state: 'FOUND',
      source: url,
      bootstrapPublication: bootstrap.publication,
      record: r.data,
      note: 'Public RDAP registration data, the successor to WHOIS. Redaction and provider policy apply. Not proof of ownership or identity.',
    };
  } catch (e) {
    return {
      ...failed(e),
      source: url,
      note: 'No redirect followed; no private registration data requested.',
    };
  }
}
async function lookup(value, options = {}) {
  const query = normalize(value),
    resolver = options.resolver || new Resolver({ timeout: 2500, tries: 1 }),
    client = options.client || axios;
  const checkedAt = new Date().toISOString();
  if (query.kind === 'ip') {
    try {
      return {
        query,
        checkedAt,
        reverse: { state: 'FOUND', names: (await resolver.reverse(query.value)).slice(0, 100) },
        note: 'PTR claims from the server resolver, not verified ownership. No target connection.',
      };
    } catch (e) {
      return {
        query,
        checkedAt,
        reverse: failed(e),
        note: 'No PTR result established. No target connection.',
      };
    }
  }
  const records = {};
  await Promise.all(
    ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CAA'].map(async (type) => {
      try {
        const data = await resolver.resolve(query.value, type);
        records[type] = { state: 'FOUND', data: Array.isArray(data) ? data.slice(0, 100) : data };
      } catch (e) {
        records[type] = failed(e);
      }
    }),
  );
  return {
    query,
    checkedAt,
    records,
    registration: await rdap(query.value, client),
    note: 'Live server-resolver DNS plus registry RDAP. No DNSSEC validation, target connection, raw-port WHOIS, scanning or private data access. Provider errors remain explicit.',
  };
}
module.exports = { normalize, endpoint, rdap, lookup };
