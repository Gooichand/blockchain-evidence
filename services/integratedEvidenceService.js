const blockchainService = require('./blockchain/blockchainService');
const ipfsStorageService = require('./storage/ipfsStorageService');
const { supabase } = require('../config');
const crypto = require('crypto');

class IntegratedEvidenceService {
  async uploadEvidence(fileBuffer, fileName, metadata, uploadedBy) {
    const results = {
      hash: null,
      ipfs: null,
      blockchain: null,
      database: null,
      errors: [],
    };

    try {
      results.hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      try {
        results.ipfs = await ipfsStorageService.uploadFile(fileBuffer, fileName, {
          ...metadata,
          uploadedBy,
        });
      } catch (ipfsError) {
        results.errors.push({ service: 'IPFS', error: ipfsError.message });
      }

      const blockchainMetadata = {
        fileName,
        fileSize: fileBuffer.length,
        mimeType: metadata.mimeType,
        caseId: metadata.caseId,
        ipfsCid: results.ipfs?.cid || null,
        uploadedBy,
      };

      try {
        results.blockchain = await blockchainService.storeEvidence(
          results.hash,
          blockchainMetadata,
        );
      } catch (blockchainError) {
        results.errors.push({ service: 'Blockchain', error: blockchainError.message });
      }

      try {
        const { data: evidence, error: dbError } = (await supabase
          .from('evidence')
          .insert({
            case_id: metadata.caseId,
            name: fileName,
            file_type: metadata.mimeType,
            file_size: fileBuffer.length,
            hash: results.hash,
            ipfs_cid: results.ipfs?.cid || null,
            blockchain_tx_hash: results.blockchain?.txHash || null,
            blockchain_block_number: results.blockchain?.blockNumber || null,
            gas_used: results.blockchain?.gasUsed || null,
            submitted_by: uploadedBy,
            description: metadata.description,
            location: metadata.location,
            collection_date: metadata.collectionDate,
            blockchain_verified: !!results.blockchain,
            blockchain_timestamp: results.blockchain ? new Date().toISOString() : null,
            timestamp: new Date().toISOString(),
          })
          .select()
          .single()) || {};

        if (dbError) throw dbError;
        results.database = evidence;
      } catch (dbError) {
        results.errors.push({ service: 'Database', error: dbError.message });
        throw dbError;
      }

      await supabase.from('activity_logs').insert({
        user_id: uploadedBy,
        action: 'evidence_uploaded',
        details: JSON.stringify({
          evidence_id: results.database.id,
          file_name: fileName,
          ipfs_cid: results.ipfs?.cid || null,
          tx_hash: results.blockchain?.txHash || null,
          errors: results.errors,
        }),
        timestamp: new Date().toISOString(),
      });

      return results;
    } catch (error) {
      throw new Error(`Evidence upload failed: ${error.message}`);
    }
  }

  async verifyEvidence(evidenceId) {
    try {
      const { data: evidence, error } = (await supabase
        .from('evidence')
        .select('*')
        .eq('id', evidenceId)
        .single()) || {};

      if (error || !evidence) {
        throw new Error('Evidence not found');
      }

      const verification = {
        evidenceId,
        databaseHash: evidence.hash,
        blockchainVerified: false,
        ipfsVerified: false,
        errors: [],
      };

      if (evidence.hash) {
        try {
          const blockchainResult = await blockchainService.verifyHash(evidence.hash);
          verification.blockchainVerified = blockchainResult.exists;
        } catch (error) {
          verification.errors.push({ service: 'Blockchain', error: error.message });
        }
      }

      if (evidence.ipfs_cid) {
        try {
          const ipfsFile = await ipfsStorageService.getFile(evidence.ipfs_cid);
          const recalculatedHash = crypto.createHash('sha256').update(ipfsFile).digest('hex');
          verification.ipfsVerified = recalculatedHash === evidence.hash;
          verification.ipfsHash = recalculatedHash;
        } catch (error) {
          verification.errors.push({ service: 'IPFS', error: error.message });
        }
      }

      verification.overallValid =
        verification.blockchainVerified && (verification.ipfsVerified || !evidence.ipfs_cid);

      return verification;
    } catch (error) {
      throw new Error(`Evidence verification failed: ${error.message}`);
    }
  }

  async getEvidenceProof(evidenceId) {
    try {
      const { data: evidence, error } = (await supabase
        .from('evidence')
        .select('*')
        .eq('id', evidenceId)
        .single()) || {};

      if (error || !evidence) {
        throw new Error('Evidence not found');
      }

      const proof = {
        evidence_id: evidence.id,
        file_name: evidence.name,
        hash: evidence.hash,
        ipfs_cid: evidence.ipfs_cid,
        blockchain_tx_hash: evidence.blockchain_tx_hash,
        blockchain_block_number: evidence.blockchain_block_number,
        timestamp: evidence.timestamp,
        submitted_by: evidence.submitted_by,
        verification_urls: {},
      };

      if (evidence.blockchain_tx_hash) {
        proof.verification_urls.blockchain = blockchainService.getExplorerUrl(
          evidence.blockchain_tx_hash,
        );
      }

      if (evidence.ipfs_cid) {
        proof.verification_urls.ipfs = ipfsStorageService.getGatewayUrl(evidence.ipfs_cid);
      }

      return proof;
    } catch (error) {
      throw new Error(`Failed to get evidence proof: ${error.message}`);
    }
  }

  async getSystemStatus() {
    const status = {
      blockchain: {
        enabled: false,
        initialized: false,
        network: null,
        balance: null,
        blockNumber: null,
      },
      ipfs: {
        enabled: false,
        configured: false,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      await blockchainService.initialize();
      status.blockchain.enabled = true;
      status.blockchain.initialized = blockchainService.isInitialized();
      const networkInfo = blockchainService.getNetworkInfo();
      status.blockchain.network = {
        name: networkInfo.name,
        chainId: Number(networkInfo.chainId),
        contractAddress: networkInfo.contractAddress,
        walletAddress: networkInfo.walletAddress,
      };
      status.blockchain.balance = await blockchainService.getBalance();
      status.blockchain.blockNumber = await blockchainService.getBlockNumber();
    } catch (error) {
      status.blockchain.error = error.message;
    }

    status.ipfs.enabled = true;
    status.ipfs.configured = ipfsStorageService.isConfigured();

    return status;
  }
}

module.exports = new IntegratedEvidenceService();
