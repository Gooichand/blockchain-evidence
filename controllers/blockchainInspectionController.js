const service = require('../services/blockchain/readOnlyVerificationService');
// New inspection route never uses a signer, database verification flag or private key.
const inspect = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { kind, value } = req.params;
  if (!['transaction', 'block', 'record', 'events'].includes(kind))
    return res.status(400).json({ error: 'Unsupported inspection.' });
  if (kind === 'transaction' && !/^0x[0-9a-fA-F]{64}$/.test(value))
    return res.status(400).json({ error: 'Complete transaction hash required.' });
  if (kind !== 'transaction' && value !== 'latest' && !/^(0|[1-9][0-9]{0,14})$/.test(value))
    return res.status(400).json({ error: 'Nonnegative integer required.' });
  if (['record', 'events'].includes(kind) && (value === 'latest' || BigInt(value) < 1n))
    return res.status(400).json({ error: 'Positive evidence ID required.' });
  let timer;
  try {
    const work = async () => {
      await service.initialize();
      const { provider, contract } = service;
      if (Number((await provider.getNetwork()).chainId) !== 80002) throw Error('Wrong chain');
      const head = await provider.getBlockNumber(),
        address = await contract.getAddress();
      if ((await provider.getCode(address, head)) === '0x') throw Error('No contract');
      let data;
      if (kind === 'transaction') {
        const receipt = await provider.getTransactionReceipt(value);
        if (!receipt) return { state: 'NOT_MINED_OR_NOT_FOUND', head };
        const block = await provider.getBlock(receipt.blockNumber);
        if (
          !block ||
          block.hash !== receipt.blockHash ||
          receipt.hash.toLowerCase() !== value.toLowerCase()
        )
          throw Error('Inconsistent receipt');
        data = {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          status: receipt.status === 1 ? 'EXECUTED_SUCCESSFULLY' : 'REVERTED',
          confirmations: Math.max(0, head - receipt.blockNumber + 1),
          from: receipt.from,
          to: receipt.to,
          gasUsed: receipt.gasUsed.toString(),
          timestamp: block.timestamp,
          limit:
            'Execution receipt is not proof this transaction anchors any evidence. Confirmations can change after reorgs.',
        };
      } else if (kind === 'block') {
        const block = await provider.getBlock(value === 'latest' ? head : Number(value));
        if (!block) return { state: 'BLOCK_NOT_FOUND', head };
        data = {
          blockNumber: block.number,
          hash: block.hash,
          parentHash: block.parentHash,
          timestamp: block.timestamp,
          transactionCount: block.transactions.length,
          transactionHashes: block.transactions.slice(0, 100),
          truncated: block.transactions.length > 100,
          confirmations: Math.max(0, head - block.number + 1),
        };
      } else if (kind === 'record') {
        const record = await contract.getEvidence(BigInt(value), { blockTag: head });
        if (!record[0]) return { state: 'RECORD_NOT_FOUND', head };
        data = {
          evidenceId: value,
          fileHash: record[0],
          untrustedMetadata: record[1].slice(0, 100000),
          metadataTruncated: record[1].length > 100000,
          uploadedBy: record[2],
          timestamp: record[3].toString(),
          isSealed: record[4],
          limit:
            'Contract claims only. No physical-world origin, identity, full history or legal provenance is established.',
        };
      } else {
        const from = Math.max(0, head - 1999);
        const logs = await Promise.all([
          contract.queryFilter(contract.filters.EvidenceStored(BigInt(value)), from, head),
          contract.queryFilter(contract.filters.EvidenceSealed(BigInt(value)), from, head),
        ]);
        data = {
          evidenceId: value,
          fromBlock: from,
          toBlock: head,
          events: logs
            .flat()
            .sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index)
            .slice(0, 200)
            .map((x) => ({
              event: x.fragment.name,
              blockNumber: x.blockNumber,
              transactionHash: x.transactionHash,
              logIndex: x.index,
              values: Array.from(x.args, (v) => (typeof v === 'bigint' ? v.toString() : v)),
            })),
          limit:
            'Only Stored/Sealed events in the last 2000 blocks, max 200 logs. This contract has no custody-transfer events. Empty output is not absence of prior activity.',
        };
      }
      return {
        chainId: 80002,
        contractAddress: address,
        head,
        checkedAt: new Date().toISOString(),
        data,
      };
    };
    const result = await Promise.race([
      work(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error('timeout')), 15000);
      }),
    ]);
    res.json({ success: true, ...result });
  } catch {
    res.status(503).json({ error: 'Read-only Amoy inspection unavailable; no result confirmed.' });
  } finally {
    clearTimeout(timer);
  }
};
module.exports = { inspect };
