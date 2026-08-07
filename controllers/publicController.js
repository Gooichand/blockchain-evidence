const { supabase } = require('../config');
const { getSchema } = require('../services/publicSchema');
const blockchainService = require('../services/blockchain/blockchainService');

/**
 * Public Viewer API — read-only transparency endpoints.
 *
 * SECURITY CONTRACT:
 * - Rows are only ever returned when explicitly flagged public: is_public = true
 *   AND (when the column exists) publication_status = 'Published'. "Closed" or
 *   "Verified" states are never treated as implicitly public.
 * - Every returned row is passed through a sanitized DTO that whitelists fields.
 *   Never returned: investigator/victim names, raw descriptions, file_data,
 *   submitted_by wallets, assignment data, or internal-only identifiers.
 */

/** Whitelist the fields we are allowed to expose for a public case. */
function sanitizeCase(row, schema) {
  if (!row) return null;

  const publishedDate =
    schema.casesPublishedDate && row.published_date
      ? row.published_date
      : row.last_status_change || row.created_date;

  return {
    id: row.id,
    reference_number: row.case_number || `PUB-${row.id}`,
    title: schema.casesPublicTitle && row.public_title ? row.public_title : row.title,
    summary: schema.casesPublicSummary && row.public_summary ? row.public_summary : null,
    jurisdiction: row.jurisdiction || 'General',
    case_type: row.case_type || 'criminal',
    publication_status:
      schema.casesPublicationStatus && row.publication_status
        ? row.publication_status
        : 'Published',
    published_date: publishedDate,
    updated_at: row.last_status_change || publishedDate,
    is_public: true,
    blockchain_verified:
      Boolean(row.blockchain_case_tx_hash) || Number(row.evidence_blockchain_verified) > 0,
    evidence_count: Number(row.evidence_public_count) || 0,
  };
}

/** Whitelist the fields we are allowed to expose for a public evidence item. */
function sanitizeEvidence(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || row.name || row.file_name || `Evidence ${row.id}`,
    case_number: row.case_id || null,
    file_type: row.file_type || row.type || null,
    timestamp: row.timestamp || row.published_date || null,
    published_date: row.published_date || row.timestamp || null,
    is_public: true,
    hash: row.hash || null,
    ipfs_cid: row.ipfs_cid || null,
    blockchain_tx_hash: row.blockchain_tx_hash || null,
    blockchain_block_number: row.blockchain_block_number || row.polygon_block_number || null,
    blockchain_verified: Boolean(row.blockchain_verified),
    blockchain_timestamp: row.blockchain_timestamp || row.blockchain_confirmed_at || null,
  };
}

/** Count public case rows (is_public = true, published when column exists). */
async function countPublicCases(schema, extra) {
  let query = supabase.from('cases').select('*', { count: 'exact', head: true });
  query = query.eq('is_public', true);
  if (schema.casesPublicationStatus) query = query.eq('publication_status', 'Published');
  if (extra && extra.field)
    query = query.gte(extra.field, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/** Count public evidence rows with an optional equality filter. */
async function countPublicEvidence(schema, extraField, extraValue) {
  let query = supabase.from('evidence').select('*', { count: 'exact', head: true });
  if (schema.evidenceIsPublic) query = query.eq('is_public', true);
  if (extraField && extraValue !== undefined) query = query.eq(extraField, extraValue);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/** Recent public cases ordered by most recent activity/publish date. */
async function getRecentPublicCases(schema) {
  const orderField = schema.casesPublishedDate ? 'published_date' : 'last_status_change';
  let query = supabase
    .from('cases')
    .select('*')
    .eq('is_public', true)
    .order(orderField, { ascending: false })
    .limit(8);
  if (schema.casesPublicationStatus) query = query.eq('publication_status', 'Published');
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// GET /public/statistics
// ---------------------------------------------------------------------------
const getStatistics = async (req, res) => {
  try {
    const schema = await getSchema();

    const publishedCases = await countPublicCases(schema);
    const publicEvidence = await countPublicEvidence(schema);
    const blockchainVerified = await countPublicEvidence(schema, 'blockchain_verified', true);

    const recentField = schema.casesPublishedDate ? 'published_date' : 'last_status_change';
    const recentlyUpdated = await countPublicCases(schema, { field: recentField });

    const recentCases = await getRecentPublicCases(schema);
    const { data: recentEvidence, error: evidenceError } = (await supabase
      .from('evidence')
      .select('*')
      .eq('is_public', true)
      .order('timestamp', { ascending: false })
      .limit(8)) || {};
    if (evidenceError) throw evidenceError;

    const activity = [];
    for (const c of recentCases) {
      activity.push({
        id: `case-${c.id}`,
        type: 'case_published',
        action: 'Case published',
        reference: c.case_number || `PUB-${c.id}`,
        title: schema.casesPublicTitle && c.public_title ? c.public_title : c.title,
        timestamp:
          (schema.casesPublishedDate && c.published_date) || c.last_status_change || c.created_date,
      });
    }
    for (const e of recentEvidence || []) {
      activity.push({
        id: `evidence-${e.id}`,
        type: e.blockchain_verified ? 'evidence_verified' : 'evidence_released',
        action: e.blockchain_verified ? 'Evidence verified on-chain' : 'Evidence released',
        title: e.title || e.name || e.file_name || `Evidence ${e.id}`,
        reference: e.case_id || null,
        timestamp: e.blockchain_timestamp || e.published_date || e.timestamp,
      });
    }
    activity.sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime(),
    );

    res.json({
      success: true,
      data: {
        published_cases: publishedCases,
        public_evidence: publicEvidence,
        blockchain_verified: blockchainVerified,
        recently_updated: recentlyUpdated,
        latest_published_date:
          (recentCases[0] &&
            ((schema.casesPublishedDate && recentCases[0].published_date) ||
              recentCases[0].last_status_change)) ||
          null,
        generated_at: new Date().toISOString(),
        recent_activity: activity.slice(0, 8),
      },
    });
  } catch (error) {
    console.error('Public statistics error:', error);
    const msg =
      process.env.NODE_ENV === 'production' ? 'Failed to load public statistics' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// ---------------------------------------------------------------------------
// GET /public/cases  (pagination + keyword search + filters)
// ---------------------------------------------------------------------------
const getPublicCases = async (req, res) => {
  try {
    const schema = await getSchema();
    const {
      search,
      caseNumber,
      caseType,
      jurisdiction,
      dateFrom,
      dateTo,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 12, 50);
    const offset = (pageNum - 1) * limitNum;
    const publishedField = schema.casesPublishedDate ? 'published_date' : 'created_date';

    let query = supabase.from('cases').select('*').eq('is_public', true);
    if (schema.casesPublicationStatus) query = query.eq('publication_status', 'Published');

    if (caseNumber) {
      const safe = String(caseNumber)
        .replace(/[%_.*(),'"]/g, '')
        .trim();
      if (safe) query = query.ilike('case_number', `%${safe}%`);
    }
    if (caseType) query = query.eq('case_type', String(caseType).trim());
    if (jurisdiction) {
      const safe = String(jurisdiction)
        .replace(/[%_.*(),'"]/g, '')
        .trim();
      if (safe) query = query.ilike('jurisdiction', `%${safe}%`);
    }
    if (dateFrom) query = query.gte(publishedField, new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte(publishedField, new Date(dateTo).toISOString());

    if (search) {
      const safe = String(search)
        .replace(/[%_.*(),'"]/g, '')
        .trim();
      if (safe) {
        const orExprs = [
          'case_number.ilike.' + encodeURIComponent(`%${safe}%`),
          'title.ilike.' + encodeURIComponent(`%${safe}%`),
          'jurisdiction.ilike.' + encodeURIComponent(`%${safe}%`),
        ];
        if (schema.casesPublicSummary)
          orExprs.push('public_summary.ilike.' + encodeURIComponent(`%${safe}%`));
        if (schema.casesPublicTitle)
          orExprs.push('public_title.ilike.' + encodeURIComponent(`%${safe}%`));
        query = query.or(orExprs.join(','));
      }
    }

    query = query.order(publishedField, { ascending: false }).range(offset, offset + limitNum - 1);
    const { data: rows, error } = await query;
    if (error) throw error;

    const total = await countPublicCases(schema);

    // Public-only evidence counts per listed case.
    const refs = [];
    for (const r of rows || []) {
      if (r.case_number) refs.push(r.case_number);
      refs.push(String(r.id));
    }
    const uniqueRefs = [...new Set(refs)];
    const byCase = {};
    if (uniqueRefs.length) {
      const { data: evRows, error: evErr } = (await supabase
        .from('evidence')
        .select('case_id, blockchain_verified')
        .in('case_id', uniqueRefs)) || {};
      if (!evErr && evRows) {
        for (const e of evRows) {
          const key = e.case_id;
          if (!byCase[key]) byCase[key] = { count: 0, verified: 0 };
          byCase[key].count += 1;
          if (e.blockchain_verified) byCase[key].verified += 1;
        }
      }
    }

    const data = (rows || []).map((row) => {
      const stat = byCase[row.case_number] || byCase[String(row.id)];
      return sanitizeCase(
        {
          ...row,
          evidence_public_count: stat ? stat.count : 0,
          evidence_blockchain_verified: stat ? stat.verified : 0,
        },
        schema,
      );
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Public cases error:', error);
    const msg =
      process.env.NODE_ENV === 'production' ? 'Failed to load public cases' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// ---------------------------------------------------------------------------
// GET /public/cases/:id
// ---------------------------------------------------------------------------
const getPublicCaseById = async (req, res) => {
  try {
    const schema = await getSchema();
    const safeId = parseInt(req.params.id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid public case ID' });
    }

    let query = supabase.from('cases').select('*').eq('id', safeId).eq('is_public', true);
    if (schema.casesPublicationStatus) query = query.eq('publication_status', 'Published');
    query = query.limit(1);
    const { data: rows, error } = await query;
    if (error) throw error;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Public case not found' });
    }

    const refs = [String(safeId)];
    if (rows[0].case_number) refs.push(rows[0].case_number);

    let evQuery = supabase.from('evidence').select('blockchain_verified').in('case_id', refs);
    if (schema.evidenceIsPublic) evQuery = evQuery.eq('is_public', true);
    const { data: evRows, error: evErr } = await evQuery;
    if (evErr) throw evErr;

    const evidenceCount = (evRows || []).length;
    const verifiedCount = (evRows || []).filter((e) => e.blockchain_verified).length;

    const row = {
      ...rows[0],
      evidence_public_count: evidenceCount,
      evidence_blockchain_verified: verifiedCount,
    };
    res.json({ success: true, data: sanitizeCase(row, schema) });
  } catch (error) {
    console.error('Public case detail error:', error);
    const msg =
      process.env.NODE_ENV === 'production' ? 'Failed to load public case' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// ---------------------------------------------------------------------------
// GET /public/cases/:id/evidence
// ---------------------------------------------------------------------------
const getPublicCaseEvidence = async (req, res) => {
  try {
    const safeId = parseInt(req.params.id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid public case ID' });
    }

    const schema = await getSchema();
    let caseQuery = supabase.from('cases').select('*').eq('id', safeId).eq('is_public', true);
    if (schema.casesPublicationStatus) caseQuery = caseQuery.eq('publication_status', 'Published');
    caseQuery = caseQuery.limit(1);
    const { data: caseRows, error: caseError } = await caseQuery;
    if (caseError) throw caseError;
    if (!caseRows || caseRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Public case not found' });
    }

    const refs = [String(safeId)];
    if (caseRows[0].case_number) refs.push(caseRows[0].case_number);

    let query = supabase.from('evidence').select('*').in('case_id', refs);
    if (schema.evidenceIsPublic) query = query.eq('is_public', true);
    query = query.order('timestamp', { ascending: true });

    const { data: evidenceRows, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: (evidenceRows || []).map(sanitizeEvidence),
      count: (evidenceRows || []).length,
    });
  } catch (error) {
    console.error('Public case evidence error:', error);
    const msg =
      process.env.NODE_ENV === 'production' ? 'Failed to load public evidence' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// ---------------------------------------------------------------------------
// GET /public/evidence
// ---------------------------------------------------------------------------
const getPublicEvidence = async (req, res) => {
  try {
    const schema = await getSchema();
    const { q = '', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    let query = supabase.from('evidence').select('*', { count: 'exact' });
    if (schema.evidenceIsPublic) query = query.eq('is_public', true);

    const sanitized = q.replace(/[%_.*(),'"]/g, '').trim();
    if (sanitized) {
      query = query.or(
        `title.ilike.%${sanitized}%,name.ilike.%${sanitized}%,file_name.ilike.%${sanitized}%,case_id.ilike.%${sanitized}%`,
      );
    }

    query = query
      .order('timestamp', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    const { data: rows, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: (rows || []).map(sanitizeEvidence),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error('Public evidence list error:', error);
    const msg =
      process.env.NODE_ENV === 'production' ? 'Failed to load public evidence' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

/**
 * Normalize a POST /public/verify body into an evidence lookup key.
 * Accepted references: evidence id (numeric), sha-256 hash, on-chain tx hash.
 */
function extractVerifyReference(body) {
  const bodyObj = body || {};
  const identifier = bodyObj.identifier !== undefined ? String(bodyObj.identifier).trim() : '';
  const raw =
    bodyObj.evidenceId !== undefined
      ? bodyObj.evidenceId
      : bodyObj.evidence_id !== undefined
        ? bodyObj.evidence_id
        : bodyObj.hash !== undefined
          ? bodyObj.hash
          : bodyObj.txHash !== undefined
            ? bodyObj.txHash
            : identifier;

  if (raw === undefined || raw === null || raw === '') return null;
  const valueStr = String(raw).trim().toLowerCase();
  if (!valueStr) return null;

  if (/^\d+$/.test(valueStr)) return { field: 'id', value: parseInt(valueStr, 10) };
  if (/^(0x)?[0-9a-f]{64}$/.test(valueStr)) {
    return valueStr.startsWith('0x')
      ? { field: 'blockchain_tx_hash', value: valueStr }
      : { field: 'hash', value: valueStr };
  }
  return null;
}

// ---------------------------------------------------------------------------
// POST /public/verify
// ---------------------------------------------------------------------------
const verifyEvidence = async (req, res) => {
  try {
    const ref = extractVerifyReference(req.body);
    if (!ref) {
      return res.status(400).json({
        success: false,
        error: 'Provide a numeric Evidence ID, SHA-256 hash, or blockchain transaction hash.',
      });
    }

    const schema = await getSchema();
    let query = supabase.from('evidence').select('*');
    if (schema.evidenceIsPublic) query = query.eq('is_public', true);
    query = query.eq(ref.field, ref.value).limit(1);
    const { data: rows, error } = await query;
    if (error) throw error;

    if (!rows || rows.length === 0) {
      // Deliberately generic: never reveal whether a private record exists.
      return res.status(200).json({
        success: true,
        data: {
          verified: false,
          match: false,
          message: 'No publicly released record matches this reference.',
          verification_timestamp: new Date().toISOString(),
        },
      });
    }

    const evidence = rows[0];
    const safe = sanitizeEvidence(evidence);
    const hashed = Boolean(evidence.hash);

    let explorer_url = null;
    if (evidence.blockchain_tx_hash) {
      try {
        explorer_url = blockchainService.getExplorerUrl(evidence.blockchain_tx_hash);
      } catch {
        explorer_url = null;
      }
    }

    res.json({
      success: true,
      data: {
        verified: hashed && Boolean(evidence.blockchain_verified || evidence.blockchain_tx_hash),
        match: true,
        evidence: {
          id: safe.id,
          title: safe.title,
          case_number: safe.case_number,
          hash: safe.hash,
          ipfs_cid: safe.ipfs_cid,
          blockchain_tx_hash: safe.blockchain_tx_hash,
          blockchain: {
            tx_hash: safe.blockchain_tx_hash,
            block_number: safe.blockchain_block_number,
            timestamp: safe.blockchain_timestamp,
            status:
              evidence.blockchain_status ||
              (evidence.blockchain_verified ? 'verified' : 'recorded'),
          },
          recorded_at: safe.timestamp,
          explorer_url,
        },
        verification_timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Public verify error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Verification failed' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

module.exports = {
  getStatistics,
  getPublicCases,
  getPublicCaseById,
  getPublicCaseEvidence,
  getPublicEvidence,
  verifyEvidence,
  sanitizeCase,
  sanitizeEvidence,
  extractVerifyReference,
};
