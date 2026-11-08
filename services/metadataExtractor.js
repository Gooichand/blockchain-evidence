const zlib = require('zlib');

/**
 * S1: automatic metadata extraction on upload.
 *
 * No new npm dependencies (the lockfile cannot be updated through the web
 * commit flow), so this module parses the common formats directly:
 *  - Images: dimensions via sharp; EXIF (camera make/model, software,
 *    timestamps, GPS) from the raw EXIF buffer with a minimal TIFF reader.
 *  - PDF: document properties from the Info dictionary.
 *  - Office Open XML (docx/xlsx/pptx): core properties from docProps/core.xml
 *    inside the ZIP container.
 *
 * Extraction must never break an upload: every parser failure returns what
 * was gathered so far.
 */

function ascii(buf, offset, count) {
  return buf.toString('ascii', offset, offset + count).replace(/\0.*$/s, '').trim();
}

/** Minimal TIFF/EXIF reader. Returns flat tag map for IFD0, ExifIFD and GPS. */
function parseExif(buf) {
  const out = {};
  if (!buf || buf.length < 8) return out;
  const le = buf.toString('ascii', 0, 2) === 'II';
  if (!le && buf.toString('ascii', 0, 2) !== 'MM') return out;
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const s32 = (o) => (le ? buf.readInt32LE(o) : buf.readInt32BE(o));
  if (u16(2) !== 42) return out;

  const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

  function readValue(type, count, valueOffset) {
    const size = (TYPE_SIZE[type] || 1) * count;
    const off = size <= 4 ? valueOffset : u32(valueOffset);
    if (off < 0 || off + size > buf.length) return null;
    switch (type) {
      case 2: return ascii(buf, off, count);
      case 3: return count === 1 ? u16(off) : Array.from({ length: count }, (_, i) => u16(off + i * 2));
      case 4: return count === 1 ? u32(off) : Array.from({ length: count }, (_, i) => u32(off + i * 4));
      case 9: return count === 1 ? s32(off) : Array.from({ length: count }, (_, i) => s32(off + i * 4));
      case 5: return Array.from({ length: count }, (_, i) => {
        const d = u32(off + i * 8 + 4);
        return d === 0 ? 0 : u32(off + i * 8) / d;
      });
      case 10: return Array.from({ length: count }, (_, i) => {
        const d = s32(off + i * 8 + 4);
        return d === 0 ? 0 : s32(off + i * 8) / d;
      });
      default: return null;
    }
  }

  function readIfd(ifdOffset, tagNames) {
    if (ifdOffset <= 0 || ifdOffset + 2 > buf.length) return;
    const count = u16(ifdOffset);
    for (let i = 0; i < count; i += 1) {
      const entry = ifdOffset + 2 + i * 12;
      if (entry + 12 > buf.length) break;
      const tag = u16(entry);
      const type = u16(entry + 2);
      const num = u32(entry + 4);
      if (tagNames[tag]) {
        const v = readValue(type, num, entry + 8);
        if (v !== null && v !== '') out[tagNames[tag]] = v;
      }
    }
  }

  const IFD0 = {
    0x010f: 'make', 0x0110: 'model', 0x0131: 'software', 0x0132: 'dateTime',
    0x0112: 'orientation', 0x010e: 'imageDescription',
  };
  const EXIF = {
    0x9003: 'dateTimeOriginal', 0x9004: 'dateTimeDigitized',
    0x829a: 'exposureTime', 0x829d: 'fNumber', 0x8827: 'iso',
    0x920a: 'focalLength', 0xa434: 'lensModel',
  };
  const GPS = {
    0x0001: 'latRef', 0x0002: 'lat', 0x0003: 'lonRef', 0x0004: 'lon',
    0x0005: 'altRef', 0x0006: 'alt', 0x001d: 'gpsDate',
  };

  readIfd(u32(4), IFD0);

  // Locate ExifIFD (0x8769) and GPS IFD (0x8825) pointers from IFD0.
  const ifd0Offset = u32(4);
  if (ifd0Offset + 2 <= buf.length) {
    const count = u16(ifd0Offset);
    for (let i = 0; i < count; i += 1) {
      const entry = ifd0Offset + 2 + i * 12;
      if (entry + 12 > buf.length) break;
      const tag = u16(entry);
      if (tag === 0x8769) readIfd(u32(entry + 8), EXIF);
      if (tag === 0x8825) readIfd(u32(entry + 8), GPS);
    }
  }

  if (Array.isArray(out.lat) && Array.isArray(out.lon) && out.lat.length === 3 && out.lon.length === 3) {
    const dms = (a) => a[0] + a[1] / 60 + a[2] / 3600;
    let lat = dms(out.lat);
    let lon = dms(out.lon);
    if (out.latRef === 'S') lat = -lat;
    if (out.lonRef === 'W') lon = -lon;
    out.gps = { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 };
    delete out.lat; delete out.lon; delete out.latRef; delete out.lonRef;
  }
  return out;
}

/** EXIF timestamps look like "2024:05:17 14:22:01". */
function parseExifDate(v) {
  if (typeof v !== 'string') return null;
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(v.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function pdfStreamsText(buf) {
  // pdf-lib and most generators store the Info dict inside FlateDecode object
  // streams, so gather plain text plus every stream we can inflate.
  const parts = [buf.toString('latin1')];
  const raw = buf.toString('latin1');
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf('endstream', start);
    if (end === -1) break;
    const data = Buffer.from(raw.slice(start, end), 'latin1');
    try { parts.push(zlib.inflateSync(data).toString('latin1')); } catch (e) { /* not flate */ }
    re.lastIndex = end + 9;
  }
  return parts.join('\n');
}

function parsePdfProperties(buf) {
  const out = {};
  const text = pdfStreamsText(buf);
  const grab = (key) => {
    const m = new RegExp(`\\/${key}\\s*\\(([^)]*)\\)`).exec(text) || new RegExp(`\\/${key}\\s*<([0-9A-Fa-f]+)>`).exec(text);
    if (!m) return null;
    if (m[1] && /^[0-9A-Fa-f]+$/.test(m[1]) && m[1].length % 2 === 0 && m[1].length > 8) {
      try {
        // PDF hex strings are UTF-16BE (FEFF BOM); Buffer has no utf16be, so swap pairs.
        const raw = Buffer.from(m[1], 'hex');
        const swapped = Buffer.alloc(raw.length);
        for (let i = 0; i + 1 < raw.length; i += 2) { swapped[i] = raw[i + 1]; swapped[i + 1] = raw[i]; }
        return swapped.toString('utf16le').replace(/\uFEFF/g, '').replace(/[^\x20-\x7E]/g, '').trim() || null;
      } catch (e) { return null; }
    }
    return m[1].trim() || null;
  };
  const fields = { Title: 'title', Author: 'author', Creator: 'creator', Producer: 'producer', CreationDate: 'creationDate', ModDate: 'modDate' };
  for (const [k, name] of Object.entries(fields)) {
    const v = grab(k);
    if (v) out[name] = v;
  }
  return out;
}

/** Read one file out of a ZIP container (Office documents are ZIPs). */
function unzipEntry(buf, nameWanted) {
  // End of central directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i += 1) {
    if (off + 46 > buf.length) return null;
    if (buf.readUInt32LE(off) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('ascii', off + 46, off + 46 + nameLen);
    if (name === nameWanted) {
      if (localOff + 30 > buf.length) return null;
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const dataOff = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataOff, dataOff + compSize);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      return null;
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function parseOfficeProperties(buf) {
  const out = {};
  const xml = unzipEntry(buf, 'docProps/core.xml');
  if (!xml) return out;
  const text = xml.toString('utf8');
  const grab = (tag) => {
    const m = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`).exec(text);
    return m ? m[1].trim() : null;
  };
  const fields = {
    'dc:title': 'title', 'dc:creator': 'creator', 'cp:lastModifiedBy': 'lastModifiedBy',
    'dcterms:created': 'created', 'dcterms:modified': 'modified', 'cp:revision': 'revision',
    'dc:subject': 'subject',
  };
  for (const [tag, name] of Object.entries(fields)) {
    const v = grab(tag);
    if (v) out[name] = v;
  }
  return out;
}

/**
 * Extract metadata for an upload. Returns:
 *   { extracted: {...}, flags: [{ code, message }] }
 * `context.forensic` is the investigator-entered forensic intake metadata (M6)
 * and `context.uploadedAt` the upload time, both used for mismatch flags.
 */
async function extractMetadata(fileBuffer, mimeType, context = {}) {
  const extracted = {};
  const flags = [];
  const mime = String(mimeType || '').toLowerCase();

  try {
    if (mime.startsWith('image/')) {
      try {
        const sharp = require('sharp');
        const meta = await sharp(fileBuffer).metadata();
        if (meta.width) extracted.width = meta.width;
        if (meta.height) extracted.height = meta.height;
        if (meta.format) extracted.format = meta.format;
        if (meta.exif && meta.exif.length >= 8) {
          // sharp hands back the raw APP1 payload, sometimes with the Exif\0\0 preamble
          let exifBuf = meta.exif;
          if (exifBuf.toString('ascii', 0, 6) === 'Exif\0\0') exifBuf = exifBuf.subarray(6);
          Object.assign(extracted, parseExif(exifBuf));
        }
      } catch (e) {
        console.error('image metadata extraction failed:', e.message);
      }
      const taken = parseExifDate(extracted.dateTimeOriginal) || parseExifDate(extracted.dateTime) || null;
      if (taken) extracted.takenAt = taken;
      const uploadedAt = context.uploadedAt ? new Date(context.uploadedAt) : new Date();
      if (taken && new Date(taken).getTime() > uploadedAt.getTime() + 60000) {
        flags.push({ code: 'exif_date_after_upload', message: `EXIF timestamp (${taken}) is after the upload time - the clock on the capture device may be wrong or the file may have been altered.` });
      }
      const claimed = context.forensic && (context.forensic.deviceMakeModel || context.forensic.sourceDevice);
      const actual = (extracted.model && extracted.make && String(extracted.model).toLowerCase().startsWith(String(extracted.make).toLowerCase()))
        ? extracted.model
        : [extracted.make, extracted.model].filter(Boolean).join(' ');
      if (claimed && actual && !actual.toLowerCase().includes(String(claimed).toLowerCase()) && !String(claimed).toLowerCase().includes(actual.toLowerCase())) {
        flags.push({ code: 'device_mismatch', message: `Intake form names device "${claimed}" but the file EXIF says "${actual}".` });
      }
    } else if (mime === 'application/pdf') {
      Object.assign(extracted, parsePdfProperties(fileBuffer));
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      Object.assign(extracted, parseOfficeProperties(fileBuffer));
    }
  } catch (e) {
    console.error('metadata extraction failed:', e.message);
  }

  return { extracted, flags };
}

module.exports = { extractMetadata, parseExif, parsePdfProperties, parseOfficeProperties };
