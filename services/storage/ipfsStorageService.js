const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const https = require('https');

// Render (and some PaaS) egress can hang on IPv6 routes to api.pinata.cloud -
// the connection then times out instead of failing fast. Force IPv4 for Pinata.
const pinataHttpsAgent = new https.Agent({ family: 4, keepAlive: true });

class IPFSStorageService {
  constructor() {
    this.pinataJWT = process.env.PINATA_JWT;
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
    this.maxRetries = 3;
  }

  async uploadFile(fileBuffer, fileName, metadata = {}) {
    if (!this.pinataJWT) {
      throw new Error('IPFS service not configured. Set PINATA_JWT in .env');
    }

    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error('File must be a Buffer');
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/octet-stream',
    });

    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        fileHash: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
      },
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', pinataOptions);

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          formData,
          {
            maxBodyLength: Infinity,
            httpsAgent: pinataHttpsAgent,
            headers: {
              ...formData.getHeaders(),
              // Cloudflare/Pinata hangs on chunked multipart from some egress
              // paths; an explicit Content-Length makes the POST complete.
              'Content-Length': formData.getLengthSync(),
              Authorization: `Bearer ${this.pinataJWT}`,
            },
            timeout: 60000,
          },
        );

        return {
          cid: response.data.IpfsHash,
          size: response.data.PinSize,
          timestamp: response.data.Timestamp,
          isDuplicate: response.data.isDuplicate || false,
        };
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(`IPFS upload failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  async getFile(cid) {
    if (!cid) {
      throw new Error('CID is required');
    }

    const url = `${this.gateway}${cid}`;

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to retrieve file from IPFS: ${error.message}`);
    }
  }

  async pinStatus(cid) {
    if (!this.pinataJWT) {
      throw new Error('IPFS service not configured');
    }

    try {
      const response = await axios.get(
        `https://api.pinata.cloud/pinning/pinJobs?ipfs_pin_hash=${cid}`,
        {
          httpsAgent: pinataHttpsAgent,
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${this.pinataJWT}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get pin status: ${error.message}`);
    }
  }

  async unpinFile(cid) {
    if (!this.pinataJWT) {
      throw new Error('IPFS service not configured');
    }

    try {
      await axios.delete(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
        httpsAgent: pinataHttpsAgent,
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${this.pinataJWT}`,
        },
      });
      return { success: true, cid };
    } catch (error) {
      throw new Error(`Failed to unpin file: ${error.message}`);
    }
  }

  async listPins(limit = 10, offset = 0) {
    if (!this.pinataJWT) {
      throw new Error('IPFS service not configured');
    }

    try {
      const response = await axios.get(
        `https://api.pinata.cloud/data/pinList?pageLimit=${limit}&pageOffset=${offset}`,
        {
          httpsAgent: pinataHttpsAgent,
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${this.pinataJWT}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list pins: ${error.message}`);
    }
  }

  getGatewayUrl(cid) {
    return `${this.gateway}${cid}`;
  }

  validateCID(cid) {
    const cidRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^b[A-Za-z2-7]{58}$/;
    return cidRegex.test(cid);
  }

  isConfigured() {
    return !!this.pinataJWT;
  }
}

module.exports = new IPFSStorageService();
