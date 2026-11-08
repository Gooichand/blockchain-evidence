const { PORT } = require('../config');
const https = require('https');

const getHealth = (req, res) => {
  console.log('🏥 Health check endpoint called');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });
};

// Read-only reachability probe for the Pinata pinning API. Reports HTTP status
// and latency, never the JWT. Used to diagnose egress issues from the host.
const getIpfsHealth = (req, res) => {
  const started = Date.now();
  const request = https.request(
    {
      method: 'GET',
      host: 'api.pinata.cloud',
      path: '/data/testAuthentication',
      family: 4,
      timeout: 15000,
      headers: process.env.PINATA_JWT
        ? { Authorization: `Bearer ${process.env.PINATA_JWT}` }
        : {},
    },
    (upstream) => {
      upstream.resume();
      res.json({
        reachable: true,
        status: upstream.statusCode,
        authenticated: upstream.statusCode === 200,
        latencyMs: Date.now() - started,
      });
    },
  );
  request.on('timeout', () => {
    request.destroy(new Error('timeout'));
  });
  request.on('error', (err) => {
    res.json({
      reachable: false,
      error: err.message,
      latencyMs: Date.now() - started,
    });
  });
  request.end();
};

module.exports = { getHealth, getIpfsHealth };
