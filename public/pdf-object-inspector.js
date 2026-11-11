/* Pinned pdf-lib object inventory. Does not execute PDF actions or verify signatures. */
(function (root) {
  'use strict';
  async function inventory(bytes, lib) {
    const doc = await lib.PDFDocument.load(bytes, {
      updateMetadata: false,
      ignoreEncryption: false,
      throwOnInvalidObject: true,
    });
    const pairs = doc.context.enumerateIndirectObjects();
    if (pairs.length > 10000) throw Error('PDF object limit:10000.');
    const objects = [],
      features = [];
    const describe = (value) => {
      if (value instanceof lib.PDFRef) return { type: 'reference', reference: value.toString() };
      if (value instanceof lib.PDFName) return { type: 'name', value: value.toString() };
      if (value instanceof lib.PDFArray) return { type: 'array', length: value.size() };
      if (value instanceof lib.PDFDict)
        return {
          type: 'dictionary',
          keys: value
            .keys()
            .map((k) => k.toString())
            .slice(0, 100),
        };
      if (value instanceof lib.PDFString || value instanceof lib.PDFHexString)
        return { type: 'string', preview: value.decodeText().slice(0, 128) };
      return { type: value?.constructor?.name || typeof value, value: String(value).slice(0, 128) };
    };
    let visited = 0;
    const scan = (value, path, depth = 0) => {
      if (depth > 12) return;
      if (++visited > 50000) throw Error('PDF nested-object inspection limit:50000.');
      const dict = value instanceof lib.PDFDict ? value : value?.dict;
      if (dict instanceof lib.PDFDict) {
        for (const [key, item] of dict.entries()) {
          const name = key.toString();
          if (
            [
              '/JavaScript',
              '/JS',
              '/OpenAction',
              '/AA',
              '/Launch',
              '/EmbeddedFiles',
              '/AcroForm',
              '/Encrypt',
              '/URI',
            ].includes(name) &&
            features.length < 1000
          )
            features.push({
              path: path + name,
              value: describe(item),
              meaning: 'Structural marker only; context not validated and no action executed.',
            });
          if (!(item instanceof lib.PDFRef)) scan(item, path + name, depth + 1);
        }
      } else if (value instanceof lib.PDFArray)
        for (let i = 0; i < Math.min(value.size(), 1000); i++) {
          const item = value.get(i);
          if (!(item instanceof lib.PDFRef)) scan(item, path + '[' + i + ']', depth + 1);
        }
    };
    for (const [ref, obj] of pairs) {
      scan(obj, ref.toString() + ':');
      if (objects.length >= 2000) continue;
      const dict = obj instanceof lib.PDFDict ? obj : obj?.dict;
      const row = { reference: ref.toString(), ...describe(obj) };
      if (dict instanceof lib.PDFDict) {
        row.dictionary = Object.fromEntries(
          dict
            .entries()
            .slice(0, 100)
            .map(([k, v]) => [k.toString(), describe(v)]),
        );
        if (obj.contents) row.encodedStreamBytes = obj.contents.length;
      }
      objects.push(row);
    }
    return {
      objectCount: pairs.length,
      displayedObjects: objects.length,
      pageCount: doc.getPageCount(),
      catalog: describe(doc.catalog),
      objects,
      structuralMarkers: features,
      limit:
        'Parsed indirect-object inventory, including object streams when the parser supports them. At most2000objects/100keys per displayed dictionary. Stream bodies are not decoded or rendered here. Markers are not proof of malware, authenticity or safe content. No revision-history, CMS signature, encryption or full conformance validation.',
    };
  }
  root.PDFObjectInspector = { inventory };
  if (typeof module === 'object') module.exports = root.PDFObjectInspector;
})(typeof self !== 'undefined' ? self : globalThis);
