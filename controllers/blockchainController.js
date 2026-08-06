const integratedEvidenceService = require('../services/integratedEvidenceService');
const blockchainService = require('../services/blockchain/blockchainService');
const ipfsStorageService = require('../services/storage/ipfsStorageService');
const { supabase } = require('../config');

const getSystemStatus = async (req, res) => {
  try {
    const status = await integratedEvidenceService.getSystemStatus();
    res.json({
      success: true,
      status: JSON.parse(
        JSON.stringify(status, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
      ),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status: ' + error.message });
  }
};

const getBlockchainConfig = async (req, res) => {
  try {
    await blockchainService.initialize();
    const networkInfo = blockchainService.getNetworkInfo();

    res.json({
      success: true,
      config: {
        name: networkInfo.name,
        chainId: networkInfo.chainId,
        contractAddress: networkInfo.contractAddress,
        walletAddress: networkInfo.walletAddress,
        explorerUrl: blockchainService.getAddressExplorerUrl(networkInfo.contractAddress),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blockchain config: ' + error.message });
  }
};

const getBlockchainStats = async (req, res) => {
  try {
    const { data: evidenceCount, error: countError } = (await supabase
      .from('evidence')
      .select('id', { count: 'exact', head: true })
      .eq('blockchain_verified', true)) || {};

    const { data: recentTx, error: txError } = (await supabase
      .from('evidence')
      .select('blockchain_tx_hash, blockchain_block_number, blockchain_timestamp, gas_used')
      .not('blockchain_tx_hash', 'is', null)
      .order('blockchain_timestamp', { ascending: false })
      .limit(10)) || {};

    const { data: gasStats, error: gasError } = (await supabase
      .from('evidence')
      .select('gas_used')
      .not('gas_used', 'is', null)) || {};

    const totalGas = gasStats?.reduce((sum, item) => sum + parseFloat(item.gas_used || 0), 0) || 0;
    const avgGas = gasStats?.length > 0 ? totalGas / gasStats.length : 0;

    await blockchainService.initialize();
    const balance = await blockchainService.getBalance();
    const blockNumber = await blockchainService.getBlockNumber();

    res.json({
      success: true,
      stats: {
        totalEvidenceOnChain: evidenceCount?.length || 0,
        recentTransactions: recentTx || [],
        gasUsage: {
          total: totalGas.toFixed(0),
          average: avgGas.toFixed(0),
          count: gasStats?.length || 0,
        },
        network: {
          currentBlock: blockNumber,
          walletBalance: balance,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blockchain stats: ' + error.message });
  }
};

const getIPFSStats = async (req, res) => {
  try {
    const { data: ipfsCount, error: countError } = (await supabase
      .from('evidence')
      .select('id', { count: 'exact', head: true })
      .not('ipfs_cid', 'is', null)) || {};

    const { data: recentUploads, error: uploadsError } = (await supabase
      .from('evidence')
      .select('ipfs_cid, name, file_size, timestamp')
      .not('ipfs_cid', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(10)) || {};

    const { data: sizeStats, error: sizeError } = (await supabase
      .from('evidence')
      .select('file_size')
      .not('ipfs_cid', 'is', null)) || {};

    const totalSize = sizeStats?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;

    res.json({
      success: true,
      stats: {
        totalFilesOnIPFS: ipfsCount?.length || 0,
        recentUploads: recentUploads || [],
        storage: {
          totalBytes: totalSize,
          totalMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalGB: (totalSize / (1024 * 1024 * 1024)).toFixed(4),
        },
        gateway: ipfsStorageService.gateway,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get IPFS stats: ' + error.message });
  }
};

const verifyTransaction = async (req, res) => {
  try {
    const { txHash } = req.params;

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('*')
      .eq('blockchain_tx_hash', txHash)
      .single()) || {};

    if (error || !evidence) {
      return res.status(404).json({ error: 'Transaction not found in database' });
    }

    await blockchainService.initialize();
    const verification = await blockchainService.verifyHash(evidence.hash);

    res.json({
      success: true,
      transaction: {
        hash: txHash,
        blockNumber: evidence.blockchain_block_number,
        timestamp: evidence.blockchain_timestamp,
        gasUsed: evidence.gas_used,
        verified: verification.exists,
        explorerUrl: blockchainService.getExplorerUrl(txHash),
      },
      evidence: {
        id: evidence.id,
        name: evidence.name,
        hash: evidence.hash,
        ipfsCid: evidence.ipfs_cid,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Transaction verification failed: ' + error.message });
  }
};

const estimateGas = async (req, res) => {
  try {
    const { fileSize, metadata } = req.body;

    const mockHash = '0x' + '0'.repeat(64);
    const mockMetadata = metadata || { fileName: 'test.pdf', fileSize };

    await blockchainService.initialize();
    const gasEstimate = await blockchainService.estimateGas(mockHash, mockMetadata);

    const balance = await blockchainService.getBalance();

    res.json({
      success: true,
      estimate: {
        gas: gasEstimate,
        walletBalance: balance,
        sufficient: parseFloat(balance) > 0.001,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Gas estimation failed: ' + error.message });
  }
};

const healthCheck = async (req, res) => {
  try {
    const health = {
      blockchain: { status: 'unknown', error: null },
      ipfs: { status: 'unknown', error: null },
      database: { status: 'unknown', error: null },
    };

    try {
      await blockchainService.initialize();
      await blockchainService.getBlockNumber();
      health.blockchain.status = 'healthy';
    } catch (error) {
      health.blockchain.status = 'unhealthy';
      health.blockchain.error = error.message;
    }

    health.ipfs.status = ipfsStorageService.isConfigured() ? 'healthy' : 'not configured';

    try {
      const { error } = (await supabase.from('evidence').select('id').limit(1)) || {};
      health.database.status = error ? 'unhealthy' : 'healthy';
      if (error) health.database.error = error.message;
    } catch (error) {
      health.database.status = 'unhealthy';
      health.database.error = error.message;
    }

    const overallHealthy =
      health.blockchain.status === 'healthy' &&
      health.ipfs.status === 'healthy' &&
      health.database.status === 'healthy';

    res.status(overallHealthy ? 200 : 503).json({
      success: overallHealthy,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed: ' + error.message });
  }
};

module.exports = {
  getSystemStatus,
  getBlockchainConfig,
  getBlockchainStats,
  getIPFSStats,
  verifyTransaction,
  estimateGas,
  healthCheck,
};
