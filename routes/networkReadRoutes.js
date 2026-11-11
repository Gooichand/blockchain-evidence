const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { requireAuth } = require('../middleware/requireAuth');
const service = require('../services/dnsRegistrationService');
const router = express.Router();
router.get(
  '/dns',
  requireAuth,
  rateLimit({ windowMs: 60000, limit: 5, standardHeaders: true, legacyHeaders: false }),
  async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      service.normalize(req.query.query);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    try {
      return res.json(await service.lookup(req.query.query));
    } catch {
      return res
        .status(503)
        .json({ error: 'Lookup unavailable. No successful result established.' });
    }
  },
);
router.get(
  '/tls',
  requireAuth,
  rateLimit({ windowMs: 60000, limit: 3, standardHeaders: true, legacyHeaders: false }),
  async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const tlsService = require('../services/publicTLSService');
    try {
      tlsService.domain(req.query.host);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    try {
      return res.json(await tlsService.inspect(req.query.host));
    } catch {
      return res.status(503).json({
        error:
          'Public TLS inspection unavailable or DNS resolved to a private/special-use address. No supported result established.',
      });
    }
  },
);
module.exports = router;
