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

// POST diagnostic: ?probe=post additionally sends a tiny multipart POST to a
// neutral echo host with undici fetch, to isolate egress POST issues. Never
// sends credentials anywhere; the Pinata call above remains a GET.
const getIpfsHealth = async (req, res) => {
  const result = { pinataGet: null, neutralPost: null };
  const started = Date.now();

  result.pinataGet = await new Promise((resolve) => {
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
        resolve({
          reachable: true,
          status: upstream.statusCode,
          authenticated: upstream.statusCode === 200,
        });
      },
    );
    request.on('timeout', () => request.destroy(new Error('timeout')));
    request.on('error', (err) => resolve({ reachable: false, error: err.message }));
    request.end();
  });

  if (req.query.probe === 'post') {
    try {
      const fd = new FormData();
      fd.append('file', new Blob([Buffer.from('egress-probe')]), 'probe.txt');
      const r = await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: fd,
        signal: AbortSignal.timeout(15000),
      });
      result.neutralPost = { ok: r.ok, status: r.status };
    } catch (err) {
      result.neutralPost = { ok: false, error: err.message };
    }
  }

  result.latencyMs = Date.now() - started;
  res.json(result);
};

module.exports = { getHealth, getIpfsHealth };
