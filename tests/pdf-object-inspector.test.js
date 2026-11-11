const lib = require('pdf-lib');
const { inventory } = require('../public/pdf-object-inspector');
test('compressed object-stream PDF inventories references, stream metadata and inert action markers', async () => {
  const doc = await lib.PDFDocument.create();
  doc.addPage();
  doc.catalog.set(
    lib.PDFName.of('OpenAction'),
    doc.context.obj({ S: lib.PDFName.of('JavaScript'), JS: lib.PDFString.of('not executed') }),
  );
  const bytes = await doc.save({ useObjectStreams: true });
  const r = await inventory(bytes, lib);
  expect(r.objectCount).toBeGreaterThan(0);
  expect(r.pageCount).toBe(1);
  expect(r.structuralMarkers.some((x) => x.path.includes('/OpenAction'))).toBe(true);
  expect(r.structuralMarkers.some((x) => x.path.includes('/JS'))).toBe(true);
  expect(r.limit).toContain('not proof');
});
test('malformed PDF fails without fabricated objects', async () => {
  await expect(inventory(new TextEncoder().encode('not a PDF'), lib)).rejects.toThrow();
});
