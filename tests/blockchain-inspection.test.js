jest.mock('../services/blockchain/readOnlyVerificationService', () => ({
  initialize: jest.fn(),
  provider: {
    getNetwork: jest.fn(),
    getBlockNumber: jest.fn(),
    getCode: jest.fn(),
    getTransactionReceipt: jest.fn(),
    getBlock: jest.fn(),
  },
  contract: {
    getAddress: jest.fn(),
    getEvidence: jest.fn(),
    queryFilter: jest.fn(),
    filters: { EvidenceStored: jest.fn(), EvidenceSealed: jest.fn() },
  },
}));
const svc = require('../services/blockchain/readOnlyVerificationService'),
  { inspect } = require('../controllers/blockchainInspectionController'),
  { validate } = require('../public/blockchain-inspection');
async function call(kind, value) {
  const r = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
  await inspect({ params: { kind, value } }, r);
  return r;
}
beforeEach(() => {
  jest.resetAllMocks();
  svc.provider.getNetwork.mockResolvedValue({ chainId: 80002n });
  svc.provider.getBlockNumber.mockResolvedValue(2200);
  svc.provider.getCode.mockResolvedValue('0x1234');
  svc.contract.getAddress.mockResolvedValue('0x' + '1'.repeat(40));
});
test('block read is real RPC data capped and not a mocked success flag', async () => {
  svc.provider.getBlock.mockResolvedValue({
    number: 2200,
    hash: 'block',
    parentHash: 'parent',
    timestamp: 100,
    transactions: ['a'],
  });
  const r = await call('block', 'latest');
  expect(svc.provider.getBlock).toHaveBeenCalledWith(2200);
  expect(r.json).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ transactionCount: 1, confirmations: 1 }),
    }),
  );
});
test('transaction absent and inconsistent receipts fail honestly', async () => {
  svc.provider.getTransactionReceipt.mockResolvedValue(null);
  expect((await call('transaction', '0x' + 'a'.repeat(64))).json).toHaveBeenCalledWith(
    expect.objectContaining({ state: 'NOT_MINED_OR_NOT_FOUND' }),
  );
  svc.provider.getTransactionReceipt.mockResolvedValue({
    hash: '0x' + 'a'.repeat(64),
    blockHash: 'wrong',
    blockNumber: 2,
  });
  svc.provider.getBlock.mockResolvedValue({ hash: 'other' });
  expect((await call('transaction', '0x' + 'a'.repeat(64))).status).toHaveBeenCalledWith(503);
});
test('reads evidence at one block and labels metadata untrusted', async () => {
  svc.contract.getEvidence.mockResolvedValue([
    'abc',
    '<script>untrusted</script>',
    'address',
    123n,
    false,
  ]);
  const r = await call('record', '1');
  expect(svc.contract.getEvidence).toHaveBeenCalledWith(1n, { blockTag: 2200 });
  expect(r.json).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ untrustedMetadata: '<script>untrusted</script>' }),
    }),
  );
});
test('event scan is bounded and never called a complete custody chain', async () => {
  svc.contract.queryFilter.mockResolvedValue([]);
  const r = await call('events', '1');
  expect(svc.contract.queryFilter).toHaveBeenCalledWith(undefined, 201, 2200);
  expect(r.json.mock.calls[0][0].data.limit).toContain('no custody-transfer');
});
test('wrong chain and private RPC failure fail closed', async () => {
  svc.provider.getNetwork.mockResolvedValue({ chainId: 137n });
  expect((await call('block', 'latest')).status).toHaveBeenCalledWith(503);
  svc.initialize.mockRejectedValue(Error('secret-key'));
  const r = await call('block', 'latest');
  expect(JSON.stringify(r.json.mock.calls)).not.toContain('secret-key');
});
test('invalid parameters rejected before RPC', async () => {
  expect((await call('record', 'latest')).status).toHaveBeenCalledWith(400);
  expect((await call('record', '0')).status).toHaveBeenCalledWith(400);
  expect((await call('transaction', 'x')).status).toHaveBeenCalledWith(400);
  expect(() => validate('evidence-verify', 'a')).toThrow();
  expect(svc.initialize).not.toHaveBeenCalled();
});
test('raw CID content check hashes actual bytes and rejects changed payload', async () => {
  const fs = require('fs');
  global.crypto = require('crypto').webcrypto;
  global.LocalCID = new Function(
    fs.readFileSync('public/vendor/cid-bundle.js', 'utf8') + ';return LocalCID;',
  )();
  const { inspectRaw } = require('../public/blockchain-inspection'),
    bytes = new TextEncoder().encode('Original demo block'),
    cid = global.LocalCID.CID.createV1(0x55, await global.LocalCID.sha256.digest(bytes)).toString(),
    file = { size: bytes.length, arrayBuffer: async () => bytes.buffer };
  expect((await inspectRaw(cid, file)).matchesBlockBytes).toBe(true);
  expect(
    (await inspectRaw(cid, { size: 2, arrayBuffer: async () => new Uint8Array([0, 1]).buffer }))
      .matchesBlockBytes,
  ).toBe(false);
  await expect(inspectRaw('bad CID', file)).rejects.toThrow();
});

test('same-origin live reads carry existing session headers without forwarding them to public RPC', async () => {
  const saved = global.fetch;
  global.apiClient = { getAuthHeaders: () => ({ Authorization: 'Bearer synthetic-local-test' }) };
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ success: true, state: 'TEST_RESPONSE' }) });
  try {
    await require('../public/blockchain-inspection').analyze('block-explorer', 'latest');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/blockchain/inspect/block/latest',
      expect.objectContaining({
        credentials: 'same-origin',
        headers: { Authorization: 'Bearer synthetic-local-test' },
      }),
    );
  } finally {
    global.fetch = saved;
    delete global.apiClient;
  }
});
