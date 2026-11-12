'use strict';
importScripts('/vendor/pdf-lib-1.17.1.min.js', '/vendor/cms-bundle.js', '/pdf-evidence.js');
self.onmessage = async (event) => {
  try {
    const { file, operation } = event.data;
    if (!file || file.size > 15 * 1024 * 1024) throw Error('PDF limit: 15 MiB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result =
      operation === 'history'
        ? await PDFEvidence.history(bytes, PDFLib)
        : operation === 'signatures'
          ? await PDFEvidence.signatures(bytes, PDFLib, LocalCMS)
          : null;
    if (!result) throw Error('Unsupported PDF evidence operation.');
    self.postMessage({ ok: true, result });
  } catch (e) {
    self.postMessage({ ok: false, error: e.message || 'PDF evidence inspection failed.' });
  }
};
