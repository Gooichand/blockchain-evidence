/* Real in-memory EVM exercise. NOT public Amoy, no real wallet or funds. */
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ganache = require(process.env.GANACHE_MODULE || 'ganache');
const solc = require('solc');
const { ethers } = require('ethers');
const service = require('../services/blockchain/readOnlyVerificationService');
const { inspect } = require('../controllers/blockchainInspectionController');
const { verifyFileHash } = require('../controllers/hashVerificationController');
async function call(fn, params) {
  const res = {
    statusCode: 200,
    set() {
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await fn({ params }, res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  return res.body;
}
async function run() {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../contracts/EvidenceStorage.sol'),
    'utf8',
  );
  const compiled = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: 'Solidity',
        sources: { 'EvidenceStorage.sol': { content: source } },
        settings: {
          evmVersion: 'shanghai',
          outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
        },
      }),
    ),
  );
  const errors = (compiled.errors || []).filter((e) => e.severity === 'error');
  assert.deepEqual(errors, []);
  const artifact = compiled.contracts['EvidenceStorage.sol'].EvidenceStorage;
  const engine = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 80002, hardfork: 'shanghai' },
    wallet: { totalAccounts: 1 },
  });
  const provider = new ethers.BrowserProvider(engine, undefined, { cacheTimeout: -1 });
  provider.pollingInterval = 30;
  try {
    const signer = await provider.getSigner();
    const contract = await new ethers.ContractFactory(
      artifact.abi,
      artifact.evm.bytecode.object,
      signer,
    ).deploy();
    await contract.waitForDeployment();
    const hash = 'a'.repeat(64),
      store = await contract.storeEvidence(hash, 'Synthetic local-chain test only');
    const receipt = await store.wait();
    await (await contract.sealEvidence(1)).wait();
    // Explicit dependency injection: never reads RPC URLs/private keys from .env.
    service.initialize = async () => {};
    service.provider = provider;
    service.contract = contract.connect(provider);
    const verified = await call(verifyFileHash, { hash });
    assert.equal(verified.anchored, true);
    assert.equal(verified.evidenceId, '1');
    const absent = await call(verifyFileHash, { hash: 'b'.repeat(64) });
    assert.equal(absent.anchored, false);
    const tx = await call(inspect, { kind: 'transaction', value: receipt.hash });
    assert.equal(tx.data.status, 'EXECUTED_SUCCESSFULLY');
    assert.equal(tx.data.blockHash, receipt.blockHash);
    const block = await call(inspect, { kind: 'block', value: String(receipt.blockNumber) });
    assert.equal(block.data.hash, receipt.blockHash);
    const record = await call(inspect, { kind: 'record', value: '1' });
    assert.equal(record.data.isSealed, true);
    assert.equal(record.data.untrustedMetadata, 'Synthetic local-chain test only');
    const events = await call(inspect, { kind: 'events', value: '1' });
    assert.deepEqual(
      events.data.events.map((x) => x.event),
      ['EvidenceStored', 'EvidenceSealed'],
    );
    const missing = await call(inspect, { kind: 'record', value: '2' });
    assert.equal(missing.state, 'RECORD_NOT_FOUND');
    console.log(
      'PASS: real local EVM deployment, store/seal, hash present/absent, transaction, block, record and event inspection. No public-chain result is implied.',
    );
  } finally {
    await provider.destroy();
    await engine.disconnect();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
