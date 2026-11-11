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
module.exports = router;
