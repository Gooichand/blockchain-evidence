// S4: global search across cases, evidence, notes, tags and hashes.
// FTS runs on the stored tsvector columns from migration
// 2026-11-09-s4-global-search.sql; SHA-256 (or a hex prefix) takes a
// dedicated exact/prefix path because hashes are not natural language.
const { supabase } = require('../config');
const { getAuthUser } = require('../middleware/identity');
const { getAccessibleCaseIds } = require('../middleware/caseAccess');

const HEX_RE = /^[a-f0-9]{12,64}$/i;
const ILIKE_UNSAFE = /[%_]/g;

const globalSearch = async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot search' });
    }

    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, data: { query: '', cases: [], evidence: [], notes: [] } });
    }
    if (q.length > 200) {
      return res.status(400).json({ success: false, error: 'Search query is too long (200 characters max)' });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 25);

    // null = wide role (all cases); an array scopes every query below
    const accessible = await getAccessibleCaseIds(user);
    const scoped = Array.isArray(accessible);
    if (scoped && accessible.length === 0) {
      return res.json({ success: true, data: { query: q, cases: [], evidence: [], notes: [] } });
    }

    // Hash fast path: 12+ hex chars find a file instantly by exact/prefix hash
    if (HEX_RE.test(q)) {
      let hq = supabase
        .from('evidence')
        .select('id, case_id, title, exhibit_id, file_name, type, hash, timestamp')
        .ilike('hash', q.toLowerCase() + '%')
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (scoped) hq = hq.in('case_id', accessible.map(String));
      const { data, error } = await hq;
      if (error) throw error;
      return res.json({ success: true, data: { query: q, mode: 'hash', cases: [], evidence: data || [], notes: [] } });
    }

    const ftsOpts = { config: 'english', type: 'plain' };

    let casesQ = supabase
      .from('cases')
      .select('id, title, description, case_number, status, case_type, jurisdiction, created_date')
      .textSearch('search_tsv', q, ftsOpts)
      .order('created_date', { ascending: false })
      .limit(limit);
    if (scoped) casesQ = casesQ.in('id', accessible);

    let evQ = supabase
      .from('evidence')
      .select('id, case_id, title, exhibit_id, file_name, type, hash, timestamp')
      .textSearch('search_tsv', q, ftsOpts)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (scoped) evQ = evQ.in('case_id', accessible.map(String));

    let notesQ = supabase
      .from('case_notes')
      .select('id, case_id, content, author_name, evidence_id, created_at')
      .textSearch('search_tsv', q, ftsOpts)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (scoped) notesQ = notesQ.in('case_id', accessible);

    // Tag-name matches surface their evidence too (tags live outside the tsv)
    const tagQ = supabase
      .from('tags')
      .select('id, name, color')
      .ilike('name', `%${q.replace(ILIKE_UNSAFE, '')}%`)
      .limit(10);

    const [casesR, evR, notesR, tagR] = await Promise.all([casesQ, evQ, notesQ, tagQ]);
    if (casesR.error) throw casesR.error;
    if (evR.error) throw evR.error;
    if (notesR.error) throw notesR.error;
    if (tagR.error) throw tagR.error;

    const evidence = [...(evR.data || [])];
    const seen = new Set(evidence.map((e) => e.id));

    if ((tagR.data || []).length > 0) {
      const tagIds = tagR.data.map((t) => t.id);
      const { data: links } = (await supabase
        .from('evidence_tags')
        .select('evidence_id')
        .in('tag_id', tagIds)
        .limit(200)) || {};
      const extraIds = [...new Set((links || []).map((l) => l.evidence_id))].filter((id) => !seen.has(id));
      if (extraIds.length > 0) {
        let extraQ = supabase
          .from('evidence')
          .select('id, case_id, title, exhibit_id, file_name, type, hash, timestamp')
          .in('id', extraIds.slice(0, limit));
        if (scoped) extraQ = extraQ.in('case_id', accessible.map(String));
        const { data: extra } = await extraQ;
        for (const e of extra || []) {
          e.matched_via = 'tag';
          evidence.push(e);
        }
      }
    }

    res.json({
      success: true,
      data: {
        query: q,
        cases: casesR.data || [],
        evidence,
        notes: notesR.data || [],
        matched_tags: tagR.data || [],
      },
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};

module.exports = { globalSearch };
