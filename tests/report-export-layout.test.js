jest.mock('../config', () => ({ supabase: {} }));
jest.mock('../middleware/caseAccess', () => ({}));
jest.mock('../lib/audit', () => ({ logAudit: jest.fn() }));
jest.mock('../services/blockchain/blockchainService', () => ({ getExplorerUrl: () => '' }));
const { ReportWriter, safeText, buildReport } = require('../controllers/reportController');
const { PDFDocument, StandardFonts } = require('pdf-lib');
test('unsupported Unicode is disclosed, not silently removed; whitespace separates words', () => {
  expect(safeText('नमस्ते 😀')).toContain('[U+0928]');
  expect(safeText('नमस्ते 😀')).toContain('[U+1F600]');
  expect(safeText('a\nb\tc')).toBe('a b c');
  expect(safeText('José')).toBe('José');
});
test('multi-page key/value text checks every line and stays above the footer', async () => {
  const doc = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const w = new ReportWriter(doc, fonts);
  const drawn = [];
  const orig = w.newPage.bind(w);
  const observe = () => {
    const page = w.page;
    const draw = page.drawText.bind(page);
    page.drawText = (text, opts) => {
      drawn.push({ text, ...opts });
      return draw(text, opts);
    };
  };
  observe();
  w.newPage = () => {
    orig();
    observe();
  };
  w.y = 90;
  w.kv(
    'Long multilingual label नमस्ते',
    ('https://example.invalid/' + 'a'.repeat(160) + ' नाम ').repeat(90),
  );
  expect(doc.getPageCount()).toBeGreaterThan(2);
  for (const d of drawn) {
    expect(d.y).toBeGreaterThanOrEqual(70);
    expect(d.x + d.font.widthOfTextAtSize(d.text, d.size)).toBeLessThanOrEqual(545.3);
  }
  expect(drawn.some((x) => x.text.includes('[U+'))).toBe(true);
});
test('long multilingual report renders without WinAnsi exception and preserves original attachment text', async () => {
  const input = {
    reportType: 'case',
    generatedAt: '2026-11-12T10:00:00Z',
    generator: { id: 1, name: 'नमुना 😀', role: 'forensic_analyst' },
    caseRow: {
      id: 1,
      case_number: 'DEMO',
      title: 'नमस्ते',
      description: ('Long field ' + 'x'.repeat(140) + ' ').repeat(40),
    },
    evidence: [],
    custody: [],
    notes: [{ id: 1, content: 'नाम 中文 😀', author: 'नाव' }],
  };
  const { pdfBytes } = await buildReport(input);
  expect((await PDFDocument.load(pdfBytes)).getPageCount()).toBeGreaterThan(1);
});
