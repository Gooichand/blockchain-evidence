/* Metadata is editable source data, never verified history. */
(function (root) {
  'use strict';
  const guides = {
    exif: [
      'Embedded EXIF Viewer',
      'Reads supported embedded image tags with exifr. Select a JPEG/PNG and run. Missing tags may have been absent, stripped or unsupported; these editable values do not prove origin.',
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
    const tags = (await root.exifr.parse(await file.arrayBuffer(), true)) || {};
    if (id === 'exif')
      return {
        embeddedTags: tags,
        limit: 'Untrusted embedded values, not verified capture history.',
      };
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
