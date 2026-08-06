const { supabase } = require('../config');
const blockchainService = require('./blockchain/blockchainService');
const ipfsStorageService = require('./storage/ipfsStorageService');

class MonitoringService {
  async getSystemMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      database: await this.getDatabaseMetrics(),
      blockchain: await this.getBlockchainMetrics(),
      ipfs: await this.getIPFSMetrics(),
      performance: await this.getPerformanceMetrics(),
    };

    return metrics;
  }

  async getDatabaseMetrics() {
    try {
      const { count: totalEvidence } = (await supabase
        .from('evidence')
        .select('*', { count: 'exact', head: true })) || {};

      const { count: totalCases } = (await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })) || {};

      const { count: totalUsers } = (await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })) || {};

      const { count: activeUsers } = (await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)) || {};

      const { data: recentActivity } = (await supabase
        .from('activity_logs')
        .select('action')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })) || {};

      return {
        totalEvidence: totalEvidence || 0,
        totalCases: totalCases || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        recentActivityCount: recentActivity?.length || 0,
        status: 'healthy',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async getBlockchainMetrics() {
    try {
      await blockchainService.initialize();

      const { count: onChainEvidence } = (await supabase
        .from('evidence')
        .select('*', { count: 'exact', head: true })
        .eq('blockchain_verified', true)) || {};

      const { data: gasData } = (await supabase
        .from('evidence')
        .select('gas_used')
        .not('gas_used', 'is', null)) || {};

      const totalGas = gasData?.reduce((sum, item) => sum + parseFloat(item.gas_used || 0), 0) || 0;

      const balance = await blockchainService.getBalance();
      const blockNumber = await blockchainService.getBlockNumber();
      const networkInfo = blockchainService.getNetworkInfo();

      return {
        status: 'healthy',
        network: networkInfo.name,
        chainId: Number(networkInfo.chainId),
        contractAddress: networkInfo.contractAddress,
        currentBlock: blockNumber,
        walletBalance: balance,
        totalEvidenceOnChain: onChainEvidence || 0,
        totalGasUsed: totalGas.toFixed(0),
        averageGasPerTx: gasData?.length > 0 ? (totalGas / gasData.length).toFixed(0) : '0',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async getIPFSMetrics() {
    try {
      const { count: ipfsFiles } = (await supabase
        .from('evidence')
        .select('*', { count: 'exact', head: true })
        .not('ipfs_cid', 'is', null)) || {};

      const { data: sizeData } = (await supabase
        .from('evidence')
        .select('file_size')
        .not('ipfs_cid', 'is', null)) || {};

      const totalSize = sizeData?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;

      return {
        status: ipfsStorageService.isConfigured() ? 'healthy' : 'not configured',
        totalFiles: ipfsFiles || 0,
        totalStorageBytes: totalSize,
        totalStorageMB: (totalSize / (1024 * 1024)).toFixed(2),
        gateway: ipfsStorageService.gateway,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async getPerformanceMetrics() {
    try {
      const { data: recentUploads } = (await supabase
        .from('evidence')
        .select('timestamp')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())) || {};

      const { data: recentVerifications } = (await supabase
        .from('activity_logs')
        .select('timestamp')
        .eq('action', 'evidence_verification')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())) || {};

      return {
        uploadsLast24h: recentUploads?.length || 0,
        verificationsLast24h: recentVerifications?.length || 0,
        uptime: process.uptime(),
        memoryUsage: {
          heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
          heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        },
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  async getAlerts() {
    const alerts = [];

    try {
      await blockchainService.initialize();
      const balance = parseFloat(await blockchainService.getBalance());

      if (balance < 0.1) {
        alerts.push({
          severity: 'warning',
          type: 'low_balance',
          message: `Wallet balance is low: ${balance.toFixed(4)} MATIC`,
          action: 'Add funds to continue blockchain operations',
        });
      }

      if (balance < 0.01) {
        alerts.push({
          severity: 'critical',
          type: 'critical_balance',
          message: `Wallet balance critically low: ${balance.toFixed(4)} MATIC`,
          action: 'Immediate action required: Add funds',
        });
      }
    } catch (error) {
      alerts.push({
        severity: 'error',
        type: 'blockchain_error',
        message: 'Blockchain service unavailable',
        error: error.message,
      });
    }

    if (!ipfsStorageService.isConfigured()) {
      alerts.push({
        severity: 'warning',
        type: 'ipfs_not_configured',
        message: 'IPFS service is not configured',
        action: 'Set PINATA_JWT in environment variables',
      });
    }

    return alerts;
  }

  async logMetrics() {
    try {
      const metrics = await this.getSystemMetrics();
      const alerts = await this.getAlerts();

      await supabase.from('activity_logs').insert({
        user_id: 'system',
        action: 'system_metrics',
        details: JSON.stringify({ metrics, alerts }),
        timestamp: new Date().toISOString(),
      });

      return { metrics, alerts };
    } catch (error) {
      throw new Error(`Failed to log metrics: ${error.message}`);
    }
  }
}

module.exports = new MonitoringService();
