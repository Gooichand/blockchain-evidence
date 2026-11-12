/* Chronological display of imported claims, not event verification. */
(function (root) {
  'use strict';
  const guides = {
    'evidence-timeline': [
      'Evidence Source Timeline',
      'Builds a chronology from a JSON event array, actual PCAP/PCAPNG packet timestamps, or embedded DOCX revision/core-property timestamps. Select a supported file and run. Exact source bytes are hashed; event references and original times are retained. Capture and document clocks/author claims are not verified. Missing, invalid or timezone-free embedded dates are reported, never guessed. PDF/EXIF/media extraction and true collection history are unsupported.',
    ],
    'invest-timeline': [
      'Cross-Source Investigation Timeline',
      'Combines investigation events from up to 10 local JSON files, fingerprints exact source bytes and sorts explicit-offset times. Optional extra source files are merged with the Evidence Vault JSON. Correlation candidates require an exact nonempty evidenceId match across different source files within the chosen time window. This is an explicit deterministic rule, not proof of causality, identity, accurate clocks or true events. Input event arrays need timestamp, type and description; event claims remain unverified.',
    ],
    'custody-timeline': [
      'Imported Custody Timeline',
      'Sorts imported JSON events of type custody. Entries remain unverified claims; actor can describe a claimed handoff. It does not verify identities, signatures, uninterrupted custody or on-chain records, and missing transfers cannot be detected.',
    ],
  };
  const types = {
    'evidence-timeline': 'evidence',
    'invest-timeline': 'investigation',
    'custody-timeline': 'custody',
  };
  function timestamp(s) {
    if (
      typeof s !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(s)
    )
      throw Error('Timestamp requires ISO date/time with seconds and explicit Z or ±hh:mm offset.');
    const [Y, M, D, h, m, sec] = s
      .match(/^\d{4}|\d{2}/g)
      .slice(0, 6)
      .map(Number);
    if (
      M < 1 ||
      M > 12 ||
      D < 1 ||
      D >
        [
          31,
          Y % 4 === 0 && (Y % 100 !== 0 || Y % 400 === 0) ? 29 : 28,
          31,
          30,
          31,
          30,
          31,
          31,
          30,
          31,
          30,
          31,
        ][M - 1] ||
      h > 23 ||
      m > 59 ||
      sec > 59
    )
      throw Error('Invalid calendar timestamp.');
    if (!s.endsWith('Z')) {
      const off = s.slice(-5).split(':').map(Number);
      if (off[0] > 14 || off[1] > 59 || (off[0] === 14 && off[1] !== 0))
        throw Error('Invalid UTC offset.');
    }
    const t = Date.parse(s);
    if (!Number.isFinite(t)) throw Error('Invalid timestamp.');
    return t;
  }
  function normalize(id, input) {
    if (!types[id]) throw Error('Unknown timeline type.');
    const raw = JSON.parse(input);
    if (!Array.isArray(raw) || raw.length > 5000)
      throw Error('Provide an array of at most 5000 events.');
    const events = raw
      .map((r, i) => {
        if (
          !r ||
          typeof r !== 'object' ||
          !['evidence', 'investigation', 'custody'].includes(r.type) ||
          typeof r.description !== 'string' ||
          r.description.length > 2000 ||
          !r.description.trim()
        )
          throw Error(
            'Event ' + (i + 1) + ' needs a valid type and description (1-2000 characters).',
          );
        for (const key of ['actor', 'evidenceId'])
          if (r[key] !== undefined && (typeof r[key] !== 'string' || r[key].length > 2000))
            throw Error('Invalid ' + key + ' in event ' + (i + 1));
        const epoch = timestamp(r.timestamp);
        return {
          sourceIndex: i + 1,
          timestamp: r.timestamp,
          utc: new Date(epoch).toISOString(),
          epoch,
          type: r.type,
          description: r.description,
          actor: r.actor || '',
          evidenceId: r.evidenceId || '',
        };
      })
      .filter((e) => e.type === types[id])
      .sort((a, b) => a.epoch - b.epoch || a.sourceIndex - b.sourceIndex);
    return {
      importedCount: raw.length,
      displayedCount: events.length,
      events: events.map(({ epoch: _epoch, ...e }) => e),
      limit:
        'Imported claims only. Equal timestamps retain source order, not proven event sequence. No missing events or custody gaps are inferred.',
    };
  }
  function correlate(events, windowSeconds = 300) {
    if (!Number.isFinite(windowSeconds) || windowSeconds < 0 || windowSeconds > 86400)
      throw Error('Correlation window must be0-86400seconds.');
    const groups = new Map(),
      candidates = [];
    for (const event of events) {
      if (!event.evidenceId) continue;
      if (!groups.has(event.evidenceId)) groups.set(event.evidenceId, []);
      const group = groups.get(event.evidenceId);
      if (group.length >= 250) throw Error('Correlation limit:250events per evidenceId.');
      group.push(event);
    }
    for (const [evidenceId, group] of groups) {
      group.sort((a, b) => timestamp(a.timestamp) - timestamp(b.timestamp));
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++) {
          const seconds = (timestamp(group[j].timestamp) - timestamp(group[i].timestamp)) / 1000;
          if (seconds > windowSeconds) break;
          if (group[i].sourceId === group[j].sourceId) continue;
          if (candidates.length >= 1000)
            throw Error('Correlation candidate limit:1000. Reduce source size/window.');
          candidates.push({
            evidenceId,
            first: { sourceId: group[i].sourceId, row: group[i].sourceIndex },
            second: { sourceId: group[j].sourceId, row: group[j].sourceIndex },
            secondsApart: seconds,
            rule: 'Exact evidenceId across sources within time window; unverified candidate',
          });
        }
    }
    return candidates;
  }
  async function deriveEvidence(file) {
    if (file.size > 5 * 1024 * 1024) throw Error('Derived timeline limit:5MiB.');
    const bytes = await file.arrayBuffer(),
      hash = await root.crypto.subtle.digest('SHA-256', bytes);
    const sha256 = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join(
      '',
    );
    const raw = [],
      skipped = [];
    const add = (date, description, actor, reference) => {
      try {
        timestamp(date);
      } catch {
        skipped.push({ reference, reason: 'Missing/invalid/offset-free source timestamp.' });
        return;
      }
      if (raw.length >= 5000) throw Error('Derived timeline limit:5000events.');
      raw.push({
        timestamp: date,
        type: 'evidence',
        description,
        actor: actor || '',
        evidenceId: sha256,
        sourceReference: reference,
      });
    };
    if (/\.pcap(?:ng)?$/i.test(file.name)) {
      if (!root.NetworkForensics) throw Error('Offline capture parser unavailable.');
      const parsed = root.NetworkForensics.capture(new Uint8Array(bytes));
      for (const p of parsed.packets) {
        if (!Number.isFinite(p.timestampSeconds)) {
          skipped.push({ reference: 'packet ' + p.index, reason: 'No usable packet timestamp.' });
          continue;
        }
        const time = new Date(p.timestampSeconds * 1000);
        if (!Number.isFinite(time.getTime())) {
          skipped.push({
            reference: 'packet ' + p.index,
            reason: 'Timestamp outside supported Date range.',
          });
          continue;
        }
        add(
          time.toISOString(),
          'Captured packet ' + p.index + ' (' + p.capturedLength + ' bytes)',
          '',
          'packet ' + p.index + '; raw seconds ' + p.timestampSeconds,
        );
      }
    } else if (/\.docx$/i.test(file.name)) {
      if (!root.DocumentForensics) throw Error('Office parser unavailable.');
      const parsed = await root.DocumentForensics.analyze('doc-metadata', file);
      for (const [index, event] of parsed.embeddedRevisionEvents.entries())
        add(
          event.date,
          'Embedded ' + event.kind + ': ' + event.text,
          event.author,
          'DOCX embedded revision ' + (index + 1) + ' id ' + event.id,
        );
      for (const property of parsed.properties['docProps/core.xml'] || [])
        if (['created', 'modified', 'lastPrinted'].includes(property.field))
          add(
            property.value,
            'Embedded document ' + property.field,
            '',
            'docProps/core.xml ' + property.field,
          );
    } else
      throw Error('Derived evidence timeline supports DOCX/PCAP/PCAPNG or a JSON event array.');
    const result = normalize('evidence-timeline', JSON.stringify(raw));
    result.events = result.events.map((e) => ({
      ...e,
      sourceId: 'source-1',
      sourceReference: raw[e.sourceIndex - 1].sourceReference,
    }));
    return {
      ...result,
      sources: [{ sourceId: 'source-1', filename: file.name, sha256, bytes: file.size }],
      skippedSourceTimes: skipped,
      limit:
        'Derived from actual source fields, not verified events or collection history. Embedded authors/dates and capture clocks can be forged. Packet times are displayed at millisecond precision; raw seconds retained in references. No missing events are inferred.',
    };
  }
  async function analyze(id, file, additional = [], windowSeconds = 300) {
    if (!file) throw Error('Select a JSON file or use Try example.');
    if (id === 'evidence-timeline' && !/\.json$/i.test(file.name)) return deriveEvidence(file);
    if (id !== 'invest-timeline') {
      if (file.size > 5 * 1024 * 1024) throw Error('Timeline limit:5MiB.');
      return normalize(id, await file.text());
    }
    const files = [file, ...additional];
    if (files.length > 10 || files.reduce((a, f) => a + f.size, 0) > 5 * 1024 * 1024)
      throw Error('Source limit:10files /5MiB total.');
    const sources = [],
      events = [];
    let importedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i],
        bytes = await f.arrayBuffer(),
        sourceId = 'source-' + (i + 1);
      const digest = await root.crypto.subtle.digest('SHA-256', bytes);
      const parsed = normalize(id, new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      importedCount += parsed.importedCount;
      if (importedCount > 5000) throw Error('Timeline combined limit:5000events.');
      sources.push({
        sourceId,
        filename: f.name,
        bytes: f.size,
        sha256: Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(''),
        importedCount: parsed.importedCount,
      });
      events.push(...parsed.events.map((e) => ({ ...e, sourceId })));
    }
    events.sort(
      (a, b) =>
        timestamp(a.timestamp) - timestamp(b.timestamp) ||
        a.sourceId.localeCompare(b.sourceId) ||
        a.sourceIndex - b.sourceIndex,
    );
    return {
      importedCount,
      displayedCount: events.length,
      sources,
      events,
      windowSeconds,
      correlationCandidates: correlate(events, windowSeconds),
      limit:
        'Unverified source claims. Source hashes identify imported bytes, not authorship. Candidates use exact evidenceId and time proximity across files only, not causality. Clock skew and missing records are not corrected; equal times do not prove sequence.',
    };
  }
  function ready() {
    return true;
  }
  function n(tag, text, attrs = {}) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    return x;
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id];
    ws.appendChild(n('h2', title));
    ws.appendChild(
      n('p', guide, {
        style:
          'padding:16px;background:#f8fafc;line-height:1.6;border:1px solid #ddd;border-radius:10px;',
      }),
    );
    ws.appendChild(
      n(
        'p',
        'Local only. JSON event arrays' +
          (tool.id === 'evidence-timeline' ? ' or DOCX/PCAP/PCAPNG' : '') +
          ', 5 MiB / 5000 events. Times normalized to UTC; original offsets retained. No timezone guesses.',
      ),
    );
    let additional = [];
    const windowInput = n('input', undefined, {
      type: 'number',
      min: '0',
      max: '86400',
      value: '300',
      'aria-label': 'Correlation window seconds',
    });
    if (tool.id === 'invest-timeline') {
      const extra = n('input', undefined, {
        type: 'file',
        multiple: '',
        accept: '.json',
        'aria-label': 'Additional investigation sources',
      });
      extra.onchange = () => {
        additional = Array.from(extra.files);
      };
      ws.append(
        n('label', 'Additional JSON sources (up to9): '),
        extra,
        n('label', 'Correlation window seconds: '),
        windowInput,
      );
    }
    const run = n('button', 'Build imported timeline', {
        type: 'button',
        class: 'fl-btn fl-btn-primary',
      }),
      demo = n('button', '▶ Try example', {
        type: 'button',
        class: 'fl-btn fl-btn-ghost',
        'aria-label': 'Try timeline example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.append(run, demo, out);
    async function execute(d) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Sorting locally...'));
      try {
        let f = getFile();
        if (d) {
          const r = await fetch('/samples/timeline/events.json');
          if (!r.ok) throw Error('Example missing.');
          f = new File([await r.text()], 'Demo.json');
        }
        const result = await analyze(
          tool.id,
          f,
          d ? [] : additional,
          d ? 300 : Number(windowInput.value),
        );
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (d)
          out.appendChild(
            n('strong', 'DEMO SAMPLE - original synthetic events. Your evidence is unchanged.'),
          );
        out.appendChild(n('p', result.limit));
        if (result.correlationCandidates) {
          out.appendChild(
            n('h3', 'Cross-source candidates: ' + result.correlationCandidates.length),
          );
          out.appendChild(
            n(
              'p',
              'Exact evidence ID and time-window rule only. Candidates are not verified relationships. Showing first20; full list in JSON.',
            ),
          );
          const list = n('ul');
          for (const c of result.correlationCandidates.slice(0, 20))
            list.appendChild(
              n(
                'li',
                c.evidenceId +
                  ': ' +
                  c.first.sourceId +
                  ' row' +
                  c.first.row +
                  ' / ' +
                  c.second.sourceId +
                  ' row' +
                  c.second.row +
                  '; ' +
                  c.secondsApart +
                  ' seconds apart.',
              ),
            );
          out.appendChild(list);
        }

        const scroll = n('div', undefined, { style: 'overflow-x:auto;' }),
          table = n('table', undefined, {
            style: 'width:100%;border-collapse:collapse;text-align:left;',
          }),
          head = n('tr');
        for (const h of [
          'UTC',
          'Original timestamp',
          'Claimed event',
          'Claimed actor',
          'Evidence ID',
          'Source',
        ])
          head.appendChild(n('th', h, { style: 'padding:10px;border-bottom:2px solid #ddd;' }));
        table.appendChild(head);
        for (const event of result.events) {
          const tr = n('tr');
          for (const key of ['utc', 'timestamp', 'description', 'actor', 'evidenceId', 'sourceId'])
            tr.appendChild(
              n(
                'td',
                key === 'evidenceId' && /^[a-f0-9]{64}$/.test(event[key])
                  ? event[key].slice(0, 12) + '...'
                  : event[key] || '',
                {
                  title: event[key] || '',
                  style:
                    'padding:10px;border-bottom:1px solid #ddd;vertical-align:top;' +
                    (['utc', 'timestamp'].includes(key)
                      ? 'white-space:nowrap;'
                      : 'overflow-wrap:anywhere;'),
                },
              ),
            );
          table.appendChild(tr);
        }
        scroll.appendChild(table);
        out.appendChild(scroll);
        out.appendChild(
          n('pre', JSON.stringify(result, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:400px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (ws.contains(out))
          out.replaceChildren(n('p', e.message || 'Timeline failed.', { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = { mount, analyze, normalize, timestamp, correlate, deriveEvidence, ready, guides };
  root.TimelineTools = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
