jest.mock('../services/blockchain/blockchainService', () => ({
  initialize: jest.fn(),
  provider: { getNetwork: jest.fn(), getBlockNumber: jest.fn(), getCode: jest.fn() },
  contract: { verifyHash: jest.fn(), getEvidence: jest.fn(), getAddress: jest.fn() },
}));
const service = require('../services/blockchain/blockchainService');
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
