/**
 * EVID-DGC Public Viewer helpers.
 * Pure functions (no DOM) so they can be unit-tested under Node via Jest.
 * All dynamic text injected into the public UI MUST pass through escapeHtml.
 */
(function (globalScope) {
  const SHA256_RE = /^[0-9a-fA-F]{64}$/;
  const TX_RE = /^0x[0-9a-fA-F]{64}$/;
  const NUMERIC_RE = /^\d+$/;

  /**
   * Escape a value for safe insertion into HTML text content. Prevents XSS.
   * Returns an empty string for null/undefined inputs.
   */
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    const str = typeof value === 'string' ? value : String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Normalize an arbitrary value into a safe display string. */
  function safeText(value, fallback) {
    const str = value === null || value === undefined ? '' : String(value);
    return str.length ? str : (fallback || '');
  }

  /** Shorten a long hash/tx for display: 0x1234…abcd. */
  function truncate(value, tail) {
    const str = safeText(value);
    const count = typeof tail === 'number' && tail > 0 ? tail : 6;
    if (str.length <= count * 2 + 1) return str;
    return `${str.slice(0, count)}…${str.slice(-count)}`;
  }

  /**
   * Format an ISO timestamp to a readable date. Returns a dash when empty.
   */
  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return safeText(value);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Classify a verify-reference string.
   * Returns 'id' | 'sha256' | 'tx' | null
   */
  function classifyReference(value) {
    const str = safeText(value).trim().toLowerCase();
    if (!str) return null;
    if (NUMERIC_RE.test(str)) return 'number';
    if (TX_RE.test(str)) return 'tx';
    if (SHA256_RE.test(str)) return 'sha256';
    return null;
  }

  /**
   * Validate a Verify modal input. Returns { ok, kind, normalized }.
   */
  function validateVerifyInput(value) {
    const raw = safeText(value).trim();
    if (!raw) {
      return { ok: false, kind: null, normalized: '', message: 'Enter an Evidence ID, SHA-256 hash, or transaction hash.' };
    }
    const kind = classifyReference(raw);
    if (!kind) {
      return {
        ok: false,
        kind: null,
        normalized: '',
        message: 'That does not look like an Evidence ID (number), SHA-256 hash (64 hex chars), or transaction hash (0x…64 hex).',
      };
    }
    return { ok: true, kind, normalized: raw };
  }

  /** Sanitize a case number into a public reference, e.g. PUB-2026-0042. */
  function toPublicReference(caseNumber, id) {
    if (caseNumber) {
      return String(caseNumber).replace(/^CASE-/i, 'PUB-').replace(/^PUB-/, 'PUB-');
    }
    return `PUB-${id}`;
  }

  const api = {
    escapeHtml,
    safeText,
    truncate,
    shortenHash: truncate,
    formatDate,
    classifyReference,
    validateVerifyInput,
    toPublicReference,
  };

  global.EVIDPublic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : global);