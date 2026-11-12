const service = require('../services/ipfsReadOnlyService');
async function readCAR(req, res) {
  res.set('Cache-Control', 'no-store');
  const { gateway, cid } = req.params;
  if (!Object.hasOwn(service.GATEWAYS, gateway) || !/^b[a-z2-7]{20,120}$/.test(cid))
    return res.status(400).json({ error: 'Choose a supported gateway and valid canonical CID.' });
  try {
    const bytes = await service.readCAR(gateway, cid);
    res.set('Content-Type', 'application/vnd.ipld.car');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Disposition', 'attachment; filename="unverified-ipfs.car"');
    res.send(bytes);
  } catch {
    res.status(503).json({
      error:
        'Public gateway CAR retrieval unavailable or exceeds limits; nothing verified. Try an independently obtained CAR locally. No pinning or upload performed.',
    });
  }
}
module.exports = { readCAR };
