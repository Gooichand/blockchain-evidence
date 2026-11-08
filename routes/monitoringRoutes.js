const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const cacheService = require('../utils/cacheService');
const { requireAuth } = require('../middleware/requireAuth');

// H6 fix: metrics and alerts were readable without any login. They now need a
// session, and sensitive internals (wallet balances, addresses) are stripped
// for everyone except admin/auditor.
const PRIVILEGED = ['admin', 'auditor'];

function sanitizeMetrics(metrics, role) {
  if (!metrics || PRIVILEGED.includes(role)) return metrics;
  const clean = JSON.parse(JSON.stringify(metrics));
  if (clean.blockchain) {
    delete clean.blockchain.walletBalance;
    delete clean.blockchain.walletAddress;
    delete clean.blockchain.wallet_balance;
    delete clean.blockchain.address;
  }
  delete clean.walletBalance;
  delete clean.wallet;
  return clean;
}

function sanitizeAlerts(alerts, role) {
  if (!Array.isArray(alerts) || PRIVILEGED.includes(role)) return alerts;
  return alerts.filter(
    (a) => !/balance|wallet/i.test(`${a.type || ''} ${a.message || ''}`)
  );
}

router.get('/metrics', requireAuth, async (req, res) => {
  try {
    const cacheKey = 'system_metrics_cache';
    let metrics = await cacheService.get(cacheKey);

    if (!metrics) {
      metrics = await monitoringService.getSystemMetrics();
      await cacheService.set(cacheKey, metrics, 30); // Cache for 30 seconds
    }

    res.json({ success: true, metrics: sanitizeMetrics(metrics, req.user?.role), cached: !!await cacheService.get(cacheKey) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load metrics' });
  }
});

router.get('/alerts', requireAuth, async (req, res) => {
  try {
    const cacheKey = 'system_alerts_cache';
    let alerts = await cacheService.get(cacheKey);

    if (!alerts) {
      alerts = await monitoringService.getAlerts();
      await cacheService.set(cacheKey, alerts, 60); // Cache for 60 seconds
    }

    res.json({ success: true, alerts: sanitizeAlerts(alerts, req.user?.role) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load alerts' });
  }
});

router.post('/log-metrics', requireAuth, async (req, res) => {
  try {
    if (!PRIVILEGED.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient privileges' });
    }
    const result = await monitoringService.logMetrics();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log metrics' });
  }
});

module.exports = router;
