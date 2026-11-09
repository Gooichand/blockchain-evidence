const { supabase } = require('../config');
const { stableUserId, canAccessCase } = require('../middleware/caseAccess');

/**
 * Guided collection checklist (roadmap S9).
 *
 * One checklist per case following the ISO 27037 phases (identify, collect,
 * acquire, preserve). The template is fixed so every case follows the same
 * defensible procedure; each item carries a done flag plus an optional free
 * text value (e.g. the seal number or the witness name), who completed it and
 * when. Stored in case_checklists and printed in the case PDF report.
 */

const TEMPLATE = [
  { key: 'scene_photographed', phase: 'identify', label: 'Scene photographed before touching anything' },
  { key: 'devices_identified', phase: 'identify', label: 'Devices identified and documented (make, model, serial)' },
  { key: 'device_state', phase: 'identify', label: 'Device state recorded', valueLabel: 'State (e.g. powered on, locked screen)' },
  { key: 'witness', phase: 'identify', label: 'Witness present', valueLabel: 'Witness name and role' },
  { key: 'device_labelled', phase: 'collect', label: 'Device labelled and logged at the scene' },
  { key: 'photos_taken', phase: 'collect', label: 'Photos taken of device, screen and connections' },
  { key: 'peripherals', phase: 'collect', label: 'Cables and peripherals collected with the device' },
  { key: 'write_blocker', phase: 'acquire', label: 'Write blocker used for acquisition', valueLabel: 'Write blocker model / serial' },
  { key: 'acquisition_method', phase: 'acquire', label: 'Acquisition tool and method recorded', valueLabel: 'Tool and method (e.g. FTK Imager, logical)' },
  { key: 'acquisition_hash', phase: 'acquire', label: 'Hash computed at acquisition time', valueLabel: 'SHA-256 at acquisition' },
  { key: 'packaging', phase: 'preserve', label: 'Anti-static, tamper-evident packaging used' },
  { key: 'seal_number', phase: 'preserve', label: 'Evidence seal applied', valueLabel: 'Seal number' },
  { key: 'storage_location', phase: 'preserve', label: 'Stored in the evidence locker', valueLabel: 'Locker / location' },
];

const PHASES = ['identify', 'collect', 'acquire', 'preserve'];

function freshItems() {
  return TEMPLATE.map((t) => ({
    key: t.key,
    phase: t.phase,
    label: t.label,
    valueLabel: t.valueLabel || null,
    done: false,
    value: '',
    done_by: null,
    done_at: null,
  }));
}

function summarize(items) {
  const done = items.filter((i) => i.done).length;
  const perPhase = {};
  PHASES.forEach((p) => {
    const pi = items.filter((i) => i.phase === p);
    perPhase[p] = { total: pi.length, done: pi.filter((i) => i.done).length };
  });
  return { total: items.length, done, complete: done === items.length, phases: perPhase };
}

// GET /api/cases/:id/checklist - returns the checklist, creating the default
// from the template on first access.
const getChecklist = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }

    let { data: row, error } = (await supabase
      .from('case_checklists').select('*').eq('case_id', cid).limit(1)) || {};
    if (error) throw error;

    if (!row || row.length === 0) {
      const { error: insErr } = await supabase.from('case_checklists').insert({
        case_id: cid, items: freshItems(), created_by: stableUserId(req.user),
      });
      // A concurrent first access may have inserted first; re-read either way.
      if (insErr && insErr.code !== '23505') throw insErr;
      ({ data: row, error } = (await supabase
        .from('case_checklists').select('*').eq('case_id', cid).limit(1)) || {});
      if (error) throw error;
    }

    const items = Array.isArray(row[0].items) ? row[0].items : [];
    res.json({ success: true, case_id: cid, items, summary: summarize(items), updated_at: row[0].updated_at });
  } catch (e) {
    console.error('getChecklist error:', e);
    res.status(500).json({ error: 'Failed to load the collection checklist' });
  }
};

// PUT /api/cases/:id/checklist/items/:key { done?, value? }
const updateChecklistItem = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }
    const key = req.params.key;
    if (!TEMPLATE.some((t) => t.key === key)) {
      return res.status(400).json({ error: 'Unknown checklist item' });
    }

    const { data: rows, error } = (await supabase
      .from('case_checklists').select('items').eq('case_id', cid).limit(1)) || {};
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not created yet - load it first' });
    }

    const items = rows[0].items.map((i) => {
      if (i.key !== key) return i;
      const next = { ...i };
      if (typeof req.body?.done === 'boolean') {
        next.done = req.body.done;
        next.done_by = req.body.done ? stableUserId(req.user) : null;
        next.done_at = req.body.done ? new Date().toISOString() : null;
      }
      if (typeof req.body?.value === 'string') next.value = req.body.value.slice(0, 500);
      return next;
    });

    const { error: updErr } = await supabase
      .from('case_checklists')
      .update({ items, updated_at: new Date().toISOString() })
      .eq('case_id', cid);
    if (updErr) throw updErr;

    res.json({ success: true, items, summary: summarize(items) });
  } catch (e) {
    console.error('updateChecklistItem error:', e);
    res.status(500).json({ error: 'Failed to update the checklist' });
  }
};

module.exports = { getChecklist, updateChecklistItem, TEMPLATE, PHASES };
