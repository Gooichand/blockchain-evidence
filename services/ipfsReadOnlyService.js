const axios = require('axios');
const GATEWAYS = Object.freeze({ trustless: 'https://trustless-gateway.link/ipfs/' });
// Fixed origins and CID-only paths: no arbitrary URLs, redirects, credentials or uploads.
async function readCAR(gateway, cid) {
  if (!Object.hasOwn(GATEWAYS, gateway) || !/^b[a-z2-7]{20,120}$/.test(cid))
    throw Error('Invalid gateway or canonical CID.');
  const response = await axios.get(GATEWAYS[gateway] + cid + '?format=car&dag-scope=all', {
    responseType: 'arraybuffer',
    timeout: 15000,
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
    maxRedirects: 0,
    headers: {
      Accept: 'application/vnd.ipld.car',
      'User-Agent': 'DGC-read-only-IPFS-inspector/1.0',
    },
  });
  if (
    response.status !== 200 ||
    !String(response.headers['content-type'] || '').includes('application/vnd.ipld.car')
  )
    throw Error('Gateway did not return CAR content.');
  return Buffer.from(response.data);
}
module.exports = { readCAR, GATEWAYS };
