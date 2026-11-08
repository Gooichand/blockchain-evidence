/**
 * S2: file type verification from magic bytes.
 *
 * The upload API used to trust the browser-supplied MIME type and file
 * extension, so an executable renamed to .pdf sailed through. This module
 * sniffs the real type from the first bytes (no npm dependency), reports
 * mismatches, and marks executables/scripts as dangerous so the controller
 * can require explicit investigator confirmation.
 */

const EXECUTABLE_KINDS = {
  pe: 'a Windows executable (MZ/PE)',
  elf: 'a Linux executable (ELF)',
  macho: 'a macOS executable (Mach-O)',
  script: 'a script file',
};

const DANGEROUS_EXTENSIONS = ['exe', 'dll', 'com', 'scr', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jar', 'sh', 'msi', 'apk', 'app', 'deb', 'rpm'];

function startsWith(buf, bytes, offset = 0) {
  if (buf.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buf[offset + i] !== bytes[i]) return false;
  }
  return true;
}

function asciiAt(buf, offset, len) {
  if (buf.length < offset + len) return '';
  return buf.toString('ascii', offset, offset + len);
}

/** Walk the ZIP central directory and report which names exist. */
function zipEntryNames(buf, max = 40) {
  const names = [];
  try {
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i -= 1) {
      if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return names;
    const count = Math.min(buf.readUInt16LE(eocd + 10), max);
    let off = buf.readUInt32LE(eocd + 16);
    for (let i = 0; i < count; i += 1) {
      if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) break;
      const nameLen = buf.readUInt16LE(off + 28);
      const extraLen = buf.readUInt16LE(off + 30);
      const commentLen = buf.readUInt16LE(off + 32);
      names.push(buf.toString('ascii', off + 46, off + 46 + nameLen));
      off += 46 + nameLen + extraLen + commentLen;
    }
  } catch (e) { /* not a zip */ }
  return names;
}

/**
 * Sniff the real type of a file.
 * Returns:
 * {
 *   detected: { mime, label } | null,   // known content type from magic bytes
 *   dangerous: bool,
 *   dangerReason: string | null,        // why it is dangerous
 *   binaryTextClaim: bool,              // claimed text/* but holds binary
 * }
 */
function sniffFileType(buffer, filename = '') {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const ext = String(filename).toLowerCase().split('.').pop() || '';
  let detected = null;
  let dangerous = false;
  let dangerReason = null;

  // Executable signatures first - they decide danger regardless of anything else.
  if (startsWith(buf, [0x4d, 0x5a])) {
    dangerous = true;
    dangerReason = EXECUTABLE_KINDS.pe;
    detected = { mime: 'application/x-msdownload', label: 'Windows executable' };
  } else if (startsWith(buf, [0x7f, 0x45, 0x4c, 0x46])) {
    dangerous = true;
    dangerReason = EXECUTABLE_KINDS.elf;
    detected = { mime: 'application/x-elf', label: 'ELF executable' };
  } else if (
    startsWith(buf, [0xfe, 0xed, 0xfa, 0xce]) || startsWith(buf, [0xfe, 0xed, 0xfa, 0xcf]) ||
    startsWith(buf, [0xce, 0xfa, 0xed, 0xfe]) || startsWith(buf, [0xcf, 0xfa, 0xed, 0xfe]) ||
    startsWith(buf, [0xca, 0xfe, 0xba, 0xbe])
  ) {
    dangerous = true;
    dangerReason = EXECUTABLE_KINDS.macho;
    detected = { mime: 'application/x-mach-binary', label: 'Mach-O executable' };
  } else if (startsWith(buf, [0x23, 0x21])) {
    dangerous = true;
    dangerReason = EXECUTABLE_KINDS.script;
    detected = { mime: 'text/x-shellscript', label: 'shell script' };
  } else if (DANGEROUS_EXTENSIONS.includes(ext)) {
    dangerous = true;
    dangerReason = `a .${ext} file (${EXECUTABLE_KINDS.script.includes('script') ? 'potentially executable' : 'potentially executable'})`;
  }

  if (!detected) {
    if (startsWith(buf, [0xff, 0xd8, 0xff])) {
      detected = { mime: 'image/jpeg', label: 'JPEG image' };
    } else if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
      detected = { mime: 'image/png', label: 'PNG image' };
    } else if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) {
      detected = { mime: 'image/gif', label: 'GIF image' };
    } else if (startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
      detected = { mime: 'application/pdf', label: 'PDF document' };
    } else if (startsWith(buf, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07])) {
      detected = { mime: 'application/x-rar-compressed', label: 'RAR archive' };
    } else if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buf, [0x50, 0x4b, 0x05, 0x06]) || startsWith(buf, [0x50, 0x4b, 0x07, 0x08])) {
      const names = zipEntryNames(buf);
      if (names.some((n) => n === 'word/document.xml')) {
        detected = { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word document (DOCX)' };
      } else if (names.some((n) => n === 'xl/workbook.xml')) {
        detected = { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel workbook (XLSX)' };
      } else if (names.some((n) => n === 'ppt/presentation.xml')) {
        detected = { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint deck (PPTX)' };
      } else if (names.some((n) => n === 'AndroidManifest.xml')) {
        dangerous = true;
        dangerReason = 'an Android package (APK)';
        detected = { mime: 'application/vnd.android.package-archive', label: 'APK' };
      } else {
        detected = { mime: 'application/zip', label: 'ZIP archive' };
      }
    } else if (asciiAt(buf, 0, 4) === 'RIFF' && asciiAt(buf, 8, 4) === 'WAVE') {
      detected = { mime: 'audio/wav', label: 'WAV audio' };
    } else if (asciiAt(buf, 0, 4) === 'RIFF' && asciiAt(buf, 8, 4) === 'AVI ') {
      detected = { mime: 'video/avi', label: 'AVI video' };
    } else if (asciiAt(buf, 4, 4) === 'ftyp') {
      const brand = asciiAt(buf, 8, 4);
      if (brand.startsWith('qt')) detected = { mime: 'video/quicktime', label: 'QuickTime video' };
      else if (brand === 'M4A ' || brand === 'M4B ') detected = { mime: 'audio/m4a', label: 'M4A audio' };
      else detected = { mime: 'video/mp4', label: 'MP4 video' };
    } else if (asciiAt(buf, 0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
      detected = { mime: 'audio/mpeg', label: 'MP3 audio' };
    } else if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
      detected = { mime: 'application/x-ole2', label: 'legacy Office document (DOC/XLS)' };
    }
  }

  // text/* claim but binary content
  let binaryTextClaim = false;
  if (!detected) {
    const probe = buf.subarray(0, Math.min(buf.length, 8192));
    if (probe.includes(0)) binaryTextClaim = true;
  }

  return { detected, dangerous, dangerReason, binaryTextClaim };
}

/** MIME families that should not count as mismatches. */
const COMPATIBLE_GROUPS = [
  ['image/jpeg', 'image/jpg'],
  ['video/mp4', 'video/quicktime', 'video/mov'],
  ['audio/m4a', 'audio/mp4', 'video/mp4'],
  ['audio/mpeg', 'audio/mp3'],
  ['audio/wav', 'audio/x-wav', 'audio/wave'],
  [
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  ['application/msword', 'application/vnd.ms-excel', 'application/x-ole2'],
];

function mimeCompatible(claimed, detected) {
  if (!claimed || !detected) return true;
  const a = String(claimed).toLowerCase();
  const b = String(detected).toLowerCase();
  if (a === b) return true;
  return COMPATIBLE_GROUPS.some((g) => g.includes(a) && g.includes(b));
}

module.exports = { sniffFileType, mimeCompatible, DANGEROUS_EXTENSIONS };
