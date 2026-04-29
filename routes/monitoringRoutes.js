const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const cacheService = require('../utils/cacheService');

router.get('/metrics', async (req, res) => {
  try {
    const cacheKey = 'system_metrics_cache';
    let metrics = await cacheService.get(cacheKey);
    
    if (!metrics) {
      metrics = await monitoringService.getSystemMetrics();
      await cacheService.set(cacheKey, metrics, 30); // Cache for 30 seconds
    }
    
    res.json({ success: true, metrics, cached: !!await cacheService.get(cacheKey) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const cacheKey = 'system_alerts_cache';
    let alerts = await cacheService.get(cacheKey);
    
    if (!alerts) {
      alerts = await monitoringService.getAlerts();
      await cacheService.set(cacheKey, alerts, 60); // Cache for 60 seconds
    }
    
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/log-metrics', async (req, res) => {
  try {
    const result = await monitoringService.logMetrics();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
