const blockchainService = require('../services/blockchain/readOnlyVerificationService');

// Read the contract at one block, never infer anchoring from a database flag.
const verifyFileHash = async (req, res) => {
  const hash = String(req.params.hash || '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) {
    return res.status(400).json({ error: 'A 64-character SHA-256 hash is required.' });
  }
  try {
    await blockchainService.initialize();
    const { provider, contract } = blockchainService;
    const network = await provider.getNetwork();
    // The project currently supports Polygon Amoy only. Fail closed elsewhere.
    if (Number(network.chainId) !== 80002) {
      return res.status(503).json({ error: 'Verification unavailable: expected Polygon Amoy (80002).' });
    }
    const blockNumber = await provider.getBlockNumber();
    if (await provider.getCode(await contract.getAddress(), blockNumber) === '0x') {
      return res.status(503).json({ error: 'Verification unavailable: no contract at the configured address.' });
    }
    const [exists, evidenceId] = await contract.verifyHash(hash, { blockTag: blockNumber });
    if (exists) {
      const evidence = await contract.getEvidence(evidenceId, { blockTag: blockNumber });
      if (evidence[0] !== hash || evidenceId <= 0n) {
        return res.status(503).json({ error: 'Verification unavailable: contract records disagree.' });
      }
    }
    return res.json({ success: true, hash, anchored: exists,
      evidenceId: exists ? evidenceId.toString() : null, chainId: 80002,
      contractAddress: await contract.getAddress(), blockNumber,
      note: 'Polygon Amoy testnet only. Anchoring does not prove authenticity or legal admissibility.' });
  } catch (_) {
    return res.status(503).json({ error: 'Blockchain verification unavailable. No anchoring result was confirmed.' });
  }
};

const verificationHealth = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  let timeout;
  try {
    const check = async () => {
      await blockchainService.initialize();
      const { provider, contract } = blockchainService;
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 80002) throw new Error('Expected Polygon Amoy (80002).');
      const blockNumber = await provider.getBlockNumber();
      const contractAddress = await contract.getAddress();
      if (await provider.getCode(contractAddress, blockNumber) === '0x') throw new Error('No contract at the configured address.');
      const result = await contract.verifyHash('0'.repeat(64), { blockTag: blockNumber });
      const record = await contract.getEvidence(result[0] ? result[1] : 0n, { blockTag: blockNumber });
      if (typeof result[0] !== 'boolean' || typeof result[1] !== 'bigint' || typeof record[0] !== 'string') throw new Error('Contract interface check failed.');
      return { success: true, chainId: 80002, contractAddress, blockNumber, checkedAt: new Date().toISOString() };
    };
    const result = await Promise.race([check(), new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Read-only check timed out.')), 12000);
    })]);
    return res.json(result);
  } catch (_) {
    // Do not echo RPC URLs or configuration values which may contain API keys.
    return res.status(503).json({ success: false, error: 'Read-only check unavailable: check Amoy RPC, contract configuration and connectivity.' });
  } finally { clearTimeout(timeout); }
};

module.exports = { verifyFileHash, verificationHealth };
