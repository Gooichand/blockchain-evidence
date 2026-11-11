jest.mock('ethers', () => {
  const provider = { destroy: jest.fn() };
  return { ethers: {
    isAddress: value => /^0x[a-f0-9]{40}$/i.test(value),
    FetchRequest: jest.fn().mockImplementation(url => ({ url })),
    JsonRpcProvider: jest.fn().mockImplementation(() => provider),
    Contract: jest.fn().mockImplementation(() => ({})),
  } };
});
const { ethers } = require('ethers');
const service = require('../services/blockchain/readOnlyVerificationService');
const original = { rpc: process.env.POLYGON_RPC_URL, address: process.env.CONTRACT_ADDRESS, key: process.env.PRIVATE_KEY };
afterAll(() => {
  for (const [key, value] of Object.entries({ POLYGON_RPC_URL: original.rpc, CONTRACT_ADDRESS: original.address, PRIVATE_KEY: original.key })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
test('read-only initialization needs no private key and binds contract to provider', async () => {
  delete process.env.PRIVATE_KEY;
  process.env.POLYGON_RPC_URL = 'https://public-rpc.invalid';
  process.env.CONTRACT_ADDRESS = '0x' + '1'.repeat(40);
  await service.initialize();
  expect(ethers.Contract).toHaveBeenCalledWith(process.env.CONTRACT_ADDRESS, expect.any(Array), service.provider);
  expect(ethers.FetchRequest.mock.results[0].value.timeout).toBe(10000);
});
test('missing or invalid config fails closed without a default contract assumption', async () => {
  process.env.CONTRACT_ADDRESS = 'invalid';
  await expect(service.initialize()).rejects.toThrow('configuration');
});
