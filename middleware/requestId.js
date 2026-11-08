const crypto = require('crypto');

// M14: attach a unique request id to every request so errors and audit trails
// can be correlated. Honours an inbound X-Request-Id, otherwise mints one, and
// always echoes it back in the response header.
function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128
    ? incoming
    : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = requestId;
