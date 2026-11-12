const { lineDiff, signatureStructure, guides } = require('../public/document-forensics');
test('line comparison finds changed synthetic amount and missing lines', () => {
  expect(lineDiff('Amount: 100\n', 'Amount: 101\n')).toEqual({
    equal: false,
    changes: [{ line: 1, first: 'Amount: 100', second: 'Amount: 101' }],
  });
  expect(lineDiff('a', 'a').equal).toBe(true);
  expect(lineDiff('a\nb', 'a').changes[0].second).toBe(null);
});
test('signature marker inventory never claims cryptographic verification', () => {
  const r = signatureStructure(
    new TextEncoder().encode('%PDF /FT /Sig /ByteRange [0 12 30 15] /Contents <abcd>'),
  );
  expect(r.signatureFieldMarkers).toBe(1);
  expect(r.byteRanges).toEqual([[0, 12, 30, 15]]);
  expect(r.cryptographicVerification).toBe('NOT PERFORMED');
});
test('marker absence is not an unsigned verdict', () => {
  const r = signatureStructure(new TextEncoder().encode('%PDF ordinary document'));
  expect(r.signatureFieldMarkers).toBe(0);
  expect(r.limit).toContain('not a conclusive unsigned verdict');
});
test('every document tool has an honest guide', () => {
  expect(Object.keys(guides)).toHaveLength(6);
  expect(guides.signature[1]).toContain('signature-byte integrity');
  expect(guides.ocr[1]).toContain('English');
});
test('OCR rejects unsupported input and oversized PDFs before worker creation', async () => {
  const { analyze } = require('../public/document-forensics');
  global.Tesseract = { createWorker: jest.fn() };
  const destroy = jest.fn();
  global.pdfjsLib = {
    GlobalWorkerOptions: {},
    getDocument: () => ({ promise: Promise.resolve({ numPages: 11, destroy }) }),
  };
  const file = { name: 'scan.pdf', size: 100, arrayBuffer: async () => new ArrayBuffer(1) };
  await expect(analyze('ocr', file)).rejects.toThrow('10 pages');
  expect(destroy).toHaveBeenCalledTimes(1);
  expect(global.Tesseract.createWorker).not.toHaveBeenCalled();
  await expect(analyze('ocr', { ...file, name: 'scan.txt' })).rejects.toThrow('PNG, JPEG or PDF');
  delete global.Tesseract;
  delete global.pdfjsLib;
});
test('OCR PDF pixel safety fails without invented text and terminates worker', async () => {
  const { analyze } = require('../public/document-forensics');
  const terminate = jest.fn(),
    cleanup = jest.fn(),
    destroy = jest.fn();
  const recognize = jest.fn();
  global.Tesseract = { createWorker: async () => ({ recognize, terminate }) };
  global.pdfjsLib = {
    GlobalWorkerOptions: {},
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 1,
        destroy,
        getPage: async () => ({ getViewport: () => ({ width: 10000, height: 10000 }), cleanup }),
      }),
    }),
  };
  await expect(
    analyze('ocr', { name: 'scan.pdf', size: 100, arrayBuffer: async () => new ArrayBuffer(1) }),
  ).rejects.toThrow('pixel limit');
  expect(recognize).not.toHaveBeenCalled();
  expect(cleanup).toHaveBeenCalled();
  expect(terminate).toHaveBeenCalled();
  expect(destroy).toHaveBeenCalled();
  delete global.Tesseract;
  delete global.pdfjsLib;
});
test('pixel comparison catches exact changed bounds without treating tolerance as authenticity', () => {
  const { pixelDifference } = require('../public/document-forensics');
  const a = new Uint8ClampedArray(4 * 4 * 4).fill(255),
    b = a.slice();
  b[(2 * 4 + 1) * 4] = 0;
  const r = pixelDifference(a, b, 4, 4);
  expect(r.changedPixels).toBe(1);
  expect(r.bounds).toEqual({ x: 1, y: 2, width: 1, height: 1 });
  expect(pixelDifference(a, a, 4, 4).changedPixels).toBe(0);
  expect(() => pixelDifference(a, b, 5, 4)).toThrow();
});
