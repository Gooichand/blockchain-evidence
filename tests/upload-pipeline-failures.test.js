jest.mock('../config', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../services/blockchain/blockchainService', () => ({ storeEvidence: jest.fn() }));
jest.mock('../services/storage/ipfsStorageService', () => ({
  uploadFile: jest.fn(),
  getGatewayUrl: jest.fn(() => 'https://example.invalid/synthetic'),
}));
jest.mock('../services/metadataExtractor', () => ({ extractMetadata: jest.fn() }));
const { supabase } = require('../config'),
  chain = require('../services/blockchain/blockchainService'),
  ipfs = require('../services/storage/ipfsStorageService'),
  meta = require('../services/metadataExtractor'),
  pipeline = require('../services/integratedEvidenceService');
let rows, errors, log;
beforeEach(() => {
  jest.clearAllMocks();
  rows = {};
  errors = {};
  log = jest.spyOn(console, 'error').mockImplementation(() => {});
  meta.extractMetadata.mockResolvedValue({ extracted: {}, flags: [] });
  chain.storeEvidence.mockResolvedValue({ txHash: 'synthetic-tx' });
  ipfs.uploadFile.mockResolvedValue({ cid: 'synthetic-cid' });
  supabase.from.mockImplementation((table) => ({
    insert: (payload) => {
      rows[table] = payload;
      const result = {
        data: table === 'evidence' ? { id: 1, ...payload } : null,
        error: errors[table] || null,
      };
      return {
        select: () => ({ single: async () => result }),
        then: (yes, no) => Promise.resolve(result).then(yes, no),
      };
    },
  }));
});
afterEach(() => log.mockRestore());
const run = () =>
  pipeline.uploadEvidence(
    Buffer.from('synthetic exact bytes'),
    'synthetic.txt',
    { caseId: 1, type: 'document', mimeType: 'text/plain' },
    'synthetic-owner',
  );
test('IPFS failure preserves bytes via explicit fallback and warns without false pin success', async () => {
  ipfs.uploadFile.mockRejectedValue(new Error('private synthetic storage error'));
  const r = await run();
  expect(r.ipfs).toBeNull();
  expect(r.errors).toContainEqual(expect.objectContaining({ code: 'IPFS_FAILED' }));
  expect(rows.evidence.file_data).toBe(
    'data:text/plain;base64,' + Buffer.from('synthetic exact bytes').toString('base64'),
  );
  expect(JSON.stringify(r.errors)).not.toContain('private synthetic');
});
test('chain failure is failed not verified, queues retry with exact digest, never retries in request', async () => {
  chain.storeEvidence.mockRejectedValue(new Error('private synthetic chain error'));
  const r = await run();
  expect(r.blockchain).toBeNull();
  expect(rows.evidence.blockchain_verified).toBe(false);
  expect(rows.evidence.blockchain_status).toBe('failed');
  expect(rows.blockchain_retry_queue.payload.hash).toBe(r.hash);
  expect(chain.storeEvidence).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(r.errors)).not.toContain('private synthetic');
});
test('both external failures save with both warnings rather than fabricated success', async () => {
  ipfs.uploadFile.mockRejectedValue(new Error('storage'));
  chain.storeEvidence.mockRejectedValue(new Error('chain'));
  const r = await run();
  expect(r.errors).toHaveLength(2);
  expect(r.database.id).toBe(1);
});
test('metadata extraction failure does not abort exact-byte ingest', async () => {
  meta.extractMetadata.mockRejectedValue(new Error('bad metadata'));
  const r = await run();
  expect(r.database.id).toBe(1);
  expect(r.metadata).toEqual({ extracted: {}, flags: [] });
});
test('database write failure aborts and does not queue or audit a stored record', async () => {
  errors.evidence = { message: 'synthetic DB failure' };
  await expect(run()).rejects.toThrow('synthetic DB failure');
  expect(rows.blockchain_retry_queue).toBeUndefined();
  expect(rows.activity_logs).toBeUndefined();
});
test('returned retry queue error must not be silently reported as guaranteed automatic recovery', async () => {
  chain.storeEvidence.mockRejectedValue(new Error('chain'));
  errors.blockchain_retry_queue = { message: 'synthetic queue unavailable' };
  const r = await run();
  expect(r.errors.some((e) => e.code === 'RETRY_QUEUE_FAILED')).toBe(true);
  expect(JSON.stringify(r.errors)).not.toContain('will be anchored automatically');
});
test('thrown retry queue failure warns without leaking private database detail', async () => {
  chain.storeEvidence.mockRejectedValue(new Error('chain'));
  const original = supabase.from.getMockImplementation();
  supabase.from.mockImplementation((table) =>
    table === 'blockchain_retry_queue'
      ? {
          insert: async () => {
            throw new Error('private synthetic queue token');
          },
        }
      : original(table),
  );
  const r = await run();
  expect(r.database.id).toBe(1);
  expect(r.errors).toContainEqual(expect.objectContaining({ code: 'RETRY_QUEUE_FAILED' }));
  expect(JSON.stringify(r.errors)).not.toContain('private synthetic queue token');
});
