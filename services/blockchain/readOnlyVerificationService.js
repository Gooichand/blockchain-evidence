const { ethers } = require('ethers');
const abi = require('../../contracts/EvidenceStorage.abi.json');

// Verification never constructs a wallet or reads PRIVATE_KEY.
class ReadOnlyVerificationService {
  async initialize() {
    const rpc = process.env.POLYGON_RPC_URL;
    const address = process.env.CONTRACT_ADDRESS;
    if (!rpc || !address || !ethers.isAddress(address)) throw new Error('Read-only blockchain configuration missing or invalid.');
    if (!this.provider || rpc !== this.rpc || address !== this.address) {
      if (this.provider) this.provider.destroy();
      const request = new ethers.FetchRequest(rpc);
      request.timeout = 10000;
      this.provider = new ethers.JsonRpcProvider(request);
      this.contract = new ethers.Contract(address, abi, this.provider);
      this.rpc = rpc;
      this.address = address;
    }
  }
}
module.exports = new ReadOnlyVerificationService();
