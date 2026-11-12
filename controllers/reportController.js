const exportPayload = require('../lib/reportExportPayload');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { supabase } = require('../config');
const { canAccessCase, canAccessEvidence } = require('../middleware/caseAccess');
const { logAudit } = require('../lib/audit');
const blockchainService = require('../services/blockchain/blockchainService');

/** Case/evidence snapshot export. The attached canonical JSON has a content
 * digest. That digest is not a PDF-byte integrity check or a digital signature.
 */

const RED = rgb(0.72, 0.11, 0.16);
const DARK = rgb(0.12, 0.12, 0.14);
const GREY = rgb(0.42, 0.44, 0.48);
const LIGHT = rgb(0.55, 0.56, 0.6);
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const BOTTOM = 70;

// pdf-lib standard fonts encode WinAnsi only; anything outside would throw.
function safeText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function fmtSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return 'unknown';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtTime(value) {
  if (!value) return 'n/a';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'n/a';
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

class ReportWriter {
  constructor(doc, fonts) {
    this.doc = doc;
    this.fonts = fonts;
    this.page = null;
    this.y = 0;
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(space) {
    if (this.y - space < BOTTOM) this.newPage();
  }

  wrap(text, size, font, maxWidth) {
    const words = safeText(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      // Break words longer than a full line (hashes, URLs).
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut -= 1;
        if (line) { lines.push(line); line = ''; }
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      const trial = line ? `${line} ${rest}` : rest;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        line = trial;
      } else {
        if (line) lines.push(line);
        line = rest;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  text(value, { size = 10, font = 'regular', color = DARK, indent = 0, gap = 3 } = {}) {
    const f = this.fonts[font];
    const lines = this.wrap(value, size, f, PAGE_W - 2 * MARGIN - indent);
    for (const ln of lines) {
      this.ensure(size + 4);
      this.page.drawText(ln, { x: MARGIN + indent, y: this.y - size, size, font: f, color });
      this.y -= size + gap;
    }
  }

  kv(key, value, opts = {}) {
    this.ensure(14);
    const f = this.fonts.bold;
    this.page.drawText(safeText(key), { x: MARGIN, y: this.y - 10, size: 10, font: f, color: DARK });
    const keyW = 130;
    const lines = this.wrap(value === '' || value === null || value === undefined ? 'n/a' : value, 10, this.fonts.regular, PAGE_W - 2 * MARGIN - keyW);
    for (const ln of lines) {
      this.page.drawText(ln, { x: MARGIN + keyW, y: this.y - 10, size: 10, font: this.fonts.regular, color: opts.color || DARK });
      this.y -= 13;
    }
    this.y -= 1;
  }

  heading(title) {
    this.ensure(34);
    this.y -= 6;
    this.page.drawRectangle({ x: MARGIN, y: this.y - 16, width: 4, height: 15, color: RED });
    this.page.drawText(safeText(title), { x: MARGIN + 10, y: this.y - 13, size: 13, font: this.fonts.bold, color: DARK });
    this.y -= 26;
  }

  rule() {
    this.ensure(10);
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 0.6, color: rgb(0.85, 0.85, 0.87) });
    this.y -= 8;
  }

  space(n = 6) { this.y -= n; }
}

async function loadCaseOr404(res, caseId) {
  const { data, error } = await supabase.from('cases').select('*').eq('id', caseId).single();
  if (error || !data) {
    res.status(404).json({ error: 'Case not found' });
    return null;
  }
  return data;
}

async function loadEvidenceForCase(caseId) {
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .eq('case_id', caseId)
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function loadCustody(filter) {
  let q = supabase.from('custody_log').select('*').order('id', { ascending: true });
  if (filter.evidenceId != null) q = q.eq('evidence_id', filter.evidenceId);
  else q = q.eq('case_id', filter.caseId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// Latest non-deleted version per note group (mirrors notesController.fetchCurrentNotes)
async function loadNotes(caseId, evidenceId) {
  let q = supabase.from('case_notes').select('*').eq('case_id', caseId).order('id', { ascending: true });
  if (evidenceId != null) q = q.eq('evidence_id', evidenceId);
  const { data, error } = await q;
  if (error) throw error;
  const latest = new Map();
  for (const row of data || []) latest.set(row.note_group, row);
  return [...latest.values()].filter((r) => !r.is_deleted);
}

async function loadGenerator(user) {
  let fullName = null;
  try {
    const { data } = await supabase.from('users').select('full_name').eq('id', user.id).maybeSingle();
    fullName = data && data.full_name;
  } catch (e) { /* fall back to email */ }
  return {
    id: user.id,
    name: fullName || user.email || `user ${user.id}`,
    email: user.email || '',
    role: user.role || '',
  };
}

function explorerFor(ev) {
  if (ev.explorerUrl) return ev.explorerUrl;
  if (ev.blockchain_tx_hash) {
    try { return blockchainService.getExplorerUrl(ev.blockchain_tx_hash); } catch (e) { return ''; }
  }
  return '';
}

async function loadChecklist(caseId) {
  const { data } = (await supabase
    .from('case_checklists').select('items, updated_at').eq('case_id', caseId).limit(1)) || {};
  return data && data.length ? data[0] : null;
}

function drawEvidenceBlock(w, ev) {
  const title = `#${ev.id} ${ev.title || ev.name || ev.file_name || 'Untitled'}`;
  w.text(title, { size: 11, font: 'bold', gap: 4 });
  w.kv('File', `${ev.file_name || 'n/a'} (${ev.file_type || 'unknown type'}, ${fmtSize(ev.file_size)})`);
  w.kv('SHA-256', ev.hash || 'not recorded');
  const bs = ev.blockchain_status || (ev.blockchain_tx_hash ? 'confirmed' : 'pending');
  w.kv('Blockchain', ev.blockchain_tx_hash
    ? `${bs} - tx ${ev.blockchain_tx_hash}`
    : `${bs} - no transaction recorded yet`);
  const explorer = explorerFor(ev);
  if (explorer) w.kv('Explorer', explorer, { color: GREY });
  const cid = ev.ipfs_cid || ev.ipfs_hash;
  w.kv('IPFS', cid ? String(cid) : 'not pinned');
  w.kv('Collected', `${fmtTime(ev.collection_date)}${ev.location ? ` at ${ev.location}` : ''}`);
  if (ev.description) w.kv('Description', ev.description);
  w.space(4);
}

async function buildReport({ reportType, caseRow, evidence, custody, notes, checklist, generator, generatedAt }) {
  const {payload, snapshotHash:reportHash} = exportPayload.create({reportType,generatedAt,generator,caseRow,evidence,custody,notes,checklist});

  const doc = await PDFDocument.create();
  doc.setTitle(`EVID-DGC ${reportType === 'case' ? 'Case' : 'Evidence'} Report ${caseRow && caseRow.case_number ? caseRow.case_number : ''}`.trim());
  doc.setProducer('EVID-DGC');
  doc.setCreationDate(new Date(generatedAt));
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  await doc.attach(Buffer.from(payload,'utf8'),'snapshot.json',{mimeType:'application/json',description:'Exact UTF-8 snapshot payload for the displayed SHA-256 content digest',creationDate:new Date(generatedAt),modificationDate:new Date(generatedAt)});
  const w = new ReportWriter(doc, fonts);

  // Header band
  w.page.drawRectangle({ x: 0, y: PAGE_H - 64, width: PAGE_W, height: 64, color: rgb(0.98, 0.96, 0.96) });
  w.page.drawRectangle({ x: 0, y: PAGE_H - 64, width: PAGE_W, height: 3, color: RED });
  w.page.drawText('EVID-DGC', { x: MARGIN, y: PAGE_H - 34, size: 17, font: fonts.bold, color: RED });
  w.page.drawText(reportType === 'case' ? 'Case Evidence Report' : 'Evidence Item Report', { x: MARGIN, y: PAGE_H - 52, size: 11, font: fonts.regular, color: DARK });
  w.page.drawText(`Generated: ${fmtTime(generatedAt)}`, { x: PAGE_W - MARGIN - fonts.regular.widthOfTextAtSize(`Generated: ${fmtTime(generatedAt)}`, 8), y: PAGE_H - 34, size: 8, font: fonts.regular, color: GREY });
  const hashLabel = `Snapshot: ${reportHash.slice(0, 24)}...`;
  w.page.drawText(hashLabel, { x: PAGE_W - MARGIN - fonts.regular.widthOfTextAtSize(hashLabel, 8), y: PAGE_H - 48, size: 8, font: fonts.regular, color: GREY });
  w.y = PAGE_H - 64 - 24;

  // Case information
  if (caseRow) {
    w.heading('Case information');
    w.kv('Case number', caseRow.case_number || 'n/a');
    w.kv('Title', caseRow.title || 'n/a');
    w.kv('Status', caseRow.status || 'n/a');
    w.kv('Case type', caseRow.case_type || 'n/a');
    w.kv('Jurisdiction', caseRow.jurisdiction || 'n/a');
    w.kv('Priority', caseRow.priority_level != null ? `Level ${caseRow.priority_level}` : 'n/a');
    w.kv('Opened', fmtTime(caseRow.created_date));
    if (caseRow.description) w.kv('Description', caseRow.description);
    w.space(4);
    w.rule();
  }

  // Evidence
  w.heading(`Evidence items (${evidence.length})`);
  if (evidence.length === 0) {
    w.text('No evidence items are recorded for this scope.', { color: GREY });
  } else {
    evidence.forEach((ev, i) => {
      w.ensure(120);
      drawEvidenceBlock(w, ev);
      if (i < evidence.length - 1) w.rule();
    });
  }
  w.space(2);
  w.rule();

  // Custody timeline
  w.heading(`Chain of custody (${custody.length} entries)`);
  if (custody.length === 0) {
    w.text('No custody events recorded for this scope.', { color: GREY });
  } else {
    for (const c of custody) {
      w.ensure(30);
      const who = c.actor_name ? `${c.actor_name}${c.actor_role ? ` (${c.actor_role})` : ''}` : (c.actor || 'unknown');
      w.text(`${fmtTime(c.created_at)}  -  ${safeText(c.action)}  -  ${who}`, { size: 9.5, gap: 2 });
      if (c.evidence_id != null) w.text(`evidence #${c.evidence_id}`, { size: 8, color: LIGHT, indent: 10, gap: 1 });
      if (c.entry_hash) w.text(`entry hash ${c.entry_hash.slice(0, 32)}...`, { size: 8, color: LIGHT, indent: 10, gap: 4 });
    }
  }
  w.space(2);
  w.rule();

  // Collection checklist (S9, ISO 27037 phases) - case reports only
  if (reportType === 'case') {
    if (!checklist || !Array.isArray(checklist.items) || checklist.items.length === 0) {
      w.heading('Collection checklist');
      w.text('No collection checklist recorded for this case.', { color: GREY });
    } else {
      const done = checklist.items.filter((i) => i.done).length;
      w.heading(`Collection checklist (${done}/${checklist.items.length} complete)`);
      const phases = ['identify', 'collect', 'acquire', 'preserve'];
      for (const p of phases) {
        const pi = checklist.items.filter((i) => i.phase === p);
        if (!pi.length) continue;
        w.ensure(30);
        w.text(p.toUpperCase(), { size: 10, font: 'bold', gap: 2 });
        for (const i of pi) {
          const mark = i.done ? '[x]' : '[ ]';
          const extra = i.value ? ` - ${safeText(i.value)}` : '';
          w.text(`${mark} ${safeText(i.label)}${extra}`, { size: 9.5, indent: 10, gap: 1 });
          if (i.done && i.done_by) {
            w.text(`completed by ${i.done_by}${i.done_at ? ` at ${fmtTime(i.done_at)}` : ''}`, { size: 8, color: LIGHT, indent: 22, gap: 2 });
          }
        }
        w.space(3);
      }
    }
    w.space(2);
    w.rule();
  }

  // Notes
  w.heading(`Investigator notes (${notes.length})`);
  if (notes.length === 0) {
    w.text('No notes recorded for this scope.', { color: GREY });
  } else {
    for (const n of notes) {
      w.ensure(40);
      const who = n.author_name ? `${n.author_name}${n.author_role ? ` (${n.author_role})` : ''}` : (n.author || 'unknown');
      w.text(`${fmtTime(n.created_at)}  -  ${who}${n.evidence_id ? `  -  evidence #${n.evidence_id}` : ''}`, { size: 9.5, font: 'bold', gap: 2 });
      w.text(n.content || '', { size: 9.5, indent: 10, gap: 2 });
      w.space(4);
    }
  }
  w.rule();

  // Integrity + signature
  w.heading('Snapshot digest and PDF status');
  w.text('Snapshot SHA-256', { size: 10, font: 'bold', gap: 2 });
  w.text(reportHash, { size: 9, color: GREY });
  w.space(2);
  w.text('SHA-256 of the exact UTF-8 snapshot.json attachment, including generation time. Extract that attachment and hash its bytes to reproduce this digest. It identifies the attached snapshot, not the PDF bytes or the truth of source records. Changing PDF display text is not detected by this snapshot digest.', { size: 8.5, color: GREY });
  w.space(10);

  w.text('PDF-byte integrity: not verified by this digest. Digital signature: UNSIGNED. The manual signing line below is not a cryptographic signature.', {size:8.5,color:GREY});
  w.heading('Generator and manual signing');
  w.kv('Generated by', `${generator.name}${generator.role ? ` - ${generator.role.replace(/_/g, ' ')}` : ''}`);
  w.kv('Generator ID', String(generator.id));
  w.space(16);
  w.ensure(50);
  w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: MARGIN + 200, y: w.y }, thickness: 0.7, color: DARK });
  w.page.drawText('Signature of investigator', { x: MARGIN, y: w.y - 12, size: 8.5, font: fonts.regular, color: GREY });
  w.page.drawLine({ start: { x: MARGIN + 260, y: w.y }, end: { x: MARGIN + 400, y: w.y }, thickness: 0.7, color: DARK });
  w.page.drawText('Date', { x: MARGIN + 260, y: w.y - 12, size: 8.5, font: fonts.regular, color: GREY });

  // Footers on every page
  const pages = doc.getPages();
  const caseLabel = caseRow ? `Case ${caseRow.case_number || caseRow.id}` : 'Evidence report';
  pages.forEach((p, i) => {
    const footer = `EVID-DGC ${caseLabel} - snapshot ${reportHash.slice(0, 16)}... - page ${i + 1} of ${pages.length}`;
    p.drawLine({ start: { x: MARGIN, y: 48 }, end: { x: PAGE_W - MARGIN, y: 48 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.87) });
    p.drawText(footer, { x: MARGIN, y: 36, size: 7.5, font: fonts.regular, color: LIGHT });
  });

  const pdfBytes = await doc.save();
  return { pdfBytes, reportHash };
}

function sendPdf(res, pdfBytes, reportHash, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Report-Hash', reportHash); // Compatibility: a snapshot digest, never the PDF-byte hash.
  res.setHeader('X-Snapshot-Hash', reportHash);
  res.setHeader('X-Snapshot-Schema', exportPayload.VERSION);
  res.send(Buffer.from(pdfBytes));
}

// GET /api/cases/:id/report.pdf
const getCaseReportPdf = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }
    const caseRow = await loadCaseOr404(res, cid);
    if (!caseRow) return;
    const [evidence, custody, notes, checklist, generator] = await Promise.all([
      loadEvidenceForCase(cid),
      loadCustody({ caseId: cid }),
      loadNotes(cid, null),
      loadChecklist(cid),
      loadGenerator(req.user),
    ]);
    const generatedAt = new Date().toISOString();
    const { pdfBytes, reportHash } = await buildReport({
      reportType: 'case', caseRow, evidence, custody, notes, checklist, generator, generatedAt,
    });
    await logAudit(req, {
      userId: req.user.id,
      action: 'report_generated',
      details: { report_type: 'case', case_id: cid, report_hash: reportHash },
    });
    sendPdf(res, pdfBytes, reportHash, `EVID-DGC-case-${caseRow.case_number || cid}-report.pdf`);
  } catch (e) {
    console.error('getCaseReportPdf error:', e);
    res.status(500).json({ error: 'Failed to generate case report' });
  }
};

// GET /api/evidence/:id/report.pdf
const getEvidenceReportPdf = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid evidence id' });
    const { data: ev, error } = await supabase.from('evidence').select('*').eq('id', id).single();
    if (error || !ev) return res.status(404).json({ error: 'Evidence not found' });
    if (!(await canAccessEvidence(req.user, ev))) {
      return res.status(403).json({ error: 'You do not have access to this evidence' });
    }
    let caseRow = null;
    if (ev.case_id != null) {
      const { data } = await supabase.from('cases').select('*').eq('id', ev.case_id).maybeSingle();
      caseRow = data || null;
    }
    const [custody, notes, generator] = await Promise.all([
      loadCustody({ evidenceId: id }),
      ev.case_id != null ? loadNotes(ev.case_id, id) : Promise.resolve([]),
      loadGenerator(req.user),
    ]);
    const generatedAt = new Date().toISOString();
    const { pdfBytes, reportHash } = await buildReport({
      reportType: 'evidence', caseRow, evidence: [ev], custody, notes, generator, generatedAt,
    });
    await logAudit(req, {
      userId: req.user.id,
      action: 'report_generated',
      details: { report_type: 'evidence', evidence_id: id, case_id: ev.case_id || null, report_hash: reportHash },
    });
    sendPdf(res, pdfBytes, reportHash, `EVID-DGC-evidence-${id}-report.pdf`);
  } catch (e) {
    console.error('getEvidenceReportPdf error:', e);
    res.status(500).json({ error: 'Failed to generate evidence report' });
  }
};

module.exports = { getCaseReportPdf, getEvidenceReportPdf, buildReport };
