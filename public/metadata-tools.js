/* Metadata is editable source data, never verified history. */
(function (root) {
  'use strict';
  const guides = {
    exif: [
      'Embedded EXIF Viewer',
      'Reads embedded JPEG/PNG metadata segments locally: TIFF/EXIF, GPS, interoperability, XMP (including extended multi-segment XMP), IPTC IIM, ICC profiles (including chunked APP2 assembly) and JFIF/PNG headers. The report states which segment types were found or absent. Vendor maker notes are reported as present with their size but are not decoded. Missing tags may have been absent, stripped or unsupported; these editable values do not prove origin.',
    ],
    gps: [
      'Embedded GPS Coordinates',
      'Reads latitude and longitude from embedded EXIF. Select a geotagged JPEG and run. Coordinates are unverified claims, not live location. Nothing is sent to a map service. The example contains deliberately synthetic coordinates.',
    ],
    'camera-info': [
      'Embedded Camera Fields',
      'Reads maker, model, lens, exposure and capture-time fields from embedded EXIF. Run on an image. Field presence does not identify the physical camera or prove when or where the image was taken.',
    ],
    'office-metadata': [
      'Office Properties and Embedded Revisions',
      'Reads DOCX/XLSX/PPTX core, app and custom XML properties and embedded DOCX tracked insertions, deletions, moves and comments. These author/date/text claims are editable, not a complete or verified revision history. XLSX/PPTX historical revisions and legacy DOC/XLS/PPT are unsupported.',
    ],
    'pdf-metadata': [
      'PDF Properties and Preserved Revision History',
      'Select a PDF and run to read current properties and actual preserved incremental revisions linked by Prev cross-reference pointers. Shows oldest-to-newest property snapshots, changed values, page counts, byte boundaries and SHA-256 hashes. Supports ordinary xref tables and streams, maximum 30 revisions/15 MiB; encrypted and hybrid-reference PDFs are rejected. A rewritten file may contain no older revisions. This is embedded history, not recovery of deleted history or verified authorship: names and dates are editable claims.',
    ],
  };
  function cameraFields(tags) {
    const keys = [
      'Make',
      'Model',
      'LensMake',
      'LensModel',
      'LensSerialNumber',
      'BodySerialNumber',
      'DateTimeOriginal',
      'CreateDate',
      'ExposureTime',
      'FNumber',
      'ISO',
      'FocalLength',
      'Software',
    ];
    return Object.fromEntries(keys.filter((k) => tags[k] !== undefined).map((k) => [k, tags[k]]));
  }
  /* Full embedded-segment options: every segment family exifr supports, with
     multi-segment assembly so extended XMP and chunked ICC profiles merge. */
  const SEGMENT_OPTIONS = {
    ifd0: true,
    exif: true,
    gps: true,
    interop: true,
    ifd1: true,
    jfif: true,
    ihdr: true,
    makerNote: true,
    userComment: true,
    tiff: { enabled: true, multiSegment: true },
    xmp: { enabled: true, multiSegment: true },
    iptc: { enabled: true, multiSegment: true },
    icc: { enabled: true, multiSegment: true },
  };
  const MERGED_OPTIONS = { ...SEGMENT_OPTIONS, mergeOutput: true };
  const SEGMENT_LABELS = [
    ['ifd0', 'TIFF/EXIF IFD0'],
    ['exif', 'EXIF detail tags'],
    ['gps', 'GPS'],
    ['interop', 'Interoperability'],
    ['ifd1', 'Thumbnail IFD'],
    ['jfif', 'JFIF'],
    ['ihdr', 'PNG IHDR'],
    ['xmp', 'XMP'],
    ['iptc', 'IPTC IIM'],
    ['icc', 'ICC profile'],
  ];
  function isBinary(v) {
    return v instanceof Uint8Array || (typeof ArrayBuffer !== 'undefined' && v instanceof ArrayBuffer);
  }
  function decodeUserComment(v) {
    if (!isBinary(v)) return typeof v === 'string' ? v : null;
    let s = '';
    for (const b of v) s += b >= 32 && b < 127 ? String.fromCharCode(b) : '\x01';
    for (const prefix of ['ASCII\x01\x01\x01', 'UNICODE\x01', 'JIS\x01\x01\x01\x01\x01'])
      if (s.startsWith(prefix)) return s.slice(prefix.length).replace(/\x01+$/, '');
    return s.replace(/\x01/g, '').trim() || null;
  }
  /* Independent byte-level scan of JPEG APP / PNG chunk structure. exifr
     reports what it decoded; this scan reports what the file actually
     carries, so incomplete extended segments (chunked ICC, extended XMP)
     are stated instead of silently partial. */
  function scanContainer(bytes) {
    const scan = { iccChunks: [], iccDeclared: null, xmpExtension: 0, exifApp1: 0 };
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const at = (i, n = 12) => String.fromCharCode(...u8.subarray(i, i + n));
    if (u8[0] === 0xff && u8[1] === 0xd8) {
      let pos = 2;
      while (pos + 4 <= u8.length && u8[pos] === 0xff) {
        const marker = u8[pos + 1];
        if (marker === 0xda || marker === 0xd9) break;
        const len = (u8[pos + 2] << 8) | u8[pos + 3];
        if (len < 2 || pos + 2 + len > u8.length) break;
        if (marker === 0xe1) {
          if (at(pos + 4, 6) === 'Exif\0\0') scan.exifApp1++;
          if (at(pos + 4, 35) === 'http://ns.adobe.com/xmp/extension/\0') scan.xmpExtension++;
        }
        if (marker === 0xe2 && at(pos + 4, 12) === 'ICC_PROFILE\0') {
          scan.iccChunks.push(u8[pos + 16]);
          scan.iccDeclared = Math.max(scan.iccDeclared || 0, u8[pos + 17]);
        }
        pos += 2 + len;
      }
    } else if (u8[0] === 0x89 && u8[1] === 0x50) {
      let pos = 8;
      while (pos + 8 <= u8.length) {
        const len =
          ((u8[pos] << 24) | (u8[pos + 1] << 16) | (u8[pos + 2] << 8) | u8[pos + 3]) >>> 0;
        const type = String.fromCharCode(u8[pos + 4], u8[pos + 5], u8[pos + 6], u8[pos + 7]);
        if (type === 'iCCP') {
          scan.iccChunks.push(1);
          scan.iccDeclared = 1;
        }
        if (type === 'IEND' || pos + 12 + len > u8.length) break;
        pos += 12 + len;
      }
    }
    return scan;
  }
  async function segmentScan(buf, exifr) {
    const segmented = (await exifr.parse(buf, { ...SEGMENT_OPTIONS, mergeOutput: false })) || {};
    return { segmented, scan: scanContainer(buf) };
  }
  function imageMetadataReport(tags, { segmented, scan }) {
    const embeddedTags = {};
    for (const [k, v] of Object.entries(tags))
      embeddedTags[k] = isBinary(v) ? '[' + (v.byteLength || v.length) + ' bytes, not rendered]' : v;
    const segments = {};
    for (const [key, label] of SEGMENT_LABELS) {
      const v = segmented[key];
      const found = v && (typeof v !== 'object' || Object.keys(v).length > 0);
      segments[label] = found ? 'found' : 'absent';
    }
    if (segments['XMP'] === 'found') {
      const declared = !!(segmented.xmpNote && segmented.xmpNote.HasExtendedXMP);
      if (declared)
        segments['XMP'] =
          scan.xmpExtension > 0
            ? 'found (base + extended APP1 segments merged)'
            : 'found (extended XMP declared but extension segment is missing; base packet only)';
    }
    if (segments['ICC profile'] === 'found' && scan.iccDeclared) {
      const present = new Set(scan.iccChunks).size;
      segments['ICC profile'] =
        present === scan.iccDeclared
          ? 'found (' + present + ' of ' + scan.iccDeclared + ' chunks)'
          : 'found (INCOMPLETE: ' + present + ' of ' + scan.iccDeclared + ' declared chunks present; profile is truncated)';
    }
    const maker = segmented.makerNote;
    const userComment = decodeUserComment(segmented.userComment);
    return {
      embeddedTags,
      segments,
      makerNote: {
        present: !!maker,
        byteLength: maker && (maker.byteLength || maker.length),
        decoded: false,
        note: 'Vendor-specific bytes; presence and size reported, contents not decoded.',
      },
      ...(userComment ? { userComment } : {}),
      limit:
        'Untrusted embedded values, not verified capture history. Segment presence is read from the file container; absent means the file does not carry that segment or it could not be decoded. Maker notes are vendor-specific and reported present-but-undecoded.',
    };
  }
  async function analyze(id, file) {
    if (!file) throw Error('Select a file or use Try example.');
    if (file.size > 15 * 1024 * 1024) throw Error('Metadata limit: 15 MiB.');
    if (id === 'office-metadata') {
      if (!/\.(docx|xlsx|pptx)$/i.test(file.name))
        throw Error('Office metadata supports DOCX/XLSX/PPTX.');
      return root.DocumentForensics.analyze('doc-metadata', file);
    }
    if (id === 'pdf-metadata') {
      if (!/\.pdf$/i.test(file.name)) throw Error('Select a PDF.');
      const current = await root.DocumentForensics.analyze('doc-metadata', file);
      return {
        ...current,
        revisionHistory: await root.DocumentForensics.pdfEvidence(file, 'history'),
      };
    }
    if (!root.exifr) throw Error('EXIF parser unavailable.');
    if (!/\.(jpe?g|png)$/i.test(file.name)) throw Error('Image metadata supports JPEG/PNG.');
    const buf = await file.arrayBuffer();
    const tags = (await root.exifr.parse(buf, MERGED_OPTIONS)) || {};
    if (id === 'exif')
      return imageMetadataReport(tags, await segmentScan(buf, root.exifr));
    if (id === 'camera-info')
      return { camera: cameraFields(tags), limit: 'No physical camera identity was verified.' };
    if (id === 'gps') {
      const lat = tags.latitude,
        lon = tags.longitude,
        valid =
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lon) <= 180;
      return {
        embeddedCoordinates: valid ? { latitude: lat, longitude: lon } : null,
        limit: 'Embedded and editable; not live GPS or verified location.',
      };
    }
    throw Error('Unknown metadata tool.');
  }
  function ready(id) {
    return ['office-metadata', 'pdf-metadata'].includes(id)
      ? !!root.DocumentForensics && root.DocumentForensics.ready('doc-metadata')
      : !!root.exifr;
  }
  function n(tag, text, attrs = {}) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    return x;
  }
  async function example(id) {
    if (id === 'office-metadata') {
      const z = new root.JSZip();
      z.file(
        'word/document.xml',
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>',
      );
      z.file(
        'docProps/core.xml',
        '<cp:coreProperties xmlns:cp="urn:demo" xmlns:dc="urn:demo-dc"><dc:creator>DGC Synthetic</dc:creator><dc:title>Original test properties</dc:title></cp:coreProperties>',
      );
      return new File([await z.generateAsync({ type: 'uint8array' })], 'Demo.docx');
    }
    const path =
      id === 'pdf-metadata'
        ? '/samples/document/signatures/two-updates.pdf'
        : id === 'exif'
          ? '/samples/metadata/extended-segments.jpg'
          : '/samples/metadata/location-demo.jpg';
    const r = await fetch(path);
    if (!r.ok) throw Error('Example unavailable.');
    return new File([await r.arrayBuffer()], id === 'pdf-metadata' ? 'Demo.pdf' : 'Demo.jpg');
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id];
    ws.appendChild(n('h2', title));
    ws.appendChild(
      n('p', guide, {
        style:
          'padding:16px;background:#f8fafc;line-height:1.6;border:1px solid #ddd;border-radius:10px;',
      }),
    );
    ws.appendChild(
      n('p', 'Local processing only. Maximum 15 MiB. No external maps, geocoding or uploads.'),
    );
    const run = n('button', 'Read selected metadata', {
        type: 'button',
        class: 'fl-btn fl-btn-primary',
      }),
      demo = n('button', '▶ Try example', {
        type: 'button',
        class: 'fl-btn fl-btn-ghost',
        'aria-label': 'Try metadata example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.append(run, demo, out);
    async function execute(d) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Reading locally...'));
      try {
        const result = await analyze(tool.id, d ? await example(tool.id) : getFile());
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (d)
          out.appendChild(
            n(
              'strong',
              tool.id === 'gps'
                ? 'DEMO SAMPLE - original synthetic metadata; coordinates are fictional. Your evidence is unchanged.'
                : 'DEMO SAMPLE - real parser output from original synthetic files. Your evidence is unchanged.',
            ),
          );
        out.appendChild(
          n('pre', JSON.stringify(result, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (ws.contains(out))
          out.replaceChildren(n('p', e.message || 'Metadata read failed.', { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = { mount, analyze, ready, cameraFields, guides };
  root.MetadataTools = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
