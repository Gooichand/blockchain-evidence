/* Read-only preserved PDF revisions and detached CMS validation. Never establishes trust. */
(function (root) {
  'use strict';
  const ascii = (bytes) => new TextDecoder('latin1').decode(bytes);
  const key = (lib, value) => lib.PDFName.of(value);
  function numeric(dict, name, lib) {
    const value = dict.get(key(lib, name));
    if (value === undefined) return null;
    if (
      !(value instanceof lib.PDFNumber) ||
      !Number.isSafeInteger(value.asNumber()) ||
      value.asNumber() < 0
    )
      throw Error('Invalid PDF ' + name + ' integer.');
    return value.asNumber();
  }
  function crossReference(bytes, offset, lib) {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset >= bytes.length)
      throw Error('Invalid cross-reference offset.');
    const text = ascii(bytes.subarray(offset)),
      context = lib.PDFContext.create();
    let object,
      position = 0,
      kind;
    if (/^xref[\t\r\n ]/.test(text)) {
      kind = 'table';
      position = 4;
      let entries = 0;
      while (true) {
        const space = text.slice(position).match(/^[\t\r\n ]*/)[0];
        position += space.length;
        if (text.slice(position, position + 7) === 'trailer') {
          position += 7;
          break;
        }
        const section = text.slice(position).match(/^(\d+)[\t ]+(\d+)[\t ]*(?:\r\n|\r|\n)/);
        if (!section) throw Error('Malformed PDF cross-reference table.');
        const first = Number(section[1]),
          count = Number(section[2]);
        if (
          !Number.isSafeInteger(first) ||
          !Number.isSafeInteger(count) ||
          count < 1 ||
          (entries += count) > 10000
        )
          throw Error('PDF xref entry limit: 10000.');
        position += section[0].length;
        for (let i = 0; i < count; i++) {
          const row = text
            .slice(position)
            .match(/^(\d{10})[\t ](\d{5})[\t ]([nf])[\t ]*(?:\r\n|\r|\n)/);
          if (!row) throw Error('Malformed PDF xref entry.');
          if (row[3] === 'n') {
            const at = Number(row[1]);
            const header = ascii(bytes.subarray(at, Math.min(at + 60, bytes.length)));
            if (!header.startsWith(first + i + ' ' + Number(row[2]) + ' obj'))
              throw Error('Cross-reference entry does not point to its declared object.');
          }
          position += row[0].length;
        }
      }
    } else {
      kind = 'stream';
      const header = text.match(/^\d+[\t ]+\d+[\t ]+obj\b[\t\r\n ]*/);
      if (!header) throw Error('Cross-reference offset is not a table or indirect stream.');
      position = header[0].length;
    }
    const parser = lib.PDFObjectParser.forBytes(bytes.subarray(offset + position), context);
    object = parser.parseObject();
    position += parser.bytes.offset();
    const dict = kind === 'stream' ? object.dict : object;
    if (!(dict instanceof lib.PDFDict)) throw Error('PDF cross-reference dictionary missing.');
    if (kind === 'stream') {
      if (
        !(object instanceof lib.PDFRawStream) ||
        dict.get(key(lib, 'Type'))?.toString() !== '/XRef'
      )
        throw Error('Indirect object is not an XRef stream.');
      const w = dict.get(key(lib, 'W'));
      if (!(w instanceof lib.PDFArray) || w.size() !== 3)
        throw Error('Invalid XRef stream widths.');
      const widths = w.asArray().map((v) => v.asNumber?.());
      if (widths.some((v) => !Number.isInteger(v) || v < 0 || v > 4))
        throw Error('Unsupported XRef stream integer width.');
      const decoded = lib.decodePDFRawStream(object).decode();
      if (decoded.length > 1000000) throw Error('Decoded XRef stream exceeds 1 MB.');
      lib.PDFXRefStreamParser.forStream(object).parseIntoContext();
      const end = ascii(bytes.subarray(offset + position)).match(/^[\t\r\n ]*endobj\b/);
      if (!end) throw Error('XRef stream endobj missing.');
      position += end[0].length;
    }
    if (dict.has(key(lib, 'XRefStm')))
      throw Error('Hybrid-reference PDFs are unsupported; no history inferred.');
    if (dict.has(key(lib, 'Encrypt'))) throw Error('Encrypted PDF history is unsupported.');
    const footer = ascii(bytes.subarray(offset + position)).match(
      /^[\t\r\n ]*startxref[\t\r\n ]+(\d+)[\t\r\n ]+%%EOF(?:\r\n|\r|\n)?/,
    );
    if (!footer || Number(footer[1]) !== offset)
      throw Error('Cross-reference section has no matching revision footer.');
    return {
      offset,
      end: offset + position + footer[0].length,
      eofEnd: offset + position + footer[0].lastIndexOf('%%EOF') + 5,
      kind,
      previous: numeric(dict, 'Prev', lib),
      dict,
    };
  }
  function revisionChain(bytes, lib) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    if (bytes.length > 15 * 1024 * 1024) throw Error('PDF limit: 15 MiB.');
    const tail = ascii(bytes.subarray(Math.max(0, bytes.length - 4096)));
    const last = tail.match(/startxref[\t\r\n ]+(\d+)[\t\r\n ]+%%EOF[\0\t\r\n\f ]*$/);
    if (!last)
      throw Error('Final PDF startxref/EOF is missing or trailing bytes are not whitespace.');
    const chain = [],
      seen = new Set();
    let offset = Number(last[1]);
    while (offset !== null) {
      if (seen.has(offset) || chain.length >= 30)
        throw Error('Cyclic or excessive PDF revision chain (limit 30).');
      seen.add(offset);
      const section = crossReference(bytes, offset, lib);
      if (section.previous !== null && section.previous >= offset)
        throw Error('Prev does not point to an older cross-reference section.');
      if (chain.length && section.end > chain[chain.length - 1].offset)
        throw Error('Overlapping PDF revision boundaries.');
      chain.push(section);
      offset = section.previous;
    }
    return chain.reverse();
  }
  async function history(bytes, lib) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    const chain = revisionChain(bytes, lib),
      revisions = [];
    let prior = {};
    for (let i = 0; i < chain.length; i++) {
      const section = chain[i],
        slice = bytes.slice(0, section.end);
      const doc = await lib.PDFDocument.load(slice, {
        updateMetadata: false,
        throwOnInvalidObject: true,
      });
      if (doc.isEncrypted) throw Error('Encrypted PDFs unsupported.');
      const info = doc.context.lookup(doc.context.trailerInfo.Info),
        properties = {};
      if (info instanceof lib.PDFDict)
        for (const [k, v] of info.entries()) {
          properties[k.toString()] =
            v instanceof lib.PDFString || v instanceof lib.PDFHexString
              ? v.decodeText()
              : v.toString();
        }
      const changedProperties = [];
      for (const name of new Set([...Object.keys(prior), ...Object.keys(properties)]))
        if (prior[name] !== properties[name])
          changedProperties.push({
            name,
            before: prior[name] ?? null,
            after: properties[name] ?? null,
          });
      const sha = Array.from(
        new Uint8Array(await root.crypto.subtle.digest('SHA-256', slice)),
        (b) => b.toString(16).padStart(2, '0'),
      ).join('');
      revisions.push({
        revision: i + 1,
        crossReferenceOffset: section.offset,
        crossReferenceKind: section.kind,
        previousCrossReferenceOffset: section.previous,
        byteLength: section.end,
        sha256: sha,
        pageCount: doc.getPageCount(),
        properties,
        changedProperties,
      });
      prior = properties;
    }
    return {
      preservedRevisionCount: revisions.length,
      revisions,
      currentProperties: revisions[revisions.length - 1].properties,
      historyMeaning:
        'Preserved incremental revisions connected by actual Prev cross-reference pointers, oldest first. Not an external edit history.',
      limit:
        'Maximum 30 revisions/15 MiB/10000 xref entries per table. Standard tables and XRef streams supported; hybrid and encrypted PDFs rejected. Full rewrites can erase prior revisions. Names/dates/properties are editable claims, not verified authorship or timestamps. Structural parsing is not a complete PDF conformance or authenticity check.',
    };
  }
  async function signatures(bytes, lib, cms) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    const chain = revisionChain(bytes, lib);
    const doc = await lib.PDFDocument.load(bytes, {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    if (doc.isEncrypted) throw Error('Encrypted PDFs unsupported.');
    const candidates = [],
      fieldNames = new Map();
    for (const [, obj] of doc.context.enumerateIndirectObjects())
      if (obj instanceof lib.PDFDict && obj.get(key(lib, 'FT'))?.toString() === '/Sig') {
        const value = obj.get(key(lib, 'V')),
          name = obj.get(key(lib, 'T'));
        if (value instanceof lib.PDFRef) {
          const names = fieldNames.get(value.toString()) || [];
          names.push(name?.decodeText?.() || '(unnamed signature field)');
          fieldNames.set(value.toString(), names);
        }
      }
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      if (obj instanceof lib.PDFDict && obj.get(key(lib, 'Type'))?.toString() === '/Sig')
        candidates.push({ ref, dict: obj });
    }
    if (candidates.length > 20) throw Error('Signature limit: 20.');
    const result = [];
    cms.setEngine(
      'local-webcrypto',
      root.crypto,
      new cms.CryptoEngine({
        name: 'local-webcrypto',
        crypto: root.crypto,
        subtle: root.crypto.subtle,
      }),
    );
    for (const { ref, dict } of candidates) {
      const row = {
        reference: ref.toString(),
        associatedSignatureFields: fieldNames.get(ref.toString()) || [],
        cryptographicSignature: 'UNVERIFIED',
        certificateTrust: 'NOT CHECKED',
        revocation: 'NOT CHECKED',
        trustedTimestamp: 'NOT CHECKED',
        modificationPermissions: 'NOT CHECKED',
      };
      try {
        const sub = dict.get(key(lib, 'SubFilter'))?.toString();
        row.subFilter = sub;
        if (!['/adbe.pkcs7.detached', '/ETSI.CAdES.detached'].includes(sub))
          throw Error('Unsupported PDF signature subfilter.');
        const ranges = dict.get(key(lib, 'ByteRange')),
          contents = dict.get(key(lib, 'Contents'));
        if (
          !(ranges instanceof lib.PDFArray) ||
          ranges.size() !== 4 ||
          !(contents instanceof lib.PDFHexString)
        )
          throw Error('Four-value ByteRange and hex Contents required.');
        const r = ranges.asArray().map((x) => x.asNumber?.());
        row.byteRange = r;
        if (
          r.some((x) => !Number.isSafeInteger(x) || x < 0) ||
          r[0] !== 0 ||
          r[1] < 1 ||
          r[2] <= r[1] ||
          r[2] + r[3] > bytes.length
        )
          throw Error('Invalid signature ByteRange bounds.');
        const signedEnd = r[2] + r[3],
          gap = ascii(bytes.subarray(r[1], r[2]));
        if (!/^<[0-9a-fA-F\t\r\n ]+>$/.test(gap))
          throw Error('ByteRange exclusion is not exactly one hex Contents token.');
        const h = gap.slice(1, -1).replace(/\s/g, ''),
          raw = contents.asBytes();
        if (
          h.length % 2 ||
          raw.length !== h.length / 2 ||
          raw.some((b, i) => b !== parseInt(h.slice(2 * i, 2 * i + 2), 16))
        )
          throw Error('Excluded token differs from parsed signature Contents.');
        const revision = chain.find(
          (x) =>
            signedEnd >= x.eofEnd &&
            signedEnd <= x.end + 2 &&
            /^[\r\n]*$/.test(ascii(bytes.subarray(x.eofEnd, signedEnd))),
        );
        if (!revision) throw Error('Signed bytes do not end at a preserved PDF revision boundary.');
        row.signedRevision = chain.indexOf(revision) + 1;
        row.coversCurrentFile = signedEnd === bytes.length;
        row.bytesAppendedAfterSigning = bytes.length - signedEnd;
        const parsed = cms.asn1js.fromBER(
          raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
        );
        if (parsed.offset < 1 || raw.subarray(parsed.offset).some((x) => x !== 0))
          throw Error('Invalid CMS DER or nonzero trailing signature padding.');
        const ci = new cms.ContentInfo({ schema: parsed.result });
        if (ci.contentType !== '1.2.840.113549.1.7.2')
          throw Error('CMS ContentInfo is not SignedData.');
        const signed = new cms.SignedData({ schema: ci.content });
        if (signed.encapContentInfo.eContent)
          throw Error('Attached CMS content is unsupported for detached PDF signatures.');
        if (signed.signerInfos.length !== 1)
          throw Error('Exactly one CMS signer required per PDF signature.');
        const attrs = signed.signerInfos[0].signedAttrs?.attributes;
        if (attrs)
          for (const oid of ['1.2.840.113549.1.9.3', '1.2.840.113549.1.9.4']) {
            const items = attrs.filter((x) => x.type === oid);
            if (items.length !== 1 || items[0].values.length !== 1)
              throw Error('Ambiguous mandatory CMS signed attributes.');
          }
        const digest = signed.signerInfos[0].digestAlgorithm.algorithmId;
        if (
          !['2.16.840.1.101.3.4.2.1', '2.16.840.1.101.3.4.2.2', '2.16.840.1.101.3.4.2.3'].includes(
            digest,
          )
        )
          throw Error('Only SHA-256/384/512 CMS digests supported.');
        const data = new Uint8Array(r[1] + r[3]);
        data.set(bytes.subarray(0, r[1]));
        data.set(bytes.subarray(r[2], signedEnd), r[1]);
        const checked = await signed.verify({
          signer: 0,
          data: data.buffer,
          checkChain: false,
          extendedMode: true,
        });
        row.cryptographicSignature =
          checked.signatureVerified === true ? 'VALID FOR SIGNED BYTE RANGES' : 'INVALID';
        row.digestOID = digest;
        if (checked.signerCertificate) {
          const cert = checked.signerCertificate;
          row.signerSubject = cert.subject.typesAndValues.map((x) => ({
            oid: x.type,
            value: x.value.valueBlock.value,
          }));
          row.certificateNotBefore = cert.notBefore.value.toISOString();
          row.certificateNotAfter = cert.notAfter.value.toISOString();
        }
      } catch (e) {
        row.error = e.message || 'Signature validation failed.';
        if (
          e.signatureVerified === false ||
          (e.code === 15 && e.message === "Error during verification: Message digest doesn't match")
        )
          row.cryptographicSignature = 'INVALID';
      }
      result.push(row);
    }
    return {
      signatureCount: result.length,
      signatures: result,
      cryptographicVerification: result.length
        ? 'PERFORMED FOR SUPPORTED SIGNATURES'
        : 'NO SIGNATURE DICTIONARIES FOUND',
      limit:
        'Valid means only that the supported detached CMS signature matches its signed PDF byte ranges. Not trusted identity, revocation, legal validity, trusted signing time, full PAdES validation, permission-policy validation, or a guarantee the current displayed document is the signed revision. Later updates are reported separately. Unsupported/malformed signatures stay UNVERIFIED, never valid.',
    };
  }
  root.PDFEvidence = { revisionChain, history, signatures, crossReference };
  if (typeof module === 'object') module.exports = root.PDFEvidence;
})(typeof self !== 'undefined' ? self : globalThis);
