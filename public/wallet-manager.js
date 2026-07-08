class WalletManager {
  constructor() {
    this.account = null;
    this.chainId = null;
    this.listeners = [];
    this._listenersSetup = false;
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const silentAccounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (silentAccounts.length > 0) {
      this.account = silentAccounts[0];
      this.chainId = await getCurrentChain();
      this._setupListeners();
      return this.account;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }
    this.account = accounts[0];
    this.chainId = await getCurrentChain();
    this._setupListeners();
    return this.account;
  }

  disconnect() {
    this.account = null;
    this.chainId = null;
  }

  getContractAddress() {
    return getContractAddress(this.chainId);
  }

  isContractDeployed() {
    return isContractDeployed(this.chainId);
  }

  isSupportedNetwork() {
    return isSupportedNetwork(this.chainId);
  }

  getNetwork() {
    return getNetworkByChainId(this.chainId);
  }

  getNetworkHelpText() {
    return getNetworkHelpText(this.chainId);
  }

  async switchNetwork(chainId) {
    const ok = await switchToNetwork(chainId);
    if (ok) {
      this.chainId = await getCurrentChain();
    }
    return ok;
  }

  onAccountChange(cb) { this.listeners.push({ type: 'account', cb }); }

  onChainChange(cb) { this.listeners.push({ type: 'chain', cb }); }

  _setupListeners() {
    if (this._listenersSetup || !window.ethereum) return;
    this._listenersSetup = true;
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
        this.listeners.filter(l => l.type === 'account').forEach(l => l.cb(null));
      } else {
        this.account = accounts[0];
        this.listeners.filter(l => l.type === 'account').forEach(l => l.cb(this.account));
      }
    });
    window.ethereum.on('chainChanged', (chainIdHex) => {
      this.chainId = parseInt(chainIdHex, 16);
      this.listeners.filter(l => l.type === 'chain').forEach(l => l.cb(this.chainId));
    });
  }
}

const walletManager = new WalletManager();
