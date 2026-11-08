// RFC 6238 TOTP (HMAC-SHA1, 6 digits, 30s step) with RFC 4648 base32 secrets.
const crypto = require('crypto');
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  let bits = 0, value = 0; const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
function hotp(secretBuf, counter) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', secretBuf).update(msg).digest();
  const off = h[h.length - 1] & 0x0f;
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(code % 1000000).padStart(6, '0');
}
function totpToken(secretBase32, offsetSteps = 0) {
  const step = Math.floor(Date.now() / 1000 / 30) + offsetSteps;
  return hotp(base32Decode(secretBase32), step);
}
function totpVerify(secretBase32, token, windowSteps = 1) {
  const t = String(token || '').trim();
  if (!/^\d{6}$/.test(t)) return false;
  for (let i = -windowSteps; i <= windowSteps; i++) {
    if (totpToken(secretBase32, i) === t) return true;
  }
  return false;
}
function generateTotpSecret() { return base32Encode(crypto.randomBytes(20)); }
module.exports = { base32Encode, base32Decode, totpToken, totpVerify, generateTotpSecret };
