const axios = require('axios');

/**
 * Detects which public-portal columns exist on the live cases/evidence tables.
 * Supabase does not expose information_schema through the JS client, so we read
 * the PostgREST OpenAPI schema (GET /rest/v1/) once and cache the result.
 *
 * This lets the public API work both before and after the
 * migrations/add-public-portal-columns.sql migration is applied:
 *  - publication_status / published_date / public_summary on cases
 *  - is_public / published_date on evidence
 */
let cache = null;
let cacheExpiresAt = 0;
let inflight = null;

async function fetchSchema() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
  }

  const res = await axios.get(`${url}/rest/v1/`, {
    headers: { apikey: key },
    timeout: 8000,
  });

  const definitions = (res.data && res.data.definitions) || {};
  const caseProps = (definitions.cases && definitions.cases.properties) || {};
  const evidenceProps = (definitions.evidence && definitions.evidence.properties) || {};

  return {
    casesPublicationStatus: Object.prototype.hasOwnProperty.call(caseProps, 'publication_status'),
    casesPublishedDate: Object.prototype.hasOwnProperty.call(caseProps, 'published_date'),
    casesPublicSummary: Object.prototype.hasOwnProperty.call(caseProps, 'public_summary'),
    casesPublicTitle: Object.prototype.hasOwnProperty.call(caseProps, 'public_title'),
    evidenceIsPublic: Object.prototype.hasOwnProperty.call(evidenceProps, 'is_public'),
    evidencePublishedDate: Object.prototype.hasOwnProperty.call(evidenceProps, 'published_date'),
  };
}

async function getSchema() {
  if (cache && Date.now() < cacheExpiresAt) {
    return cache;
  }

  if (inflight) {
    const started = Date.now();
    while (inflight && Date.now() - started < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (cache) return cache;
  }

  inflight = true;
  try {
    cache = await fetchSchema();
    cacheExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minute cache
    return cache;
  } catch (error) {
    // Never crash the API on a schema probe failure — fall back to the pre-migration layout.
    cache = {
      casesPublicationStatus: false,
      casesPublishedDate: false,
      casesPublicSummary: false,
      casesPublicTitle: false,
      evidenceIsPublic: true,
      evidencePublishedDate: false,
    };
    cacheExpiresAt = Date.now() + 5 * 60 * 1000;
    console.error('publicSchema probe failed, using fallback:', error.message);
    return cache;
  } finally {
    inflight = false;
  }
}

module.exports = { getSchema };
