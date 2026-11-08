/**
 * M5: scheduled integrity re-verification.
 *
 * A hash only has value if it is checked again. Every night (02:17 UTC, off
 * the hour) every evidence row with a stored hash and an IPFS CID is
 * re-downloaded, its SHA-256 recomputed, and compared with the intake hash.
 * A mismatch produces:
 *   - an integrity_alerts row (deduped while unacknowledged),
 *   - a custody ledger entry (integrity_mismatch),
 *   - notifications to the submitter and to admin / evidence_manager users.
 * Admins and evidence managers can also trigger a full scan on demand;
 * scoped roles can scan their own accessible evidence.
 */

const cron = require('node-cron');
const crypto = require('crypto');
const { supabase } = require('../config');
const ipfsStorageService = require('./storage/ipfsStorageService');
const { isScopedRole, stableUserId, getAccessibleCaseIds } = require('../middleware/caseAccess');

const PAGE = 200;
let running = false;

async function fetchEvidencePage(offset, idFilter) {
  let query = supabase
    .from('evidence')
    .select('id, case_id, hash, ipfs_cid, ipfs_hash, title, name, submitted_by')
    .not('hash', 'is', null)
    .order('id', { ascending: true })
    .range(offset, offset + PAGE - 1);
  if (idFilter && idFilter.length) query = query.in('id', idFilter);
  const { data, error } = (await query) || {};
  if (error) throw error;
  return data || [];
}

async function notifyUsers(wallets, title, message, data) {
  const unique = [...new Set((wallets || []).filter(Boolean))];
  if (!unique.length) return;
  const rows = unique.map((w) => ({
    user_wallet: w,
    title,
    message,
    type: 'integrity_alert',
    data: data || {},
    is_read: false,
  }));
  try {
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) throw error;
  } catch (e) {
    console.error('integrity alert notification insert failed:', e.message);
  }
}

async function adminWallets() {
  try {
    const { data } = (await supabase
      .from('users')
      .select('wallet_address, id')
      .in('role', ['admin', 'evidence_manager'])
      .eq('is_active', true)) || {};
    return (data || []).map((u) => u.wallet_address || `user_${u.id}`);
  } catch (e) {
    return [];
  }
}

/**
 * Re-verify evidence integrity. Returns { checked, mismatches, errors }.
 * opts.user (optional): when the caller is a scoped role, only their
 * accessible evidence is checked.
 */
async function runIntegrityScan(opts = {}) {
  const startedAt = new Date().toISOString();
  let idFilter = null;
  if (opts.user && isScopedRole(opts.user.role)) {
    const sid = stableUserId(opts.user);
    const caseIds = (await getAccessibleCaseIds(opts.user)) || [];
    const ors = [`submitted_by.eq.${sid}`];
    if (caseIds.length) ors.push(`case_id.in.(${caseIds.map(String).join(',')})`);
    const { data: mine, error: scopeError } = await supabase.from('evidence').select('id').or(ors.join(','));
    if (scopeError) throw scopeError;
    idFilter = (mine || []).map((r) => r.id);
    if (!idFilter.length) return { checked: 0, mismatches: 0, errors: 0, startedAt };
  }

  let offset = 0;
  let checked = 0;
  let mismatchCount = 0;
  let errorCount = 0;

  for (;;) {
    const rows = await fetchEvidencePage(offset, idFilter);
    if (!rows.length) break;
    offset += rows.length;

    for (const ev of rows) {
      checked++;
      let actual = null;
      try {
        const cid = ev.ipfs_cid || ev.ipfs_hash;
        if (!cid) throw new Error('No retrievable IPFS copy; item could not be verified');
        const buf = await ipfsStorageService.getFile(cid);
        actual = crypto.createHash('sha256').update(buf).digest('hex');
      } catch (e) {
        errorCount++;
        console.error(`integrity scan: fetch failed for evidence #${ev.id}:`, e.message);
        continue;
      }
      if (actual === String(ev.hash).toLowerCase()) continue;

      mismatchCount++;
      console.error(`INTEGRITY MISMATCH evidence #${ev.id}: expected=${ev.hash} actual=${actual}`);

      let createdAlert = false;
      // Dedupe: one open alert per evidence item at a time
      try {
        const { data: open, error: openError } = (await supabase
          .from('integrity_alerts')
          .select('id')
          .eq('evidence_id', ev.id)
          .eq('acknowledged', false)
          .limit(1)) || {};
        if (openError) throw openError;
        if (!open || !open.length) {
          const { error: insertError } = await supabase.from('integrity_alerts').insert({
            evidence_id: ev.id,
            case_id: parseInt(ev.case_id, 10) || null,
            expected_hash: ev.hash,
            actual_hash: actual,
            check_source: opts.source || 'nightly_scan',
          });
          if (insertError) throw insertError;
          createdAlert = true;
        }
      } catch (e) {
        console.error('integrity_alerts insert failed:', e.message);
      }

      try {
        const { logCustody } = require('../controllers/custodyController');
        await logCustody({
          evidenceId: ev.id,
          caseId: parseInt(ev.case_id, 10) || null,
          action: 'integrity_mismatch',
          user: opts.user || null,
          details: { expected_hash: ev.hash, actual_hash: actual, source: opts.source || 'nightly_scan' },
          req: opts.req || null,
        });
      } catch (e) {
        console.error('custody log for mismatch failed:', e.message);
      }

      if (!createdAlert) continue;
      const label = ev.title || ev.name || `Evidence #${ev.id}`;
      const admins = await adminWallets();
      await notifyUsers(
        [ev.submitted_by, ...admins],
        'Evidence integrity mismatch detected',
        `Re-verification of "${label}" (evidence #${ev.id}) found the stored file no longer matches its recorded SHA-256. Treat this item as suspect and review the custody log.`,
        { evidence_id: ev.id, expected_hash: ev.hash, actual_hash: actual },
      );
    }

    if (rows.length < PAGE) break;
  }

  console.log(`integrity scan complete: checked=${checked} mismatches=${mismatchCount} fetchErrors=${errorCount}`);
  return { checked, mismatches: mismatchCount, errors: errorCount, startedAt };
}

async function guardedScan(opts) {
  if (running) throw new Error('An integrity scan is already running');
  running = true;
  try { return await runIntegrityScan(opts); } finally { running = false; }
}

function startIntegrityScheduler() {
  // Nightly at 02:17 UTC - off the top of the hour to spread load.
  cron.schedule('17 2 * * *', async () => {
    try {
      await guardedScan({ source: 'nightly_scan' });
    } catch (e) {
      console.error('nightly integrity scan failed:', e);
    }
  });
  console.log('Integrity scheduler started (nightly 02:17 UTC)');
}

module.exports = { runIntegrityScan: guardedScan, startIntegrityScheduler };
