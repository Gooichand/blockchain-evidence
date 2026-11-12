const crypto = require('crypto');
const VERSION = 'evid-dgc.snapshot.v1';
const pick = (row, keys) => Object.fromEntries(keys.map((key) => [key, row[key] ?? null]));
// Fixed allowlists. Never attach raw database rows or account/session fields.
function object({
  reportType,
  generatedAt,
  generator,
  caseRow,
  evidence = [],
  custody = [],
  notes = [],
  checklist,
}) {
  return {
    schema: VERSION,
    digest: {
      algorithm: 'SHA-256',
      encoding: 'UTF-8',
      serialization: 'JSON.stringify, fixed field order, no whitespace or Unicode normalization',
    },
    report_type: reportType,
    generated_at: generatedAt,
    generated_by: pick(generator, ['id', 'name', 'role']),
    case: caseRow
      ? pick(caseRow, [
          'id',
          'case_number',
          'title',
          'status',
          'case_type',
          'jurisdiction',
          'priority_level',
          'created_date',
          'description',
        ])
      : null,
    evidence: evidence.map((e) =>
      pick(e, [
        'id',
        'title',
        'name',
        'file_name',
        'file_type',
        'file_size',
        'hash',
        'blockchain_status',
        'blockchain_tx_hash',
        'explorerUrl',
        'ipfs_cid',
        'ipfs_hash',
        'collection_date',
        'location',
        'description',
      ]),
    ),
    custody: custody.map((c) =>
      pick(c, [
        'id',
        'evidence_id',
        'action',
        'actor',
        'actor_name',
        'actor_role',
        'created_at',
        'entry_hash',
      ]),
    ),
    notes: notes.map((n) =>
      pick(n, [
        'id',
        'note_group',
        'version',
        'author',
        'author_name',
        'author_role',
        'created_at',
        'evidence_id',
        'content',
      ]),
    ),
    checklist:
      checklist && Array.isArray(checklist.items)
        ? checklist.items.map((i) =>
            pick(i, ['key', 'phase', 'label', 'done', 'value', 'done_by', 'done_at']),
          )
        : null,
    meaning:
      'Snapshot content digest only. Does not authenticate sources, verify PDF bytes or constitute a digital signature.',
  };
}
function create(input) {
  const payload = JSON.stringify(object(input));
  return {
    payload,
    snapshotHash: crypto.createHash('sha256').update(payload, 'utf8').digest('hex'),
    version: VERSION,
  };
}
module.exports = { VERSION, object, create };
