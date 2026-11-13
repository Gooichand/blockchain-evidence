jest.mock('../config', () => ({ supabase: {} }));
jest.mock('../middleware/caseAccess', () => ({}));
jest.mock('../lib/audit', () => ({ logAudit: jest.fn() }));
jest.mock('../services/blockchain/blockchainService', () => ({ getExplorerUrl: () => '' }));
const H = require('../lib/reportExportPayload');
const { buildReport } = require('../controllers/reportController');
const crypto = require('crypto');
const { PDFDocument, PDFName, PDFDict, PDFRawStream, decodePDFRawStream } = require('pdf-lib');
const input = {
  reportType: 'case',
  generatedAt: '2026-11-12T10:00:00.000Z',
  generator: {
    id: 1,
    name: 'Synthetic Analyst',
    role: 'forensic_analyst',
    email: 'omit@example.invalid',
  },
  caseRow: {
    id: 1,
    case_number: 'DEMO-1',
    title: 'Synthetic snapshot',
    description: 'Original test data',
    secret: 'omit',
  },
  evidence: [],
  custody: [],
  notes: [],
  checklist: null,
};
test('snapshot is versioned, deterministic, includes generation time and excludes non-allowlisted fields', () => {
  const a = H.create(input);
  expect(a).toEqual(H.create(input));
  expect(a.snapshotHash).toBe(crypto.createHash('sha256').update(a.payload, 'utf8').digest('hex'));
  expect(a.payload).not.toContain('omit');
  expect(JSON.parse(a.payload).schema).toBe(H.VERSION);
  expect(H.create({ ...input, generatedAt: '2026-11-12T10:01:00.000Z' }).snapshotHash).not.toBe(
    a.snapshotHash,
  );
});
test('PDF contains the exact payload whose bytes reproduce the snapshot digest', async () => {
  const { pdfBytes, reportHash } = await buildReport(input);
  const doc = await PDFDocument.load(pdfBytes);
  let attachments = [];
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFDict && obj.get(PDFName.of('Type'))?.toString() === '/Filespec') {
      const ef = doc.context.lookup(obj.get(PDFName.of('EF')), PDFDict);
      const stream = doc.context.lookup(ef.get(PDFName.of('F')), PDFRawStream);
      attachments.push(Buffer.from(decodePDFRawStream(stream).decode()).toString('utf8'));
    }
  }
  expect(attachments).toEqual([H.create(input).payload]);
  expect(crypto.createHash('sha256').update(attachments[0], 'utf8').digest('hex')).toBe(reportHash);
  expect(crypto.createHash('sha256').update(pdfBytes).digest('hex')).not.toBe(reportHash);
});
test('PDF display mutation does not change the attached-snapshot digest and is not claimed detectable', async () => {
  const { pdfBytes, reportHash } = await buildReport(input);
  const doc = await PDFDocument.load(pdfBytes);
  doc.getPages()[0].drawText('Changed visible text', { x: 50, y: 100 });
  const changed = await doc.save();
  expect(Buffer.from(changed).equals(Buffer.from(pdfBytes))).toBe(false);
  expect(H.create(input).snapshotHash).toBe(reportHash);
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '../controllers/reportController.js'),
    'utf8',
  );
  expect(source).toContain('Changing PDF display text is not detected');
  expect(source).toContain('Digital signature: UNSIGNED');
  expect(source).not.toContain('verifies that this report has not been altered');
});
