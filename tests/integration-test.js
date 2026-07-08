const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

const BASE_URL = process.env.API_URL || 'http://localhost:10000';
const TEST_WALLET = process.env.TEST_WALLET || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

async function testBlockchainIntegration() {
  console.log('🧪 Testing Blockchain & IPFS Integration\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  async function runTest(name, testFn) {
    try {
      console.log(`Testing: ${name}...`);
      await testFn();
      console.log(`✅ PASSED: ${name}\n`);
      results.passed++;
      results.tests.push({ name, status: 'passed' });
    } catch (error) {
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}\n`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
    }
  }

  await runTest('Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/api/blockchain/health`);
    if (response.data.health.blockchain.status !== 'healthy') {
      throw new Error('Blockchain not healthy');
    }
    if (response.data.health.ipfs.status !== 'healthy') {
      throw new Error('IPFS not configured');
    }
  });

  await runTest('Blockchain Status', async () => {
    const response = await axios.get(`${BASE_URL}/api/blockchain/status`);
    if (!response.data.status.blockchain.initialized) {
      throw new Error('Blockchain not initialized');
    }
  });

  await runTest('Blockchain Config', async () => {
    const response = await axios.get(`${BASE_URL}/api/blockchain/config`);
    if (!response.data.config.contractAddress) {
      throw new Error('Contract address not configured');
    }
  });

  await runTest('Blockchain Stats', async () => {
    const response = await axios.get(`${BASE_URL}/api/blockchain/stats`);
    if (typeof response.data.stats.network.currentBlock !== 'number') {
      throw new Error('Unable to get current block number');
    }
  });

  await runTest('IPFS Stats', async () => {
    const response = await axios.get(`${BASE_URL}/api/blockchain/ipfs/stats`);
    if (!response.data.stats.gateway) {
      throw new Error('IPFS gateway not configured');
    }
  });

  await runTest('Gas Estimation', async () => {
    const response = await axios.post(`${BASE_URL}/api/blockchain/estimate-gas`, {
      fileSize: 1024,
      metadata: { test: true },
    });
    if (!response.data.estimate.gas) {
      throw new Error('Gas estimation failed');
    }
  });

  await runTest('Evidence Upload with Blockchain & IPFS', async () => {
    const testFile = Buffer.from('Test evidence file content for blockchain integration');
    const FormData = require('form-data');
    const form = new FormData();

    form.append('file', testFile, 'test-evidence.txt');
    form.append('caseId', '1');
    form.append('type', 'document');
    form.append('description', 'Integration test evidence');
    form.append('uploadedBy', TEST_WALLET);

    const response = await axios.post(`${BASE_URL}/api/evidence/upload`, form, {
      headers: form.getHeaders(),
    });

    if (!response.data.evidence.blockchain_tx_hash) {
      throw new Error('Blockchain transaction hash missing');
    }
    if (!response.data.evidence.ipfs_cid) {
      throw new Error('IPFS CID missing');
    }

    console.log(`   TX Hash: ${response.data.evidence.blockchain_tx_hash}`);
    console.log(`   IPFS CID: ${response.data.evidence.ipfs_cid}`);
    console.log(`   Explorer: ${response.data.explorerUrl}`);

    global.testEvidenceId = response.data.evidence.id;
  });

  if (global.testEvidenceId) {
    await runTest('Evidence Verification', async () => {
      const response = await axios.get(`${BASE_URL}/api/evidence/${global.testEvidenceId}/verify`);
      if (!response.data.blockchainVerified) {
        throw new Error('Blockchain verification failed');
      }
    });

    await runTest('Blockchain Proof', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/evidence/${global.testEvidenceId}/blockchain-proof`,
      );
      if (!response.data.proof.blockchain_tx_hash) {
        throw new Error('Blockchain proof missing transaction hash');
      }
    });
  }

  await runTest('Monitoring Metrics', async () => {
    const response = await axios.get(`${BASE_URL}/api/monitoring/metrics`);
    if (!response.data.metrics.blockchain) {
      throw new Error('Blockchain metrics missing');
    }
    if (!response.data.metrics.ipfs) {
      throw new Error('IPFS metrics missing');
    }
  });

  await runTest('Monitoring Alerts', async () => {
    const response = await axios.get(`${BASE_URL}/api/monitoring/alerts`);
    if (!Array.isArray(response.data.alerts)) {
      throw new Error('Alerts not returned as array');
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`,
  );
  console.log('='.repeat(50) + '\n');

  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests
      .filter((t) => t.status === 'failed')
      .forEach((t) => {
        console.log(`  ❌ ${t.name}: ${t.error}`);
      });
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! Blockchain & IPFS integration is working correctly.\n');
    process.exit(0);
  }
}

testBlockchainIntegration().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
