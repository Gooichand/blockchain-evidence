jest.mock('../services/blockchain/readOnlyVerificationService', () => ({
  initialize: jest.fn(),
  provider: { getNetwork: jest.fn(), getBlockNumber: jest.fn(), getCode: jest.fn() },
  contract: { verifyHash: jest.fn(), getEvidence: jest.fn(), getAddress: jest.fn() },
}));
const service = require('../services/blockchain/readOnlyVerificationService');
const { verifyFileHash } = require('../controllers/hashVerificationController');
const hash = 'a'.repeat(64);
const call = async (value = hash) => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  await verifyFileHash({ params: { hash: value } }, res);
  return res;
};
beforeEach(() => {
  jest.resetAllMocks();
  service.initialize.mockResolvedValue(true);
  service.provider.getNetwork.mockResolvedValue({ chainId: 80002n });
  service.provider.getBlockNumber.mockResolvedValue(123);
  service.provider.getCode.mockResolvedValue('0x1234');
  service.contract.getAddress.mockResolvedValue('0x' + '1'.repeat(40));
  service.contract.verifyHash.mockResolvedValue([true, 1n]);
  service.contract.getEvidence.mockResolvedValue([hash]);
});
test('reads both hash index and stored record at same block', async () => {
  const res = await call();
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ anchored: true, evidenceId: '1', chainId: 80002, blockNumber: 123 }));
  expect(service.contract.verifyHash).toHaveBeenCalledWith(hash, { blockTag: 123 });
  expect(service.contract.getEvidence).toHaveBeenCalledWith(1n, { blockTag: 123 });
});
test('reports not found, not an error or verified flag', async () => {
  service.contract.verifyHash.mockResolvedValue([false, 0n]);
  expect((await call()).json).toHaveBeenCalledWith(expect.objectContaining({ anchored: false, evidenceId: null }));
});
test('rejects malformed hash without external call', async () => {
  expect((await call('invalid')).status).toHaveBeenCalledWith(400);
  expect(service.initialize).not.toHaveBeenCalled();
});
test('rejects wrong chain', async () => {
  service.provider.getNetwork.mockResolvedValue({ chainId: 137n });
  expect((await call()).status).toHaveBeenCalledWith(503);
  expect(service.contract.verifyHash).not.toHaveBeenCalled();
});
test('rejects missing contract', async () => {
  service.provider.getCode.mockResolvedValue('0x');
  expect((await call()).status).toHaveBeenCalledWith(503);
});
test('rejects inconsistent index and evidence record', async () => {
  service.contract.getEvidence.mockResolvedValue(['b'.repeat(64)]);
  expect((await call()).status).toHaveBeenCalledWith(503);
});
test('RPC failure never becomes successful verification', async () => {
  service.contract.verifyHash.mockRejectedValue(new Error('RPC down'));
  expect((await call()).status).toHaveBeenCalledWith(503);
});
test('configuration failure never becomes successful verification', async () => {
  service.initialize.mockRejectedValue(new Error('missing config'));
  expect((await call()).status).toHaveBeenCalledWith(503);
});

const { verificationHealth } = require('../controllers/hashVerificationController');
const health = async () => {
  const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  await verificationHealth({}, res);
  return res;
};
test('health requires chain, bytecode and contract reads at one block', async () => {
  const res = await health();
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, chainId: 80002, blockNumber: 123 }));
  expect(service.contract.verifyHash).toHaveBeenCalledWith('0'.repeat(64), { blockTag: 123 });
  expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
});
test('health never green on wrong chain or no deployed code', async () => {
  service.provider.getNetwork.mockResolvedValue({ chainId: 137n });
  expect((await health()).status).toHaveBeenCalledWith(503);
  service.provider.getNetwork.mockResolvedValue({ chainId: 80002n });
  service.provider.getCode.mockResolvedValue('0x');
  expect((await health()).status).toHaveBeenCalledWith(503);
});
test('health never green on contract interface failure and hides private RPC details', async () => {
  service.contract.verifyHash.mockRejectedValue(new Error('https://rpc.invalid/private-api-key'));
  const res = await health();
  expect(res.status).toHaveBeenCalledWith(503);
  expect(JSON.stringify(res.json.mock.calls)).not.toContain('private-api-key');
});
test('health timeout returns unavailable rather than leaving a green result', async () => {
  jest.useFakeTimers();
  service.initialize.mockImplementation(() => new Promise(() => {}));
  const pending = health();
  await jest.advanceTimersByTimeAsync(12000);
  expect((await pending).status).toHaveBeenCalledWith(503);
  jest.useRealTimers();
});
