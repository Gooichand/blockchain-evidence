const fs = require('fs'),
  vm = require('vm'),
  { webcrypto } = require('crypto'),
  { Blob } = require('buffer');
const hash = require('crypto').createHash('sha256').update('abc').digest('hex');
let fetchMock, run;
beforeEach(() => {
  fetchMock = jest.fn();
  const window = {};
  vm.runInNewContext(
    fs.readFileSync(require('path').join(__dirname, '../public/forensic-lab.js'), 'utf8'),
    { window, crypto: webcrypto, fetch: fetchMock, AbortSignal },
  );
  run = () =>
    window.ForensicLab.services.HashToolService.run(
      { id: 'blockchain-verify' },
      Object.assign(new Blob(['abc']), { name: 'synthetic.bin' }),
    );
});
function answer(overrides = {}) {
  return {
    success: true,
    anchored: false,
    hash,
    chainId: 80002,
    contractAddress: '0x' + '1'.repeat(40),
    blockNumber: 123,
    evidenceId: null,
    ...overrides,
  };
}
const respond = (result) => fetchMock.mockResolvedValue({ ok: true, json: async () => result });
test('valid NOT FOUND response retains exact lookup digest and context', async () => {
  respond(answer());
  expect(await run()).toMatchObject({ anchored: false, hash, blockNumber: 123 });
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/blockchain/verify-hash/' + hash,
    expect.objectContaining({ credentials: 'same-origin' }),
  );
});
test.each([
  { hash: 'b'.repeat(64) },
  { chainId: 137 },
  { success: false },
  { anchored: 'true' },
  { contractAddress: null },
  { contractAddress: 'wrong' },
  { blockNumber: null },
  { blockNumber: -1 },
  { blockNumber: 1.5 },
  { anchored: true, evidenceId: null },
  { anchored: true, evidenceId: '0' },
  { anchored: true, evidenceId: '-1' },
  { anchored: false, evidenceId: '1' },
])('malformed/inconsistent response fails closed %j', async (changes) => {
  respond(answer(changes));
  await expect(run()).rejects.toThrow();
});
test('positive path UI validation is a synthetic response test, not a live anchored sample', async () => {
  respond(answer({ anchored: true, evidenceId: '1' }));
  expect((await run()).anchored).toBe(true);
});
test.each(['network', 'json', 'http'])('%s failures cannot become NOT FOUND', async (kind) => {
  if (kind === 'network') fetchMock.mockRejectedValue(new Error('network unavailable'));
  if (kind === 'json')
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw Error('invalid JSON');
      },
    });
  if (kind === 'http')
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'server unavailable' }) });
  await expect(run()).rejects.toThrow();
});
