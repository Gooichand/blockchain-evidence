'use strict';
importScripts('/vendor/pdf-lib-1.17.1.min.js', '/pdf-object-inspector.js');
self.onmessage = async (event) => {
  try {
    const file = event.data;
    if (!file || file.size > 15 * 1024 * 1024) throw Error('PDF object input limit:15MiB.');
    const result = await PDFObjectInspector.inventory(
      new Uint8Array(await file.arrayBuffer()),
      PDFLib,
    );
    self.postMessage({ ok: true, result });
  } catch (e) {
    self.postMessage({ ok: false, error: e.message || 'PDF object inspection failed.' });
  }
};
