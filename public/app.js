// lenis-smooth-scroll
let lenis = null;

if (typeof Lenis !== "undefined") {
  try {
    lenis = new Lenis({
      smoothWheel: true,
      lerp: 0.08,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });

    const raf = (time) => {
      if (!lenis) return;
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
  } catch (e) {
    console.warn(
      "Lenis initialization failed, falling back to native scroll:",
      e
    );
    lenis = null;
  }
} else {
  console.warn("Lenis not loaded, using native scroll");
}

let userAccount;
let desktopGuard = null;

// Initialize application
function initializeApp() {
  console.log("Initializing EVID-DGC application...");

  // DesktopGuard: warn if resized below minimum width
  if (typeof DeviceDetector !== 'undefined' && DeviceDetector.DesktopGuard) {
    desktopGuard = new DeviceDetector.DesktopGuard({
      onBlocked: function(info) {
        var overlay = document.getElementById('desktopGuardOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'desktopGuardOverlay';
          overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(10,10,15,0.95);display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;text-align:center;color:#e0e0e0;';
          overlay.innerHTML = '<div style="width:64px;height:64px;margin-bottom:20px;background:linear-gradient(135deg,#d32f2f,#b71c1c);border-radius:16px;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="32" height="32" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><h2 style="margin:0 0 8px;color:#fff;">Desktop View Required</h2><p style="margin:0 0 16px;color:#9e9eb0;max-width:400px;">Please expand your browser window to at least 1024px wide to continue using EVID-DGC.</p><button onclick="window.location.href=\'desktop-only.html\'" style="background:#d32f2f;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;">Learn More</button>';
          document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
      },
      onAllowed: function() {
        var overlay = document.getElementById('desktopGuardOverlay');
        if (overlay) overlay.style.display = 'none';
      }
    });
    desktopGuard.start();
  }

  try {
    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    // Initialize components
    initializeNavigation();
    initializeScrollUp();
    initializeRoleSelection();
    initializeSections();
    initializeParticles();
    initializeFAQ();
    initializeEmailLogin();
    updateNavbarAuth();

    // Add click handler for wallet connection
    const connectBtn = document.getElementById("connectWallet");
    if (connectBtn) {
      connectBtn.onclick = connectWallet;
    }

    // Initialize forms
    const registrationForm = document.getElementById("registrationForm");
    if (registrationForm) {
      registrationForm.addEventListener("submit", handleRegistration);
    }

    // Add listeners for login plan options (replaces blocked inline onclicks)
    const planMetaMask = document.getElementById("planMetaMask");
    if (planMetaMask) {
      planMetaMask.addEventListener("click", () => scrollToSection('walletSection'));
    }

    const planEmail = document.getElementById("planEmail");
    if (planEmail) {
      planEmail.addEventListener("click", showEmailLogin);
    }

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Initialization error:", error);
    showAlert(
      "Application initialization failed. Please refresh the page.",
      "error"
    );
  }
}

// Navigation functions
function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0);
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    if (lenis) {
      lenis.scrollTo(element);
    } else {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
}

// Helper to toggle scroll state
function toggleScroll(enable) {
  if (enable) {
    document.body.classList.remove('modal-open');
    // We don't need to stop/start lenis if we use data-lenis-prevent
    // but stopping it ensures background doesn't move at all
    // however, stopping it might freeze standard scroll if not handled rights
    // Let's try JUST using body class + overscroll-behavior
    if (lenis) lenis.start();
  } else {
    document.body.classList.add('modal-open');
    if (lenis) lenis.stop(); // Stop Lenis to freeze background
  }
}

// Email login functions
function showEmailLogin() {
  console.log("Showing email login modal...");
  const modal = document.getElementById("emailLoginModal");
  if (!modal) {
    console.error("emailLoginModal element not found in DOM");
    showAlert("Email login modal not found. Please refresh the page.", "error");
    return;
  }
  modal.classList.add("active");
  toggleScroll(false);
  // Focus email input
  setTimeout(() => {
    const emailInput = document.getElementById("loginEmail");
    if (emailInput) emailInput.focus();
  }, 100);
}

function closeEmailLogin() {
  const modal = document.getElementById("emailLoginModal");
  if (modal) {
    modal.classList.remove("active");
    toggleScroll(true);
  }
}

function showEmailRegistration() {
  const modal = document.getElementById("emailRegistrationModal");
  if (modal) {
    modal.classList.add("active");
    toggleScroll(false);
  }
}

function closeEmailRegistration() {
  const modal = document.getElementById("emailRegistrationModal");
  if (modal) {
    modal.classList.remove("active");
    toggleScroll(true);
  }
}

// Email login handler
async function handleEmailLogin(event) {
  event.preventDefault();
  console.log("Handling email login...");

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  
  if (!emailInput || !passwordInput) {
    console.error("Email or password input elements not found");
    showAlert("Login form not loaded correctly. Please refresh the page.", "error");
    return;
  }

  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    showAlert("Please enter both email and password", "error");
    return;
  }

  try {
    showLoading(true, "Logging in...");

    // Ensure apiClient is available
    if (!window.apiClient) {
      console.error("apiClient not available");
      showAlert("Authentication service not loaded. Please refresh the page.", "error");
      showLoading(false);
      return;
    }

    const data = await window.apiClient.post("/auth/email/login", { email, password });

    if (data.success) {
      const walletAddress = (data.user.walletAddress || data.user.wallet_address || email).toLowerCase();
      
      // SECURITY FIX: Store in format expected by dashboards
      localStorage.setItem("currentUser", walletAddress);
      localStorage.setItem("evidUser_" + walletAddress, JSON.stringify(data.user));

      showAlert("Login successful!", "success");
      closeEmailLogin();

      // Check if admin
      const isAdmin = data.user.role === "admin" || data.user.role === 8 || data.user.role === "8";
      if (isAdmin) {
        displayAdminOptions(data.user);
        toggleSections("adminOptions");
      } else {
        displayUserInfo(data.user);
        toggleSections("alreadyRegistered");
      }
      updateNavbarAuth();
      
      // Auto-redirect if on a login-only flow
      setTimeout(() => {
          window.location.href = getDashboardUrl(data.user.role);
      }, 1000);
    }
  } catch (error) {
    console.error("Login error:", error);
    showAlert(error.message || "Login failed", "error");
  } finally {
    showLoading(false);
  }
}

// Handle email registration
async function handleEmailRegistration(event) {
  event.preventDefault();
  console.log("Handling email registration...");

  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const fullName = document.getElementById("regFullName").value;
  const role = document.getElementById("regRole").value;

  if (password !== confirmPassword) {
    showAlert("Passwords do not match.", "error");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters.", "error");
    return;
  }

  if (!fullName || !role) {
    showAlert("Please fill in all required fields.", "error");
    return;
  }

  try {
    showLoading(true, "Creating account...");

    const data = await window.apiClient.post("/auth/email/register", {
      email: email.toLowerCase().trim(),
      password,
      fullName: fullName.trim(),
      role,
      department: "General",
      jurisdiction: "General",
    });

    if (data.success) {
      const walletAddress = (data.user.walletAddress || data.user.wallet_address || email).toLowerCase();
      localStorage.setItem("currentUser", walletAddress);
      localStorage.setItem("evidUser_" + walletAddress, JSON.stringify(data.user));

      showAlert(
        "Registration successful! Redirecting to dashboard...",
        "success"
      );
      closeEmailRegistration();

      setTimeout(() => {
        window.location.href = getDashboardUrl(data.user.role);
      }, 1500);
    }
  } catch (error) {
    console.error("Registration error:", error);
    showAlert(error.message || "Registration failed", "error");
  } finally {
    showLoading(false);
  }
}

// Initialize email login functionality
function initializeEmailLogin() {
  const emailLoginForm = document.getElementById("emailLoginForm");
  if (emailLoginForm) {
    emailLoginForm.addEventListener("submit", handleEmailLogin);
  }

  const emailRegForm = document.getElementById("emailRegistrationForm");
  if (emailRegForm) {
    emailRegForm.addEventListener("submit", handleEmailRegistration);
  }

  // Add click outside to close for all modals
  setupModalClickOutside('emailLoginModal', closeEmailLogin);
  setupModalClickOutside('emailRegistrationModal', closeEmailRegistration);
  setupModalClickOutside('forgotPasswordModal', closeForgotPasswordModal);
  setupModalClickOutside('errorModal', closeErrorModal);
}

// Helper function to setup click outside to close modal
function setupModalClickOutside(modalId, closeFunction) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.addEventListener('click', function (event) {
      // Only close if clicking directly on the modal backdrop, not the content
      if (event.target === modal) {
        closeFunction();
      }
    });
  }
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const wrapper = input.closest('.password-input-wrapper');
  if (!wrapper) return;
  
  const toggleBtn = wrapper.querySelector('.password-toggle-btn');
  if (!toggleBtn) return;
  
  const icon = toggleBtn.querySelector('svg');

  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  if (icon) {
    icon.setAttribute(
      "data-lucide",
      isPassword ? "eye-off" : "eye"
    );
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Wallet connection
async function connectWallet() {
  console.log("Attempting to connect wallet...");
  closeErrorModal();

  if (!navigator.onLine) {
    showErrorModal(
      "No Internet Connection",
      "Please check your network settings and try again."
    );
    return;
  }

  const connectBtn = document.getElementById("connectWallet");
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<i data-lucide="loader"></i> Connecting...';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  try {
    showLoading(true, "Connecting to MetaMask...");

    if (!window.ethereum) {
      showLoading(false);
      resetConnectButton();
      showErrorModal(
        "MetaMask Not Found",
        "MetaMask is not installed. Please install it to use this application.",
        "Install MetaMask",
        () => window.open("https://metamask.io/download/", "_blank")
      );
      return;
    }

    userAccount = await walletManager.connect();
    console.log("Wallet connected:", userAccount);

    if (!walletManager.isSupportedNetwork()) {
      showLoading(false);
      resetConnectButton();
      showWrongNetworkUI();
      return;
    }

    if (!walletManager.isContractDeployed()) {
      localStorage.setItem("wasConnected", "true");
      showLoading(false);
      updateWalletUI();
      showNoContractBanner();
      return;
    }

    localStorage.setItem("wasConnected", "true");

    updateWalletUI();
    removeNetworkBanner();
    await checkRegistrationStatus();
    showLoading(false);
  } catch (error) {
    showLoading(false);
    console.error("Wallet connection error:", error);

    // Handle MetaMask "already pending" error
    if (error.code === -32002 || error.message?.includes('already pending')) {
      showAlert('MetaMask connection already pending. Please check MetaMask popup.', 'warning');
      // Wait and retry once
      setTimeout(async () => {
        try {
          showLoading(true, "Retrying connection...");
          userAccount = await walletManager.connect();
          if (!walletManager.isSupportedNetwork()) {
            showLoading(false);
            resetConnectButton();
            showWrongNetworkUI();
            return;
          }
          if (!walletManager.isContractDeployed()) {
            localStorage.setItem("wasConnected", "true");
            showLoading(false);
            updateWalletUI();
            showNoContractBanner();
            return;
          }
          localStorage.setItem("wasConnected", "true");
          updateWalletUI();
          removeNetworkBanner();
          await checkRegistrationStatus();
          showLoading(false);
        } catch (retryError) {
          showLoading(false);
          resetConnectButton();
          console.error("Retry failed:", retryError);
          showErrorModal("Connection Failed", retryError.message || "Retry failed");
        }
      }, 1500);
      return;
    }

    if (error.code === 4001) {
      resetConnectButton();
      showErrorModal(
        "Connection Rejected",
        "You rejected the connection request. This app requires a wallet connection to function.",
        "Try Again",
        connectWallet
      );
    } else if (error.message === "MetaMask not installed") {
      resetConnectButton();
      showErrorModal(
        "MetaMask Not Found",
        "MetaMask is not installed. Please install it to use this application.",
        "Install MetaMask",
        () => window.open("https://metamask.io/download/", "_blank")
      );
    } else {
      resetConnectButton();
      showErrorModal(
        "Connection Failed",
        error.message || "An unexpected error occurred."
      );
    }
  }
}

function resetConnectButton() {
  const connectBtn = document.getElementById("connectWallet");
  if (connectBtn) {
    connectBtn.disabled = false;
    connectBtn.innerHTML = '<i data-lucide="link"></i> Connect MetaMask';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function updateWalletUI() {
  const walletAddr = document.getElementById("walletAddress");
  const walletStatus = document.getElementById("walletStatus");
  const connectBtn = document.getElementById("connectWallet");

  if (walletAddr) {
    walletAddr.textContent = userAccount;
  }

  if (walletStatus) {
    walletStatus.classList.remove("hidden");
  }

  if (connectBtn) {
    connectBtn.innerHTML = '<i data-lucide="check"></i> Connected';
    connectBtn.disabled = true;
    connectBtn.classList.add("btn-success");
    lucide.createIcons();
  }

  updateNetworkBadge();
  updateWalletNetworkInfo();
}

function updateWalletNetworkInfo() {
  const el = document.getElementById('walletNetworkInfo');
  if (!el) return;

  const network = walletManager.getNetwork();
  if (!network) {
    el.innerHTML = '<span class="label">Network:</span> <span style="color:#dc3545;">Unknown</span>';
    return;
  }

  const deployed = walletManager.isContractDeployed();
  el.innerHTML = `
    <span class="label">Network:</span>
    <span class="network-name-tag ${network.isTestnet ? 'amoy' : 'mainnet'}">${network.shortName}</span>
    <span class="label">Chain ID:</span>
    <code>${network.chainId}</code>
    <span class="label">Contract:</span>
    <span style="color:${deployed ? '#28a745' : '#dc3545'};">${deployed ? 'Deployed' : 'Not Available'}</span>
    ${!deployed ? '<span style="color:#856404;font-size:0.8rem;margin-left:8px;">Switch to Polygon Amoy to use blockchain features</span>' : ''}
  `;
}

function updateNetworkBadge() {
  const badgeArea = document.getElementById("networkBadge");
  if (!badgeArea) return;

  const network = walletManager.getNetwork();
  if (!network) {
    badgeArea.innerHTML = '<span class="wallet-badge wrong-network">Unsupported Network</span>';
    return;
  }

  const contractDeployed = walletManager.isContractDeployed();
  const tagClass = network.isTestnet ? 'amoy' : 'mainnet';

  badgeArea.innerHTML = `
    <span class="wallet-badge connected">
      <span>${userAccount ? userAccount.slice(0, 6) + '...' + userAccount.slice(-4) : ''}</span>
      <span class="network-name-tag ${tagClass}">${network.shortName}</span>
      ${contractDeployed ? '<span style="color:#28a745;font-size:0.75rem;">✓ Contract Active</span>' : '<span style="color:#dc3545;font-size:0.75rem;">✗ No Contract</span>'}
    </span>
  `;
}

function showWrongNetworkUI() {
  const chainId = walletManager.chainId;
  const network = getNetworkByChainId(chainId);
  const networkName = network ? network.name : 'Unknown Network (Chain ID: ' + chainId + ')';

  showErrorModal(
    "Unsupported Network",
    `Connected to ${networkName}.<br><br>This application supports:
    <ul style="text-align:left;margin-top:8px;">
      <li><strong>Polygon Amoy Testnet</strong> (Contract Deployed)</li>
      <li><strong>Polygon Mainnet</strong> (Supported, No Contract Yet)</li>
    </ul>`,
    "Switch to Polygon Amoy",
    () => switchNetwork(80002)
  );
}

function showNoContractBanner() {
  showNetworkBanner('error', [
    'Connected to ' + (walletManager.getNetwork()?.name || 'Unknown') + '. ',
    'This network is supported by the wallet connection, but the Evidence contract is not deployed here yet.',
  ], [
    { text: 'Switch to Polygon Amoy Testnet', chainId: 80002 },
  ]);
}

function showNetworkBanner(type, messages, switchButtons) {
  removeNetworkBanner();
  const banner = document.createElement('div');
  banner.id = 'networkBanner';
  banner.className = 'network-banner ' + type;

  const content = document.createElement('span');
  content.textContent = messages.join(' ');
  banner.appendChild(content);

  if (switchButtons) {
    switchButtons.forEach(btn => {
      const btnEl = document.createElement('button');
      btnEl.className = 'banner-btn';
      btnEl.textContent = btn.text;
      btnEl.onclick = async () => {
        try {
          const switched = await switchToNetwork(btn.chainId);
          if (switched) {
            await refreshWalletState();
          }
        } catch (e) {
          showAlert('Failed to switch network: ' + e.message, 'error');
        }
      };
      banner.appendChild(btnEl);
    });
  }

  document.body.insertBefore(banner, document.body.firstChild);
  if (document.querySelector('.container')) {
    document.querySelector('.container').style.marginTop = '50px';
  }
}

function removeNetworkBanner() {
  const existing = document.getElementById('networkBanner');
  if (existing) existing.remove();
  if (document.querySelector('.container')) {
    document.querySelector('.container').style.marginTop = '';
  }
}

async function switchNetwork(chainId) {
  showLoading(true, 'Switching network...');
  try {
    const switched = await switchToNetwork(chainId);
    if (switched) {
      await refreshWalletState();
    }
  } catch (error) {
    console.error('Network switch failed:', error);
    showAlert('Failed to switch network: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function refreshWalletState() {
  userAccount = walletManager.account;
  const chainId = await getCurrentChain();
  walletManager.chainId = chainId;

  removeNetworkBanner();

  if (!walletManager.isSupportedNetwork()) {
    showWrongNetworkUI();
    return;
  }

  if (!walletManager.isContractDeployed()) {
    updateWalletUI();
    showNoContractBanner();
    return;
  }

  updateWalletUI();
}

// Check registration status
async function checkRegistrationStatus() {
  console.log("Checking registration status for:", userAccount);

  if (!userAccount) {
    showAlert("Please connect your wallet first", "error");
    return;
  }

  try {
    showLoading(true, "Checking registration...");

    // Use skipAuth since this is a read-only lookup — no MetaMask signature needed
    const data = await window.apiClient.get(`/users/wallet/${userAccount}`, { skipAuth: true });

    if (data.user) {
      console.log("Found existing user:", data.user);

      const walletAddr = userAccount.toLowerCase();
      // Store in dashboard-compatible format - ensure role is preserved
      const userToStore = {
        ...data.user,
        walletAddress: walletAddr,
        wallet_address: walletAddr,
        role: data.user.role,
      };
      localStorage.setItem("currentUser", walletAddr);
      localStorage.setItem("evidUser_" + walletAddr, JSON.stringify(userToStore));

      displayUserInfo(data.user);

      const isAdmin = data.user.role === "admin" || data.user.role === 8 || data.user.role === "8";
      if (isAdmin) {
        displayAdminOptions(data.user);
        toggleSections("adminOptions");
      } else {
        toggleSections("alreadyRegistered");
      }
      updateNavbarAuth();
    } else {
      console.log("No existing user found, showing registration");
      toggleSections("registration");
    }
  } catch (error) {
    console.error("Error checking registration:", error);
    // If user not found (404), show registration
    if (error.status === 404) {
        toggleSections("registration");
    } else {
        showAlert("Error checking registration status: " + error.message, "error");
        toggleSections("registration");
    }
  } finally {
    showLoading(false);
  }
}

function displayAdminOptions(userData) {
  const userName = document.getElementById("adminUserName");
  const userRoleName = document.getElementById("adminUserRoleName");

  if (userName) {
    userName.textContent = userData.fullName || "Administrator";
  }

  if (userRoleName) {
    userRoleName.textContent = "Administrator";
  }
}

function displayUserInfo(userData) {
  const userName = document.getElementById("userName");
  const userRoleName = document.getElementById("userRoleName");

  if (userName) {
    userName.textContent = userData.full_name || userData.fullName || "User";
  }

  if (userRoleName) {
    const roleName = userData.role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    userRoleName.textContent = roleName;
  }
}

function updateNavbarAuth() {
  const loginBtn = document.getElementById('navLoginBtn');
  const dashboardBtn = document.getElementById('navDashboardBtn');
  const logoutBtn = document.getElementById('navLogoutBtn');

  if (!loginBtn || !dashboardBtn || !logoutBtn) return;

  const currentUser = localStorage.getItem('currentUser');

  if (currentUser) {
    loginBtn.classList.add('hidden');
    dashboardBtn.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');

    // Ensure buttons have correct display style since valid-hidden might enforce display:none
    dashboardBtn.style.display = 'inline-flex';
    logoutBtn.style.display = 'inline-flex';
    loginBtn.style.display = 'none';
  } else {
    loginBtn.classList.remove('hidden');
    dashboardBtn.classList.add('hidden');
    logoutBtn.classList.add('hidden');

    loginBtn.style.display = 'inline-flex';
    dashboardBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

function toggleSections(active) {
  const sections = [
    "wallet",
    "registration",
    "alreadyRegistered",
    "adminOptions",
  ];

  sections.forEach((id) => {
    const element = document.getElementById(id + "Section");
    if (element) {
      element.classList.toggle("hidden", id !== active);
    }
  });
}

// Registration handler
async function handleRegistration(event) {
  event.preventDefault();

  try {
    const role = document.getElementById("userRole")?.value;
    const fullName = document.getElementById("fullName")?.value;
    const badgeNumber = document.getElementById("badgeNumber")?.value;
    const department = document.getElementById("department")?.value;
    const jurisdiction = document.getElementById("jurisdiction")?.value;

    if (!role || !fullName) {
      showAlert("Please select a role and enter your full name.", "error");
      return;
    }

    if (!userAccount) {
      showAlert("Please connect your wallet first.", "error");
      return;
    }

    showLoading(true, "Registering user...");

    // Notify user about MetaMask signature request
    showAlert("Please sign the message in MetaMask to complete registration", "info");

    const data = await window.apiClient.post("/auth/wallet/register", {
      walletAddress: userAccount.toLowerCase(),
      fullName: fullName.trim(),
      role: role,
      badgeNumber: badgeNumber || "",
      department: department || "General",
      jurisdiction: jurisdiction || "General",
    });

    if (data.success) {
      const walletAddr = userAccount.toLowerCase();
      localStorage.setItem("currentUser", walletAddr);
      localStorage.setItem("evidUser_" + walletAddr, JSON.stringify(data.user));

      showAlert(
        "Registration successful! Redirecting to dashboard...",
        "success"
      );

      setTimeout(() => {
        window.location.href = getDashboardUrl(data.user.role);
      }, 2000);
      updateNavbarAuth();
    }
  } catch (error) {
    console.error("Registration failed:", error);
    showAlert(error.message || "Registration failed", "error");
  } finally {
    showLoading(false);
  }
}

// Navigation functions
function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToAdminDashboard() {
  window.location.href = "admin.html";
}

function logout() {
  localStorage.clear();
  userAccount = null;

  const walletStatus = document.getElementById("walletStatus");
  const connectBtn = document.getElementById("connectWallet");

  if (walletStatus) walletStatus.classList.add("hidden");
  if (connectBtn) {
    connectBtn.innerHTML = '<i data-lucide="link"></i> Connect MetaMask';
    connectBtn.disabled = false;
    connectBtn.classList.remove("btn-success");
    lucide.createIcons();
  }

  initializeSections();
  updateNavbarAuth();
  showAlert("Logged out successfully", "info");
}

function disconnectWallet() {
  userAccount = null;
  walletManager.disconnect();
  localStorage.removeItem("wasConnected");
  removeNetworkBanner();

  const badgeArea = document.getElementById("networkBadge");
  if (badgeArea) badgeArea.innerHTML = '';

  const walletStatus = document.getElementById("walletStatus");
  const connectBtn = document.getElementById("connectWallet");

  if (walletStatus) walletStatus.classList.add("hidden");
  if (connectBtn) {
    connectBtn.innerHTML = '<i data-lucide="link"></i> Connect MetaMask';
    connectBtn.disabled = false;
    connectBtn.classList.remove("btn-success");
    lucide.createIcons();
  }

  initializeSections();
  updateNavbarAuth();
  showAlert("Wallet disconnected successfully", "info");
}

// Initialize sections
function initializeSections() {
  const sections = [
    "walletStatus",
    "registrationSection",
    "alreadyRegisteredSection",
    "adminOptionsSection",
  ];
  sections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.add("hidden");
    }
  });

  const walletSection = document.getElementById("walletSection");
  if (walletSection) {
    walletSection.classList.remove("hidden");
  }
}

// Initialize navigation (Redundant: now handled by HeaderManager in header.js)
function initializeNavigation() {
  console.log("Navigation handlers handled by HeaderManager");
  /*
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");

      const icon = menuToggle.querySelector("i");
     if(icon){
      if (navMenu.classList.contains("active")) {
        icon.setAttribute("data-lucide", "x");
      } else {
        icon.setAttribute("data-lucide", "menu");
      }
      lucide.createIcons();
     }
         
    });

    document.addEventListener("click", (e) => {
      if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove("active");
        const icon = menuToggle.querySelector("svg");
        if(icon){
            icon.setAttribute("data-lucide", "menu");
        lucide.createIcons();
        }
      }
    });
  }
  */
}

// Initialize scroll up button
function initializeScrollUp() {
  const scrollBtn = document.getElementById("scrollUpBtn");

  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.add("visible");
      } else {
        scrollBtn.classList.remove("visible");
      }
    });

    scrollBtn.addEventListener("click", () => {
      scrollToTop();
    });
  }
}

// Initialize role selection
function initializeRoleSelection() {
  const roleCards = document.querySelectorAll(".role-card");
  const userRoleInput = document.getElementById("userRole");

  roleCards.forEach((card) => {
    card.addEventListener("click", () => {
      roleCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");

      const roleValue = card.getAttribute("data-role");
      if (userRoleInput) {
        userRoleInput.value = roleValue;
      }
    });
  });
}

// Initialize particles
function initializeParticles() {
  const particlesContainer = document.getElementById("particles");
  if (!particlesContainer) return;

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 25 + "s";
    particle.style.animationDuration = Math.random() * 10 + 15 + "s";
    particlesContainer.appendChild(particle);
  }
}

// Initialize FAQ
function initializeFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (question) {
      question.addEventListener("click", () => {
        item.classList.toggle("active");
        lucide.createIcons();
      });
    }
  });
}

// Loading functions
function showLoading(show, message = "Loading...") {
  const loader = document.getElementById("loader");
  if (loader) {
    if (show) {
      loader.classList.remove("hidden");
    } else {
      loader.classList.add("hidden");
    }
  }
}

// Alert system
function showAlert(message, type = "info") {
  const existingAlerts = document.querySelectorAll(".alert");
  existingAlerts.forEach((alert) => alert.remove());

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;

  // Add accessibility attributes for screen readers
  // Use role="alert" for urgent messages (errors/warnings) - announces immediately
  // Use role="status" for informational messages - announces politely
  if (type === "error" || type === "warning") {
    alert.setAttribute("role", "alert");
    alert.setAttribute("aria-live", "assertive");
  } else {
    alert.setAttribute("role", "status");
    alert.setAttribute("aria-live", "polite");
  }

  alert.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="${getAlertIcon(
    type
  )}" style="width: 16px; height: 16px;" aria-hidden="true"></i>
            <span>${message}</span>
        </div>
    `;

  document.body.appendChild(alert);

  lucide.createIcons();

  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 5000);

  alert.addEventListener("click", () => {
    alert.remove();
  });
}

function getAlertIcon(type) {
  const icons = {
    success: "check-circle",
    error: "x-circle",
    warning: "alert-triangle",
    info: "info",
  };
  return icons[type] || "info";
}

// Error modal functions
function showErrorModal(
  title,
  description,
  actionText = null,
  actionCallback = null
) {
  const modal = document.getElementById("errorModal");
  const titleEl = document.getElementById("errorTitle");
  const descEl = document.getElementById("errorDescription");
  const actionBtn = document.getElementById("errorActionBtn");

  if (modal && titleEl && descEl) {
    titleEl.textContent = title;
    descEl.innerHTML = description;

    if (actionText && actionCallback) {
      actionBtn.textContent = actionText;
      actionBtn.onclick = actionCallback;
      actionBtn.classList.remove("hidden");
    } else {
      actionBtn.classList.add("hidden");
    }
    modal.classList.add("active");
    if (typeof toggleScroll === 'function') toggleScroll(false);
    else document.body.classList.add("modal-open");
  } else {
    showAlert(`${title}: ${description}`, "error");
  }
}

function closeErrorModal() {
  const modal = document.getElementById("errorModal");
  if (modal) {
    modal.classList.remove("active");
    if (typeof toggleScroll === 'function') toggleScroll(true);
    else document.body.classList.remove("modal-open");
  }
}

// Ethereum event listeners
if (window.ethereum) {
  walletManager.onAccountChange((account) => {
    if (!account) {
      disconnectWallet();
    } else {
      userAccount = account;
      refreshWalletState();
    }
  });

  walletManager.onChainChange(() => {
    refreshWalletState();
  });
}

// Helper function to get dashboard URL based on role
function getDashboardUrl(role) {
  const dashboardMap = {
    'admin': 'admin.html',
    '1': 'dashboard-public.html',
    '2': 'dashboard-investigator.html',
    '3': 'dashboard-analyst.html',
    '4': 'dashboard-legal.html',
    '5': 'dashboard-court.html',
    '6': 'dashboard-manager.html',
    '7': 'dashboard-auditor.html',
    '8': 'admin.html'
  };

  // Convert numeric roles to strings for mapping
  const roleKey = String(role).toLowerCase();
  return dashboardMap[roleKey] || 'dashboard.html';
}

// Global exports
window.EVID_DGC = {
  connectWallet,
  disconnectWallet,
  logout,
  showAlert,
  scrollToSection,
  handleEmailRegistration,
  handleEmailLogin,
};

// Global error handlers
window.addEventListener("error", function (event) {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});
