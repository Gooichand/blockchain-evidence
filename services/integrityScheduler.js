/**
 * M5: scheduled integrity re-verification.
 *
 * A hash only has value if it is checked again. Every night (02:17 UTC, off
 * the hour) every evidence row with a stored hash is re-downloaded from IPFS,
 * its SHA-256 recomputed, and compared with the intake hash. Rows with no
 * retrievable copy are counted as errors, never silently skipped.
 * A mismatch produces:
 *   - an integrity_alerts row (deduped while unacknowledged),
 *   - a custody ledger entry (integrity_mismatch),
 *   - notifications to the submitter and to admin / evidence_manager users.
 * Admins and evidence managers can also trigger a full scan on demand;
 * scoped roles can scan their own accessible evidence.
 *
 * Reliability: every run is recorded in integrity_scan_runs (start, counts,
 * finish). On boot, runs left 'running' by a restart are marked failed, and
 * if no scan finished in the last 26 hours a catch-up scan runs shortly
 * after startup - so a Render sleep or deploy cannot silently skip a night.
 */

const cron = require('node-cron');
const crypto = require('crypto');
const { supabase } = require('../config');
const ipfsStorageService = require('./storage/ipfsStorageService');
const { isScopedRole, stableUserId, getAccessibleCaseIds } = require('../middleware/caseAccess');

const PAGE = 200;
const CATCHUP_MAX_AGE_MS = 26 * 60 * 60 * 1000; // tolerate slight schedule drift
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
  if (!unique.length) return 0;
  const rows = unique.map((w) => ({
    user_wallet: w,
    title,
    message,
    type: 'integrity_alert',
    data: data || {},
    is_read: false,
  }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) throw error;
  return unique.length;
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

// ── Durable run history ────────────────────────────────────────────────────

async function recordRunStart(source) {
  try {
    const { data, error } = (await supabase
      .from('integrity_scan_runs')
      .insert({ source, status: 'running' })
      .select('id')
      .single()) || {};
    if (error) throw error;
    return data ? data.id : null;
  } catch (e) {
    console.error('integrity_scan_runs start insert failed:', e.message);
    return null; // never block the scan itself on bookkeeping
  }
}

async function recordRunEnd(runId, fields) {
  if (!runId) return;
  try {
    const { error } = await supabase
      .from('integrity_scan_runs')
      .update({ ...fields, finished_at: new Date().toISOString() })
      .eq('id', runId);
    if (error) throw error;
  } catch (e) {
    console.error('integrity_scan_runs finish update failed:', e.message);
  }
}

/** Latest finished scan plus whether one is running now. */
async function getLatestScanStatus() {
  const { data, error } = (await supabase
    .from('integrity_scan_runs')
    .select('id, source, status, checked, mismatches, errors, started_at, finished_at')
    .neq('status', 'running')
    .order('finished_at', { ascending: false })
    .limit(1)) || {};
  if (error) throw error;
  return { running, lastRun: (data && data[0]) || null };
}

/** Runs left 'running' by a crash/restart are marked failed at boot. */
async function markInterruptedRuns() {
  try {
    const { error } = await supabase
      .from('integrity_scan_runs')
      .update({
        status: 'failed',
        detail: 'interrupted by server restart',
        finished_at: new Date().toISOString(),
      })
      .eq('status', 'running');
    if (error) throw error;
  } catch (e) {
    console.error('marking interrupted scan runs failed:', e.message);
  }
}

async function lastFinishedAt() {
  const { data, error } = (await supabase
    .from('integrity_scan_runs')
    .select('finished_at')
    .eq('status', 'completed')
    .order('finished_at', { ascending: false })
    .limit(1)) || {};
  if (error) throw error;
  return data && data[0] ? new Date(data[0].finished_at).getTime() : 0;
}

// ── The scan ───────────────────────────────────────────────────────────────

/**
 * Re-verify evidence integrity. Returns { checked, mismatches, errors }.
 * opts.user (optional): when the caller is a scoped role, only their
 * accessible evidence is checked.
 */
async function runIntegrityScan(opts = {}) {
  const source = opts.source || 'manual_scan';
  const runId = await recordRunStart(source);
  const startedAt = new Date().toISOString();
  let checked = 0;
  let mismatchCount = 0;
  let errorCount = 0;

  try {
    let idFilter = null;
    if (opts.user && isScopedRole(opts.user.role)) {
      const sid = stableUserId(opts.user);
      const caseIds = (await getAccessibleCaseIds(opts.user)) || [];
      const ors = [`submitted_by.eq.${sid}`];
      if (caseIds.length) ors.push(`case_id.in.(${caseIds.map(String).join(',')})`);
      const { data: mine, error: scopeError } = await supabase.from('evidence').select('id').or(ors.join(','));
      if (scopeError) throw scopeError;
      idFilter = (mine || []).map((r) => r.id);
      if (!idFilter.length) {
        await recordRunEnd(runId, { status: 'completed', checked: 0, mismatches: 0, errors: 0 });
        return { checked: 0, mismatches: 0, errors: 0, startedAt };
      }
    }

    let offset = 0;
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
              check_source: source,
            });
            if (insertError) throw insertError;
            createdAlert = true;
          }
        } catch (e) {
          errorCount++;
          console.error('integrity_alerts insert failed:', e.message);
        }

        try {
          const { logCustody } = require('../controllers/custodyController');
          await logCustody({
            evidenceId: ev.id,
            caseId: parseInt(ev.case_id, 10) || null,
            action: 'integrity_mismatch',
            user: opts.user || null,
            details: { expected_hash: ev.hash, actual_hash: actual, source },
            req: opts.req || null,
          });
        } catch (e) {
          errorCount++;
          console.error('custody log for mismatch failed:', e.message);
        }

        if (!createdAlert) continue; // notifications dedupe with the open alert
        try {
          const label = ev.title || ev.name || `Evidence #${ev.id}`;
          const admins = await adminWallets();
          await notifyUsers(
            [ev.submitted_by, ...admins],
            'Evidence integrity mismatch detected',
            `Re-verification of "${label}" (evidence #${ev.id}) found the stored file no longer matches its recorded SHA-256. Treat this item as suspect and review the custody log.`,
            { evidence_id: ev.id, expected_hash: ev.hash, actual_hash: actual },
          );
        } catch (e) {
          errorCount++;
          console.error('integrity alert notification failed:', e.message);
        }
      }

      if (rows.length < PAGE) break;
    }

    console.log(`integrity scan complete: checked=${checked} mismatches=${mismatchCount} errors=${errorCount}`);
    await recordRunEnd(runId, { status: 'completed', checked, mismatches: mismatchCount, errors: errorCount });
    return { checked, mismatches: mismatchCount, errors: errorCount, startedAt };
  } catch (e) {
    await recordRunEnd(runId, {
      status: 'failed',
      checked,
      mismatches: mismatchCount,
      errors: errorCount,
      detail: String(e && e.message || e).slice(0, 500),
    });
    throw e;
  }
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
  }, { timezone: 'UTC' });

  // Crash/restart recovery: close out interrupted runs, then catch up if the
  // last completed scan is too old (e.g. the service was asleep at 02:17).
  (async () => {
    try {
      await markInterruptedRuns();
      const age = Date.now() - (await lastFinishedAt());
      if (age > CATCHUP_MAX_AGE_MS) {
        console.log('integrity scan: no completed run in 26h, scheduling startup catch-up');
        setTimeout(() => {
          guardedScan({ source: 'startup_catchup' }).catch((e) =>
            console.error('startup catch-up integrity scan failed:', e));
        }, 60000).unref(); // let the service finish booting first
      }
    } catch (e) {
      console.error('integrity scheduler startup check failed:', e.message);
    }
  })();

  console.log('Integrity scheduler started (nightly 02:17 UTC + startup catch-up)');
}

module.exports = { runIntegrityScan: guardedScan, startIntegrityScheduler, getLatestScanStatus };
