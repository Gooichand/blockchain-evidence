/* Optional live integration, zero gas, no wallet/.env/private-key access. Public data only. */
const { ethers } = require('ethers');
const abi = require('../contracts/EvidenceStorage.abi.json');
const service = require('../services/blockchain/readOnlyVerificationService');
const { inspect } = require('../controllers/blockchainInspectionController');
const { verifyFileHash } = require('../controllers/hashVerificationController');
async function call(fn, params) {
  const res = {
    statusCode: 200,
    set() {
      return this;
    },
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await fn({ params }, res);
  return { status: res.statusCode, ...res.body };
}
async function main() {
  const provider = new ethers.JsonRpcProvider('https://polygon-amoy-bor-rpc.publicnode.com');
  const contract = new ethers.Contract('0x39453ED8CF79Fe56150fe1E8348e75894e3dD9e3', abi, provider);
  service.initialize = async () => {};
  service.provider = provider;
  service.contract = contract;
  try {
    const block = await call(inspect, { kind: 'block', value: 'latest' });
    if (!block.success || !block.data?.transactionHashes?.length)
      throw Error('Live block unavailable or empty. Nothing confirmed.');
    const tx = await call(inspect, { kind: 'transaction', value: block.data.transactionHashes[0] });
    const present = await call(verifyFileHash, { hash: '1'.repeat(64) }),
      absent = await call(verifyFileHash, { hash: '0'.repeat(64) });
    console.log(
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          source:
            'Actual repository controllers, public read-only RPC test adapter. Not the deployed authenticated website.',
          block,
          tx,
          present,
          absent,
        },
        null,
        2,
      ),
    );
    if (!tx.success || !present.success || !absent.success) process.exitCode = 1;
  } finally {
    provider.destroy();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
