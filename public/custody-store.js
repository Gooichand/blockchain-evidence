/* Custody record storage. Every screen talks ONLY to this interface, so a
   future shared adapter (Supabase table or contract events) can replace the
   local one without any screen changing.

   LocalCustodyStore keeps records in this browser's localStorage. Records are
   LOCAL-ONLY claims: not shared with anyone, not signed, not blockchain
   anchored. Nothing here establishes real custody, identity or provenance. */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'dgc-local-custody-v1';
  const MAX_RECORDS = 500;
  const MAX_EVIDENCE_IDS = 64;
  const LIMIT =
    'Local records only - kept in this browser, not shared, not signed, not on the blockchain. ' +
    'They are unverified claims and cannot prove real custody, identity or provenance.';

  function clean(value, max, name) {
    value = String(value == null ? '' : value).trim();
    if (!value) throw Error(name + ' is required.');
    if (value.length > max) throw Error(name + ' must be at most ' + max + ' characters.');
    if (/[\x00-\x1f]/.test(value)) throw Error(name + ' contains control characters.');
    return value;
  }

  function validateHandover(input) {
    if (!input || typeof input !== 'object') throw Error('Handover record is required.');
    const evidenceId = clean(input.evidenceId, 64, 'Evidence ID');
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(evidenceId))
      throw Error('Evidence ID may use letters, digits, dot, underscore, colon and dash only.');
    const from = clean(input.from, 120, 'From');
    const to = clean(input.to, 120, 'To');
    const purpose = clean(input.purpose, 200, 'Purpose');
    const notes = input.notes ? clean(input.notes, 500, 'Notes') : '';
    let at = input.at ? new Date(input.at) : new Date();
    if (isNaN(at.getTime())) throw Error('Handover date/time is not valid.');
    return {
      evidenceId,
      from,
      to,
      purpose,
      notes,
      at: at.toISOString(),
    };
  }

  /* persistence backends */
  function browserBackend() {
    return {
      read() {
        try {
          const raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch (_) {
          return [];
        }
      },
      write(records) {
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      },
    };
  }
  function memoryBackend() {
    let records = [];
    return {
      read: () => records.slice(),
      write: (r) => {
        records = r.slice();
      },
    };
  }

  function createLocalStore(backend) {
    backend = backend || (root.localStorage ? browserBackend() : memoryBackend());
    let counter = 0;

    function load() {
      const rows = backend.read();
      if (!Array.isArray(rows)) return [];
      return rows.filter(
        (r) =>
          r &&
          typeof r.id === 'string' &&
          typeof r.evidenceId === 'string' &&
          typeof r.at === 'string',
      );
    }
    function save(records) {
      backend.write(records);
    }

    return {
      kind: 'local-browser',
      limit: LIMIT,
      async recordHandover(input) {
        const h = validateHandover(input);
        const records = load();
        if (records.length >= MAX_RECORDS)
          throw Error('Local custody record limit reached (' + MAX_RECORDS + ').');
        if (!records.some((r) => r.evidenceId === h.evidenceId)) {
          const ids = new Set(records.map((r) => r.evidenceId));
          if (ids.size >= MAX_EVIDENCE_IDS)
            throw Error('Local evidence ID limit reached (' + MAX_EVIDENCE_IDS + ').');
        }
        const record = Object.assign(
          {
            id: 'local-' + Date.now().toString(36) + '-' + (++counter).toString(36),
            sample: !!input.sample,
          },
          h,
        );
        records.push(record);
        save(records);
        return record;
      },
      async listHandovers(evidenceId) {
        evidenceId = String(evidenceId || '').trim();
        return load()
          .filter((r) => r.evidenceId === evidenceId)
          .sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));
      },
      async listEvidenceIds() {
        return [...new Set(load().map((r) => r.evidenceId))].sort();
      },
      async removeHandover(id) {
        const records = load();
        const next = records.filter((r) => r.id !== id);
        if (next.length === records.length) throw Error('No local record with that ID.');
        save(next);
      },
      async exportAll() {
        return { version: 1, kind: 'local-browser-custody', limit: LIMIT, records: load() };
      },
      async importAll(payload) {
        let data = payload;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (_) {
            throw Error('Import file is not valid JSON.');
          }
        }
        if (!data || !Array.isArray(data.records))
          throw Error('Import file has no custody records.');
        const existing = load();
        const seen = new Set(existing.map((r) => r.id));
        let added = 0;
        for (const raw of data.records) {
          const h = validateHandover(raw);
          const id = typeof raw.id === 'string' && /^[A-Za-z0-9._:-]{1,80}$/.test(raw.id)
            ? raw.id
            : 'imported-' + existing.length + '-' + added;
          if (seen.has(id)) continue; /* duplicates are skipped, never doubled */
          if (existing.length >= MAX_RECORDS)
            throw Error('Local custody record limit reached (' + MAX_RECORDS + ').');
          seen.add(id);
          existing.push(Object.assign({ id, sample: !!raw.sample }, h));
          added++;
        }
        save(existing);
        return { added, skipped: data.records.length - added };
      },
    };
  }

  /* A clearly-labelled sample store for demos: separate memory, SAMPLE-marked
     records, never mixed into the user's own records. */
  function createDemoStore() {
    const store = createLocalStore(memoryBackend());
    return Promise.all([
      store.recordHandover({
        evidenceId: 'SAMPLE-EV-001',
        from: 'Officer A (sample)',
        to: 'Forensic Lab (sample)',
        purpose: 'Seizure hand-in',
        at: '2026-01-10T09:30:00.000Z',
        notes: 'Sample record - not real evidence.',
        sample: true,
      }),
      store.recordHandover({
        evidenceId: 'SAMPLE-EV-001',
        from: 'Forensic Lab (sample)',
        to: 'Analyst B (sample)',
        purpose: 'Analysis',
        at: '2026-01-12T14:00:00.000Z',
        notes: 'Sample record - not real evidence.',
        sample: true,
      }),
      store.recordHandover({
        evidenceId: 'SAMPLE-EV-001',
        from: 'Analyst B (sample)',
        to: 'Evidence Locker (sample)',
        purpose: 'Return to storage',
        at: '2026-01-15T11:15:00.000Z',
        notes: 'Sample record - not real evidence.',
        sample: true,
      }),
    ]).then(() => store);
  }

  const api = { createLocalStore, createDemoStore, validateHandover, LIMIT, STORAGE_KEY };
  root.CustodyStore = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
