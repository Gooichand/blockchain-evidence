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
