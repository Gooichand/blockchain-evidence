const NETWORKS = {
  80002: {
    chainId: 80002,
    chainIdHex: '0x13882',
    name: 'Polygon Amoy Testnet',
    shortName: 'Amoy',
    rpc: 'https://rpc-amoy.polygon.technology',
    explorer: 'https://amoy.polygonscan.com',
    currency: { name: 'POL', symbol: 'POL', decimals: 18 },
    contractAddress: '0x39453ED8CF79Fe56150fe1E8348e75894e3dD9e3',
    isTestnet: true,
  },
  137: {
    chainId: 137,
    chainIdHex: '0x89',
    name: 'Polygon Mainnet',
    shortName: 'Polygon',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    currency: { name: 'POL', symbol: 'POL', decimals: 18 },
    contractAddress: null,
    isTestnet: false,
  },
};

const SUPPORTED_CHAIN_IDS = Object.keys(NETWORKS).map(Number);

function getNetworkByChainId(chainId) {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
  return NETWORKS[id] || null;
}

function getContractAddress(chainId) {
  const network = getNetworkByChainId(chainId);
  return network ? network.contractAddress : null;
}

function isSupportedNetwork(chainId) {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
  return SUPPORTED_CHAIN_IDS.includes(id);
}

function isContractDeployed(chainId) {
  return !!getContractAddress(chainId);
}

function getExplorerUrl(chainId, txHash) {
  const network = getNetworkByChainId(chainId);
  if (!network) return `https://polygonscan.com/tx/${txHash}`;
  return `${network.explorer}/tx/${txHash}`;
}

function getNetworkHelpText(chainId) {
  const network = getNetworkByChainId(chainId);
  if (!network) return 'Unsupported network. Please switch to a supported network.';
  if (!network.contractAddress) {
    return `This network is supported by the wallet connection, but the Evidence contract is not deployed here yet. Please switch to Polygon Amoy Testnet.`;
  }
  return null;
}

async function getCurrentChain() {
  if (!window.ethereum) return null;
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  } catch {
    return null;
  }
}

async function switchToNetwork(chainId) {
  if (!window.ethereum) return false;
  const network = NETWORKS[chainId];
  if (!network) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainIdHex }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      return await addNetwork(chainId);
    }
    throw switchError;
  }
}

async function addNetwork(chainId) {
  if (!window.ethereum) return false;
  const network = NETWORKS[chainId];
  if (!network) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: network.chainIdHex,
        chainName: network.name,
        nativeCurrency: network.currency,
        rpcUrls: [network.rpc],
        blockExplorerUrls: [network.explorer],
      }],
    });
    return true;
  } catch {
    return false;
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (accounts.length === 0) {
    throw new Error('No accounts found');
  }
  return accounts[0];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NETWORKS,
    SUPPORTED_CHAIN_IDS,
    getNetworkByChainId,
    getContractAddress,
    isSupportedNetwork,
    isContractDeployed,
    getExplorerUrl,
    getNetworkHelpText,
    getCurrentChain,
    switchToNetwork,
    addNetwork,
    connectWallet,
  };
}
