const { supabase } = require('../config');

/**
 * Central audit writer. Every security-relevant event — logins, failures,
 * permission denials, data changes — lands in activity_logs with the actor,
 * timestamp, client IP and result (success | failure | denied).
 *
 * Audit logging must never break the request it observes: all errors are
 * caught and logged to the server console only.
 */

function clientIp(req) {
  if (!req || !req.headers) return null;
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || null;
}

async function logAudit(req, { userId = null, action, result = 'success', details = null }) {
  try {
    if (!action) return;
    const { error } = (await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      result,
      ip_address: clientIp(req),
      details: details === null ? null : (typeof details === 'string' ? details : JSON.stringify(details)),
      timestamp: new Date().toISOString(),
    })) || {};
    if (error) console.error('Audit log insert failed:', error);
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = { logAudit, clientIp };
