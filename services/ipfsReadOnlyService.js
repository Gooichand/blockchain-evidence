const axios = require('axios');
// Fixed gateway operators only: no arbitrary URLs, redirects, credentials or uploads.
// `path` gateways take the CID in the request path; `subdomain` gateways take it as a
// DNS label, so those CIDs must fit one label (<=63 base32 characters).
const GATEWAYS = Object.freeze({
  trustless: Object.freeze({
    mode: 'path',
    origin: 'https://trustless-gateway.link/ipfs/',
    label: 'trustless-gateway.link',
  }),
  everland: Object.freeze({
    mode: 'subdomain',
    origin: 'https://ipfs.4everland.io/',
    label: '4everland.io',
  }),
});
function gatewayURL(gateway, cid) {
  const g = GATEWAYS[gateway];
  if (g.mode === 'subdomain') {
    if (cid.length > 63) throw Error('CID too long for a subdomain gateway label.');
    return 'https://' + cid + '.ipfs.4everland.io/?format=car&dag-scope=all';
  }
  return g.origin + cid + '?format=car&dag-scope=all';
}
async function readCAR(gateway, cid) {
  if (!Object.hasOwn(GATEWAYS, gateway) || !/^b[a-z2-7]{20,120}$/.test(cid))
    throw Error('Invalid gateway or canonical CID.');
  const response = await axios.get(gatewayURL(gateway, cid), {
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
module.exports = { readCAR, GATEWAYS, gatewayURL };
