class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
    this.contractABI = null;
  }

  async initialize(chainId) {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    const cid = chainId || await getCurrentChain();
    this.contractAddress = getContractAddress(cid);
    if (!this.contractAddress) {
      throw new Error('Contract not deployed on this network');
    }

    const response = await fetch('/api/blockchain/config');
    const config = await response.json();
    this.contractABI = config.abi;

    this.contract = new ethers.Contract(
      this.contractAddress,
      this.contractABI,
      this.signer
    );
  }

  async storeEvidence(fileHash, metadata) {
    if (!this.contract) await this.initialize();
    const tx = await this.contract.storeEvidence(fileHash, JSON.stringify(metadata));
    return { hash: tx.hash, wait: () => tx.wait() };
  }

  async verifyHash(fileHash) {
    if (!this.contract) await this.initialize();
    const result = await this.contract.verifyHash(fileHash);
    return { exists: result[0], evidenceId: result[1].toString() };
  }

  async getEvidence(evidenceId) {
    if (!this.contract) await this.initialize();
    const evidence = await this.contract.getEvidence(evidenceId);
    return {
      fileHash: evidence[0],
      metadata: JSON.parse(evidence[1]),
      uploadedBy: evidence[2],
      timestamp: Number(evidence[3]),
      isSealed: evidence[4],
    };
  }

  getExplorerUrl(txHash, chainId) {
    return getExplorerUrl(chainId || walletManager.chainId, txHash);
  }

  async getChainId() {
    if (!this.provider) await this.initialize();
    return (await this.provider.getNetwork()).chainId;
  }
}

window.blockchainService = new BlockchainService();
