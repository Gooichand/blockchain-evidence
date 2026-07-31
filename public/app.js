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

    // ── Session Restoration ──
    // If user already has an auth token, redirect to their dashboard
    const savedUser = localStorage.getItem("currentUser");
    const authToken = localStorage.getItem("authToken");
    if (savedUser && authToken) {
      const userData = JSON.parse(localStorage.getItem("evidUser_" + savedUser) || "{}");
      const role = userData.role;
      if (role) {
        const dashboardUrl = getDashboardUrl(role);
        // Only redirect if not already on a dashboard page
        const path = window.location.pathname;
        if (!path.includes('dashboard') && !path.includes('admin') && !path.includes('login')) {
          console.log("Existing session found. Redirecting to:", dashboardUrl);
          window.location.href = dashboardUrl;
          return;
        }
      }
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

    // ── Login Modal Bindings ──
    // Hero button opens modal
    const heroLoginBtn = document.querySelector('.btn-hero-primary[onclick*="openLoginModal"]');
    if (heroLoginBtn) {
      heroLoginBtn.removeAttribute('onclick');
      heroLoginBtn.addEventListener('click', (e) => { e.preventDefault(); openLoginModal(); });
    }

    // Close button
    const loginCloseBtn = document.getElementById('loginCloseBtn');
    if (loginCloseBtn) {
      loginCloseBtn.addEventListener('click', closeLoginModal);
    }

    // Overlay backdrop click
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
      loginOverlay.addEventListener('click', (e) => {
        if (e.target === loginOverlay) closeLoginModal();
      });
    }

    // "Login with Email" expand button
    const showEmailFormBtn = document.getElementById('loginShowEmailForm');
    const emailFormWrap = document.getElementById('loginEmailFormWrap');
    if (showEmailFormBtn && emailFormWrap) {
      showEmailFormBtn.addEventListener('click', () => {
        emailFormWrap.classList.toggle('expanded');
        if (emailFormWrap.classList.contains('expanded')) {
          setTimeout(() => {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) emailInput.focus();
          }, 350);
        }
      });
    }

    // MetaMask connect
    const loginConnectBtn = document.getElementById('loginConnectWallet');
    if (loginConnectBtn) {
      loginConnectBtn.addEventListener('click', async () => {
        loginConnectBtn.classList.add('loading');
        try {
          await connectWallet();
          refreshLoginWalletUI();
        } finally {
          loginConnectBtn.classList.remove('loading');
        }
      });
    }

    // Wallet disconnect
    const loginDisconnectBtn = document.getElementById('loginDisconnectWallet');
    if (loginDisconnectBtn) {
      loginDisconnectBtn.addEventListener('click', () => {
        disconnectWallet();
        refreshLoginWalletUI();
      });
    }

    // Email form submit
    const emailLoginForm = document.getElementById('emailLoginForm');
    if (emailLoginForm) {
      emailLoginForm.addEventListener('submit', handleEmailLogin);
    }

    // Registration form submit
    const regForm = document.getElementById('emailRegistrationForm');
    if (regForm) {
      regForm.addEventListener('submit', handleEmailRegistration);
    }

    // Forgot password form
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail')?.value;
        if (!email) return;
        try {
          await window.apiClient.post('/auth/forgot-password', { email });
          showAlert('Password reset link sent!', 'success');
          closeForgotPasswordModal();
        } catch (err) {
          showAlert(err.message || 'Failed to send reset link', 'error');
        }
      });
    }

    // Sub-modal backdrop clicks
    setupSubModalBackdrop('forgotPasswordOverlay', closeForgotPasswordModal);
    setupSubModalBackdrop('registrationOverlay', closeRegistrationModal);
    setupSubModalBackdrop('errorOverlay', closeErrorModal);

    // Add click handler for wallet connection (legacy page button)
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

// ═══════════════════════════════════════════════════════════════
// Premium Login Modal
// ═══════════════════════════════════════════════════════════════

let _loginModalFocusTrap = null;

function openLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  if (!overlay) return;

  overlay.classList.add('active');
  overlay.classList.remove('closing');
  document.body.classList.add('login-modal-open');
  if (typeof lenis !== 'undefined' && lenis) lenis.stop();

  // Detect MetaMask
  const mmMissing = document.getElementById('loginMetaMaskMissing');
  const mmBtn = document.getElementById('loginConnectWallet');
  if (!window.ethereum) {
    if (mmMissing) mmMissing.style.display = 'block';
    if (mmBtn) mmBtn.style.display = 'none';
  } else {
    if (mmMissing) mmMissing.style.display = 'none';
    if (mmBtn) mmBtn.style.display = '';
  }

  // Check if already connected
  refreshLoginWalletUI();

  // Focus first focusable
  setTimeout(() => {
    const first = overlay.querySelector('.login-close, .login-card-btn, input, button:not(.login-close)');
    if (first) first.focus();
  }, 100);

  // Re-init icons
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Setup focus trap
  _loginModalFocusTrap = overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') trapFocus(e, overlay);
  });
}

function closeLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  if (!overlay) return;

  overlay.classList.add('closing');
  setTimeout(() => {
    overlay.classList.remove('active', 'closing');
    document.body.classList.remove('login-modal-open');
    if (typeof lenis !== 'undefined' && lenis) lenis.start();
    // Close any open sub-modals
    closeForgotPasswordModal();
    closeRegistrationModal();
    closeErrorModal();
    // Reset email form
    const formWrap = document.getElementById('loginEmailFormWrap');
    if (formWrap) formWrap.classList.remove('expanded');
  }, 250);

  if (_loginModalFocusTrap) {
    overlay.removeEventListener('keydown', _loginModalFocusTrap);
    _loginModalFocusTrap = null;
  }
}

function refreshLoginWalletUI() {
  const connected = document.getElementById('loginWalletConnected');
  const addr = document.getElementById('loginWalletAddress');
  const btn = document.getElementById('loginConnectWallet');
  if (userAccount && connected && addr) {
    connected.classList.add('show');
    addr.textContent = userAccount;
    if (btn) btn.style.display = 'none';
  } else {
    if (connected) connected.classList.remove('show');
    if (btn && window.ethereum) btn.style.display = '';
  }
}

function trapFocus(e, container) {
  const focusable = container.querySelectorAll(
    'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

// Esc key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const errorOv = document.getElementById('errorOverlay');
    const regOv = document.getElementById('registrationOverlay');
    const forgotOv = document.getElementById('forgotPasswordOverlay');
    const loginOv = document.getElementById('loginOverlay');

    if (errorOv && errorOv.classList.contains('active')) { closeErrorModal(); return; }
    if (regOv && regOv.classList.contains('active')) { closeRegistrationModal(); return; }
    if (forgotOv && forgotOv.classList.contains('active')) { closeForgotPasswordModal(); return; }
    if (loginOv && loginOv.classList.contains('active')) { closeLoginModal(); return; }
  }
});

// Sub-modal helpers
function openForgotPasswordModal() {
  const ov = document.getElementById('forgotPasswordOverlay');
  if (ov) { ov.classList.add('active'); if (typeof lucide !== 'undefined') lucide.createIcons(); }
}

function closeForgotPasswordModal() {
  const ov = document.getElementById('forgotPasswordOverlay');
  if (ov) ov.classList.remove('active');
}

function openRegistrationModal() {
  const ov = document.getElementById('registrationOverlay');
  if (ov) { ov.classList.add('active'); if (typeof lucide !== 'undefined') lucide.createIcons(); }
}

function closeRegistrationModal() {
  const ov = document.getElementById('registrationOverlay');
  if (ov) ov.classList.remove('active');
}

function showErrorModal(title, description, actionText, actionCallback) {
  const ov = document.getElementById('errorOverlay');
  const titleEl = document.getElementById('errorModalTitle');
  const descEl = document.getElementById('errorModalDescription');
  const actionBtn = document.getElementById('errorModalActionBtn');

  if (ov && titleEl && descEl) {
    titleEl.textContent = title;
    descEl.innerHTML = description;
    if (actionText && actionCallback) {
      actionBtn.textContent = actionText;
      actionBtn.onclick = () => { actionCallback(); closeErrorModal(); };
      actionBtn.style.display = '';
    } else {
      actionBtn.style.display = 'none';
    }
    ov.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } else {
    showAlert(`${title}: ${description}`, 'error');
  }
}

function closeErrorModal() {
  const ov = document.getElementById('errorOverlay');
  if (ov) ov.classList.remove('active');
}

// Legacy aliases (kept for backward compat)
function showEmailLogin() { openLoginModal(); }
function closeEmailLogin() { closeLoginModal(); }
function showEmailRegistration() { openRegistrationModal(); }
function closeEmailRegistration() { closeRegistrationModal(); }

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

    const data = await window.apiClient.post("/auth/email/login", { email, password }, { skipAuth: true });

    if (data.success) {
      const walletAddress = (data.user.walletAddress || data.user.wallet_address || email).toLowerCase();
      
      // Store session data
      const userToStore = {
        ...data.user,
        walletAddress: walletAddress,
        wallet_address: walletAddress,
      };
      localStorage.setItem("currentUser", walletAddress);
      localStorage.setItem("evidUser_" + walletAddress, JSON.stringify(userToStore));
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      // Create client-side session
      if (typeof sessionManager !== 'undefined') {
        sessionManager.createSession(walletAddress, { loginType: 'email' });
      }

      showAlert("Login successful! Redirecting...", "success");

      // Close login modal
      closeLoginModal();

      // Redirect to role-based dashboard
      const dashboardUrl = getDashboardUrl(data.user.role);
      setTimeout(() => {
        window.location.href = dashboardUrl;
      }, 800);
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
    }, { skipAuth: true });

    if (data.success) {
      showAlert(
        "Registration successful! Please verify your email, then login.",
        "success"
      );
      closeRegistrationModal();
      // Switch back to the main login view
      const formWrap = document.getElementById('loginEmailFormWrap');
      if (formWrap) formWrap.classList.remove('expanded');
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
}

// Helper: sub-modal backdrop click to close
function setupSubModalBackdrop(overlayId, closeFn) {
  const ov = document.getElementById(overlayId);
  if (ov) {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeFn();
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
  refreshLoginWalletUI();
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

// Check registration status — authenticates wallet, stores session, redirects
async function checkRegistrationStatus() {
  console.log("[Auth] Wallet Connected.");
  if (!userAccount) {
    console.warn("[Auth] No wallet address.");
    showAlert("Please connect your wallet first", "error");
    return;
  }

  const walletAddr = userAccount.toLowerCase();
  console.log("[Auth] Wallet Address:", walletAddr);

  try {
    showLoading(true, "Authenticating...");

    // Step 1: Look up user by wallet address
    console.log("[Auth] Searching Database...");
    const userData = await window.apiClient.get(`/users/wallet/${walletAddr}`, { skipAuth: true });

    if (!userData.user) {
      console.warn("[Auth] Wallet Not Found.");
      showLoading(false);
      showAlert("Wallet not registered. Please register or use Email Login.", "warning");
      return;
    }

    const role = userData.user.role;
    console.log("[Auth] User Found:", userData.user.full_name, "| Role:", role);

    if (!role) {
      console.error("[Auth] Role Missing.");
      showLoading(false);
      showAlert("Authentication failed: user role is missing. Contact administrator.", "error");
      return;
    }

    // Step 2: Authenticate via wallet login endpoint to get JWT
    console.log("[Auth] Authenticating with backend...");
    const authData = await window.apiClient.post("/auth/wallet/login", {
      walletAddress: walletAddr,
    }, { skipAuth: true });

    if (!authData.success || !authData.token) {
      console.error("[Auth] JWT Creation Failed.");
      showLoading(false);
      showAlert("Authentication failed. Please try again.", "error");
      return;
    }

    console.log("[Auth] Creating Session...");

    // Step 3: Store session
    const userToStore = {
      ...authData.user,
      walletAddress: walletAddr,
      wallet_address: walletAddr,
    };
    localStorage.setItem("currentUser", walletAddr);
    localStorage.setItem("evidUser_" + walletAddr, JSON.stringify(userToStore));
    localStorage.setItem("authToken", authData.token);

    // Create client-side session
    if (typeof sessionManager !== 'undefined') {
      sessionManager.createSession(walletAddr, { loginType: 'wallet' });
    }

    // Step 4: Close login modal
    closeLoginModal();

    // Step 5: Redirect to role-based dashboard
    const dashboardUrl = getDashboardUrl(authData.user.role);
    console.log("[Auth] Authentication Complete. Redirecting to:", dashboardUrl);

    showAlert("Login successful! Redirecting...", "success");
    setTimeout(() => {
      console.log("[Auth] Navigating to:", dashboardUrl);
      window.location.href = dashboardUrl;
    }, 800);
  } catch (error) {
    console.error("[Auth] Database Query Failed:", error);
    showLoading(false);

    if (error.status === 401 || error.status === 404) {
      console.warn("[Auth] Wallet Not Found.");
      showAlert("Wallet not registered. Please register or use Email Login.", "warning");
    } else if (error.status >= 500) {
      showAlert("Server unavailable. Please try again later.", "error");
    } else {
      showAlert("Authentication failed: " + (error.message || "Server error"), "error");
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
  const walletAddr = localStorage.getItem("currentUser");
  localStorage.clear();
  userAccount = null;

  // Terminate client session
  if (walletAddr && typeof sessionManager !== 'undefined') {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) sessionManager.terminateSession(sessionId);
  }

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
  refreshLoginWalletUI();
  showAlert("Logged out successfully", "info");

  // If on a dashboard page, redirect to home
  if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('admin')) {
    setTimeout(() => { window.location.href = '/'; }, 500);
  }
}

function disconnectWallet() {
  userAccount = null;
  walletManager.disconnect();
  localStorage.removeItem("wasConnected");
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
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
  refreshLoginWalletUI();
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

  // Also toggle loading state on login modal buttons
  const connectBtn = document.getElementById('loginConnectWallet');
  const emailSubmit = document.getElementById('loginEmailSubmit');
  if (show) {
    if (connectBtn) connectBtn.classList.add('loading');
    if (emailSubmit) emailSubmit.classList.add('loading');
  } else {
    if (connectBtn) connectBtn.classList.remove('loading');
    if (emailSubmit) emailSubmit.classList.remove('loading');
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
    // Admin
    'admin': 'admin.html',
    '8': 'admin.html',
    // Named roles
    'public_viewer': 'dashboard-public.html',
    'investigator': 'dashboard-investigator.html',
    'forensic_analyst': 'dashboard-analyst.html',
    'analyst': 'dashboard-analyst.html',
    'legal_professional': 'dashboard-legal.html',
    'court_official': 'dashboard-court.html',
    'evidence_manager': 'dashboard-manager.html',
    'manager': 'dashboard-manager.html',
    'auditor': 'dashboard-auditor.html',
    // Numeric role IDs
    '1': 'dashboard-public.html',
    '2': 'dashboard-investigator.html',
    '3': 'dashboard-analyst.html',
    '4': 'dashboard-legal.html',
    '5': 'dashboard-court.html',
    '6': 'dashboard-manager.html',
    '7': 'dashboard-auditor.html',
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
  openLoginModal,
  closeLoginModal,
};

// Global error handlers
window.addEventListener("error", function (event) {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});
