jest.mock('axios', () => ({ get: jest.fn() }));
const axios = require('axios'),
  service = require('../services/ipfsReadOnlyService');
const cid = 'bafybeiadxhz57sw4pfraext5gsryatwqjuyuvcpfui2vvdeiutxpc2ss64';
beforeEach(() => jest.resetAllMocks());
test('fixed-origin CAR retrieval forbids redirects and caps bytes/time without credentials', async () => {
  axios.get.mockResolvedValue({
    status: 200,
    headers: { 'content-type': 'application/vnd.ipld.car;version=1' },
    data: Buffer.from([1, 2]),
  });
  expect(await service.readCAR('trustless', cid)).toEqual(Buffer.from([1, 2]));
  const [url, options] = axios.get.mock.calls[0];
  expect(url).toBe('https://trustless-gateway.link/ipfs/' + cid + '?format=car&dag-scope=all');
  expect(options).toMatchObject({
    timeout: 15000,
    maxContentLength: 10 * 1024 * 1024,
    maxRedirects: 0,
  });
  expect(options.headers.Authorization).toBeUndefined();
});
test('4everland subdomain gateway builds a fixed-template URL and rejects over-label CIDs', async () => {
  axios.get.mockResolvedValue({
    status: 200,
    headers: { 'content-type': 'application/vnd.ipld.car;version=1' },
    data: Buffer.from([3, 4]),
  });
  expect(await service.readCAR('everland', cid)).toEqual(Buffer.from([3, 4]));
  const [url, options] = axios.get.mock.calls[0];
  expect(url).toBe('https://' + cid + '.ipfs.4everland.io/?format=car&dag-scope=all');
  expect(options.maxRedirects).toBe(0);
  expect(options.headers.Authorization).toBeUndefined();
  const longCid = 'b' + 'a'.repeat(70);
  await expect(service.readCAR('everland', longCid)).rejects.toThrow('label');
  expect(axios.get).toHaveBeenCalledTimes(1);
  await expect(service.readCAR('trustless', longCid)).resolves.toEqual(Buffer.from([3, 4]));
});
test('arbitrary gateway, path/query injection and non-CAR responses rejected', async () => {
  for (const [g, c] of [
    ['http://127.0.0.1', cid],
    ['trustless', cid + '/../../x'],
    ['trustless', cid + '?url=bad'],
  ])
    await expect(service.readCAR(g, c)).rejects.toThrow('Invalid');
  expect(axios.get).not.toHaveBeenCalled();
  axios.get.mockResolvedValue({
    status: 200,
    headers: { 'content-type': 'text/html' },
    data: 'not CAR',
  });
  await expect(service.readCAR('trustless', cid)).rejects.toThrow('CAR');
});
