/* Original structural-marker fixture. Never executes actions. */
const { PDFDocument, PDFName, PDFString } = require('pdf-lib');
(async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  page.drawText('Original DGC PDF object inventory fixture');
  doc.catalog.set(
    PDFName.of('OpenAction'),
    doc.context.obj({
      S: PDFName.of('JavaScript'),
      JS: PDFString.of('/* inert synthetic marker, no action */'),
    }),
  );
  require('fs').writeFileSync(
    'public/samples/document/objects.pdf',
    await doc.save({ useObjectStreams: true }),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
