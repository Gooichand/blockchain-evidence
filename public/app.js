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
    // If user already has a valid auth token, redirect to their dashboard
    const savedUser = localStorage.getItem("currentUser");
    const authToken = localStorage.getItem("authToken");
    if (savedUser && authToken) {
      // Try wallet key first, then email key
      let userData = null;
      try {
        const raw = localStorage.getItem("evidUser_" + savedUser) ||
                    localStorage.getItem("evidUser_" + savedUser.toLowerCase());
        if (raw) userData = JSON.parse(raw);
      } catch (_) {}
      const role = userData && userData.role;
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

    // MetaMask connect button inside login modal
    const loginConnectBtn = document.getElementById('loginConnectWallet');
    if (loginConnectBtn) {
      loginConnectBtn.addEventListener('click', async () => {
        if (loginConnectBtn.classList.contains('loading')) return; // Prevent double-click
        loginConnectBtn.classList.add('loading');
        loginConnectBtn.disabled = true;
        try {
          await connectWallet();
          // After connection, if wallet is valid, trigger auth immediately
          if (userAccount) {
            refreshLoginWalletUI();
            await checkRegistrationStatus();
          } else {
            refreshLoginWalletUI();
          }
        } catch (err) {
          console.error('Modal connect error:', err);
        } finally {
          loginConnectBtn.classList.remove('loading');
          loginConnectBtn.disabled = false;
        }
      });
    }

    // Wallet disconnect button inside login modal
    const loginDisconnectBtn = document.getElementById('loginDisconnectWallet');
    if (loginDisconnectBtn) {
      loginDisconnectBtn.addEventListener('click', () => {
        disconnectWallet();
        refreshLoginWalletUI();
      });
    }

    // "Login Now" button — shown when wallet already connected in modal
    const loginWalletLoginBtn = document.getElementById('loginWalletLoginBtn');
    if (loginWalletLoginBtn) {
      loginWalletLoginBtn.addEventListener('click', async () => {
        if (loginWalletLoginBtn.classList.contains('loading')) return;
        loginWalletLoginBtn.classList.add('loading');
        loginWalletLoginBtn.disabled = true;
        try {
          await checkRegistrationStatus();
        } finally {
          loginWalletLoginBtn.classList.remove('loading');
          loginWalletLoginBtn.disabled = false;
        }
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
    setupSubModalBackdrop('publicLoginOverlay', closePublicLoginModal);
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
    closePublicLoginModal();
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
  const connectBtn = document.getElementById('loginConnectWallet');
  const loginNowBtn = document.getElementById('loginWalletLoginBtn');

  if (userAccount && connected && addr) {
    connected.classList.add('show');
    addr.textContent = userAccount.slice(0, 6) + '...' + userAccount.slice(-4);
    if (connectBtn) connectBtn.style.display = 'none';
    if (loginNowBtn) loginNowBtn.style.display = '';
  } else {
    if (connected) connected.classList.remove('show');
    if (connectBtn && window.ethereum) connectBtn.style.display = '';
    if (loginNowBtn) loginNowBtn.style.display = 'none';
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
    const publicOv = document.getElementById('publicLoginOverlay');
    const loginOv = document.getElementById('loginOverlay');

    if (errorOv && errorOv.classList.contains('active')) { closeErrorModal(); return; }
    if (regOv && regOv.classList.contains('active')) { closeRegistrationModal(); return; }
    if (forgotOv && forgotOv.classList.contains('active')) { closeForgotPasswordModal(); return; }
    if (publicOv && publicOv.classList.contains('active')) { closePublicLoginModal(); return; }
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

function openRegistrationModal(preferredRole) {
  const ov = document.getElementById('registrationOverlay');
  if (!ov) return;

  const roleSel = document.getElementById('regRole');
  const roleHint = document.getElementById('regRoleHint');
  if (preferredRole && roleSel) {
    roleSel.value = preferredRole;
    if (roleHint) {
      roleHint.textContent = preferredRole === 'public_viewer'
        ? 'Public Viewer accounts use email only — no MetaMask required.'
        : '';
      roleHint.style.display = preferredRole === 'public_viewer' ? 'block' : 'none';
    }
  } else if (roleHint) {
    roleHint.style.display = 'none';
  }

  ov.classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeRegistrationModal() {
  const ov = document.getElementById('registrationOverlay');
  if (ov) ov.classList.remove('active');
}

// Public login — separate popup, email + password only (no MetaMask)
function openPublicLoginModal() {
  const ov = document.getElementById('publicLoginOverlay');
  if (ov) {
    ov.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const email = document.getElementById('publicEmail');
    if (email) setTimeout(() => email.focus(), 50);
  }
}

function closePublicLoginModal() {
  const ov = document.getElementById('publicLoginOverlay');
  if (ov) ov.classList.remove('active');
}

// Public login handler — email + password, redirects to the public dashboard
async function handlePublicLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById('publicEmail');
  const passwordInput = document.getElementById('publicPassword');
  const submitBtn = document.getElementById('publicLoginSubmit');

  if (!emailInput || !passwordInput) {
    showAlert("Public login form not loaded correctly. Please refresh the page.", "error");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showAlert("Please enter both email and password.", "error");
    return;
  }

  if (submitBtn) {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
  }

  try {
    showLoading(true, "Logging in...");
    const data = await window.apiClient.post("/auth/email/login", { email, password }, { skipAuth: true });

    if (data.success) {
      const storageKey = (data.user.wallet_address || data.user.walletAddress || email).toLowerCase();
      const userToStore = {
        ...data.user,
        walletAddress: storageKey,
        wallet_address: storageKey,
      };
      localStorage.setItem("currentUser", storageKey);
      localStorage.setItem("evidUser_" + storageKey, JSON.stringify(userToStore));
      localStorage.setItem("evidUser_" + email.toLowerCase(), JSON.stringify(userToStore));
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      if (typeof sessionManager !== 'undefined') {
        sessionManager.createSession(storageKey, { loginType: 'email' });
      }

      showAlert("Login successful! Redirecting...", "success");
      closePublicLoginModal();
      closeLoginModal();

      const dashboardUrl = getDashboardUrl(data.user.role);
      setTimeout(() => {
        window.location.href = dashboardUrl;
      }, 900);
    }
  } catch (error) {
    console.error("Public login error:", error);
    let message = error.message || "Login failed. Please try again.";
    if (error.status === 401) {
      message = "Invalid email or password. Please check your credentials and try again.";
    } else if (error.status === 429) {
      message = "Too many login attempts. Please wait a moment and try again.";
    } else if (error.status >= 500) {
      message = "Server error. Please try again later.";
    }
    showAlert(message, "error");
  } finally {
    showLoading(false);
    if (submitBtn) submitBtn.disabled = false;
  }
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
  const submitBtn = document.getElementById("loginEmailSubmit");
  
  if (!emailInput || !passwordInput) {
    console.error("Email or password input elements not found");
    showAlert("Login form not loaded correctly. Please refresh the page.", "error");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showAlert("Please enter both email and password.", "error");
    return;
  }

  // Prevent double submission
  if (submitBtn) {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
  }

  try {
    showLoading(true, "Logging in...");

    if (!window.apiClient) {
      showAlert("Authentication service not loaded. Please refresh the page.", "error");
      return;
    }

    const data = await window.apiClient.post("/auth/email/login", { email, password }, { skipAuth: true });

    if (data.success) {
      // Determine the storage key: use wallet_address if present, else email
      const storageKey = (data.user.wallet_address || data.user.walletAddress || email).toLowerCase();
      
      const userToStore = {
        ...data.user,
        walletAddress: storageKey,
        wallet_address: storageKey,
      };
      localStorage.setItem("currentUser", storageKey);
      localStorage.setItem("evidUser_" + storageKey, JSON.stringify(userToStore));
      // Also store by email as fallback key
      localStorage.setItem("evidUser_" + email.toLowerCase(), JSON.stringify(userToStore));
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      if (typeof sessionManager !== 'undefined') {
        sessionManager.createSession(storageKey, { loginType: 'email' });
      }

      // Show success toast BEFORE closing modal
      showAlert("Login successful! Redirecting...", "success");

      // Close login modal
      closeLoginModal();

      // Redirect to role-based dashboard
      const dashboardUrl = getDashboardUrl(data.user.role);
      setTimeout(() => {
        window.location.href = dashboardUrl;
      }, 900);
    }
  } catch (error) {
    console.error("Login error:", error);
    let message = error.message || "Login failed. Please try again.";
    if (error.status === 401) {
      message = "Invalid email or password. Please check your credentials and try again.";
    } else if (error.status === 429) {
      message = "Too many login attempts. Please wait a moment and try again.";
    } else if (error.status >= 500) {
      message = "Server error. Please try again later.";
    }
    showAlert(message, "error");
  } finally {
    showLoading(false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
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
        "Registration successful! You can now log in with your email.",
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

  const publicLoginForm = document.getElementById("publicLoginForm");
  if (publicLoginForm) {
    publicLoginForm.addEventListener("submit", handlePublicLogin);
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
    showAlert("Please connect your wallet first.", "error");
    return;
  }

  const walletAddr = userAccount.toLowerCase();
  console.log("[Auth] Wallet Address:", walletAddr);

  try {
    showLoading(true, "Authenticating...");

    // Step 1: Look up user by wallet address
    console.log("[Auth] Searching Database...");
    let userData;
    try {
      userData = await window.apiClient.get(`/users/wallet/${walletAddr}`, { skipAuth: true });
    } catch (lookupError) {
      console.warn("[Auth] Wallet lookup failed:", lookupError);
      if (lookupError.status === 404 || lookupError.status === 401) {
        showAlert("Wallet not registered. Please register or use Email Login.", "warning");
      } else {
        showAlert("Unable to reach server. Please check your connection and try again.", "error");
      }
      return;
    }

    if (!userData || !userData.user) {
      console.warn("[Auth] Wallet Not Found.");
      showAlert("Wallet not registered. Please register or use Email Login.", "warning");
      return;
    }

    const role = userData.user.role;
    console.log("[Auth] User Found:", userData.user.full_name, "| Role:", role);

    if (!role) {
      console.error("[Auth] Role Missing.");
      showAlert("Authentication failed: user role is missing. Contact administrator.", "error");
      return;
    }

    // Step 2: Authenticate via wallet login endpoint to get JWT
    console.log("[Auth] Authenticating with backend...");
    let authData;
    try {
      authData = await window.apiClient.post("/auth/wallet/login", {
        walletAddress: walletAddr,
      }, { skipAuth: true });
    } catch (authError) {
      console.error("[Auth] JWT Creation Failed:", authError);
      let msg = "Authentication failed. Please try again.";
      if (authError.status === 401) msg = "Wallet not authorized. Please register first.";
      else if (authError.status >= 500) msg = "Server error during authentication. Please try again later.";
      showAlert(msg, "error");
      return;
    }

    if (!authData || !authData.success || !authData.token) {
      console.error("[Auth] JWT Creation Failed.");
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

    if (typeof sessionManager !== 'undefined') {
      sessionManager.createSession(walletAddr, { loginType: 'wallet' });
    }

    // Step 4: Show success BEFORE closing modal
    showAlert("Login successful! Redirecting...", "success");

    // Step 5: Close login modal
    closeLoginModal();

    // Step 6: Redirect to role-based dashboard
    const dashboardUrl = getDashboardUrl(authData.user.role);
    console.log("[Auth] Authentication Complete. Redirecting to:", dashboardUrl);

    setTimeout(() => {
      console.log("[Auth] Navigating to:", dashboardUrl);
      window.location.href = dashboardUrl;
    }, 900);
  } catch (error) {
    console.error("[Auth] Unexpected Error:", error);
    showAlert("Authentication failed: " + (error.message || "Unexpected error"), "error");
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

// Alert system — always renders on top of modals (inline z-index as backup)
function showAlert(message, type = "info") {
  // Remove any existing alerts first
  const existingAlerts = document.querySelectorAll(".alert");
  existingAlerts.forEach((a) => a.remove());

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  // Inline z-index as a safety net in case CSS doesn't load
  alert.style.zIndex = '99999';
  alert.style.position = 'fixed';

  if (type === "error" || type === "warning") {
    alert.setAttribute("role", "alert");
    alert.setAttribute("aria-live", "assertive");
  } else {
    alert.setAttribute("role", "status");
    alert.setAttribute("aria-live", "polite");
  }

  const iconName = getAlertIcon(type);
  alert.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="${iconName}" style="width: 16px; height: 16px; flex-shrink:0;" aria-hidden="true"></i>
            <span>${message}</span>
        </div>
    `;

  // Always append to body so it sits in the top stacking context
  document.body.appendChild(alert);

  if (typeof lucide !== 'undefined') lucide.createIcons();

  const timer = setTimeout(() => {
    if (alert.parentNode) alert.remove();
  }, 5500);

  alert.addEventListener("click", () => {
    clearTimeout(timer);
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
  handlePublicLogin,
  openLoginModal,
  closeLoginModal,
  openPublicLoginModal,
  closePublicLoginModal,
};

// Global error handlers
window.addEventListener("error", function (event) {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});

// ═══════════════════════════════════════════════════════════════
// World-Class Spatial Motion System & Reveal Engine
// ═══════════════════════════════════════════════════════════════
class MotionEngine {
  static init() {
    this.initScrollReveals();
    this.initStaggerParents();
    this.init3DHoverCards();
    this.initCounterAnimations();
    this.initTabPanels();
  }

  static initScrollReveals() {
    const targets = document.querySelectorAll(
      '.feature-card, .metric-card, .timeline-step, .career-why-card, .talent-who-card, .talent-main-card, .section-header, .case-card, .evidence-card, .dashboard-card, .search-card, .analytics-card'
    );

    targets.forEach((el) => {
      if (!el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );

      document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    } else {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('revealed'));
    }
  }

  static initStaggerParents() {
    const containers = document.querySelectorAll(
      '.features-grid, .metrics-grid, .journey-timeline, .career-why-grid, .talent-who-grid, .dashboard-grid, .evidence-grid'
    );

    containers.forEach((container) => {
      container.classList.add('stagger-parent');
      Array.from(container.children).forEach((child) => {
        child.classList.add('stagger-child');
      });
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
            }
          });
        },
        { threshold: 0.1 }
      );

      containers.forEach((c) => observer.observe(c));
    } else {
      containers.forEach((c) => c.classList.add('revealed'));
    }
  }

  static init3DHoverCards() {
    const cards = document.querySelectorAll('.feature-card, .metric-card, .timeline-step, .career-why-card, .talent-who-card, .dashboard-card, .tool-card, .evidence-card, .stat-card, .role-card, .card');
    cards.forEach((card) => {
      card.classList.add('depth-hover-card');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (y / rect.height) * -8;
        const rotateY = (x / rect.width) * 8;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  static initCounterAnimations() {
    const metricElements = document.querySelectorAll('.metric-number, .csc-value');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateValue(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      metricElements.forEach((el) => observer.observe(el));
    }
  }

  static animateValue(el) {
    const text = el.textContent.trim();
    const hasPercent = text.includes('%');
    const cleanNum = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanNum)) return;

    let start = 0;
    const duration = 1600;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (cleanNum - start) * eased);
      
      if (hasPercent) {
        el.textContent = (cleanNum > 10 ? current : (start + (cleanNum - start) * eased).toFixed(2)) + '%';
      } else {
        el.textContent = current.toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = text;
      }
    };

    requestAnimationFrame(update);
  }

  static initTabPanels() {
    const tabButtons = document.querySelectorAll('[data-tab], .tab-btn, .nav-tab');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab-target') || btn.getAttribute('data-tab');
        if (!targetId) return;
        const panel = document.getElementById(targetId);
        if (panel) {
          document.querySelectorAll('.tab-content-panel').forEach((p) => p.classList.remove('active-panel'));
          panel.classList.add('tab-content-panel');
          setTimeout(() => panel.classList.add('active-panel'), 50);
        }
      });
    });
  }
  static initInteractiveCubeAndTimeline() {
    const cube = document.getElementById('interactiveVaultCube');
    const steps = document.querySelectorAll('.polar-panel[data-step], .journey-timeline .timeline-step[data-step]');
    const faces = document.querySelectorAll('.vault-cube .cube-face');
    if (!cube || steps.length === 0) return;

    // Face rotation map (used when hovering a step to snap the cube)
    const rotations = {
      '1': 'rotateX(0deg) rotateY(0deg)',
      '2': 'rotateX(0deg) rotateY(-90deg)',
      '3': 'rotateX(0deg) rotateY(-180deg)',
      '4': 'rotateX(0deg) rotateY(90deg)',
      '5': 'rotateX(-90deg) rotateY(0deg)',
      '6': 'rotateX(90deg) rotateY(0deg)'
    };

    /* ─────────────────────────────────────────────
       AUTO-SYNC: derive active step from CSS animation
       cubeRotate3D duration = 16s → 6 faces → 2666ms/face
       We read the LIVE animation currentTime so the sync
       is always in lockstep with the cube, regardless of speed.
    ───────────────────────────────────────────── */
    const ANIM_DURATION_MS = 16000;
    const STEP_COUNT       = 6;
    const PHASE_MS         = ANIM_DURATION_MS / STEP_COUNT; // ≈ 2666ms

    let isHovering      = false;
    let lastActiveStep  = 0;       // 1-6, 0 = none
    let rafHandle       = null;

    // Node elements (class names node-1…node-6)
    const orbitNodes = {};
    for (let i = 1; i <= 6; i++) {
      orbitNodes[i] = document.querySelector(`.orbit-node.node-${i}`);
    }

    // SVG connector lines (6 arcs in document order = steps 1→2, 2→3, …, 6→1)
    const connectors = Array.from(document.querySelectorAll('.orbit-bezier-line'));

    function setActiveStep(stepNum) {
      if (stepNum === lastActiveStep) return;

      // Remove previous active classes
      steps.forEach(s    => s.classList.remove('active-step'));
      Object.values(orbitNodes).forEach(n => n && n.classList.remove('node-active'));
      connectors.forEach(c => c.classList.remove('connector-active'));

      // Apply new active classes
      const targetPanel = document.querySelector(`.polar-panel[data-step="${stepNum}"]`);
      if (targetPanel) targetPanel.classList.add('active-step');

      if (orbitNodes[stepNum]) orbitNodes[stepNum].classList.add('node-active');

      // Each connector arc joins step N to step N+1 (index stepNum-1 in the SVG)
      const connIdx = (stepNum - 1) % connectors.length;
      if (connectors[connIdx]) connectors[connIdx].classList.add('connector-active');

      lastActiveStep = stepNum;
    }

    function getCubeAnimationStep() {
      // Prefer live CSS animation time (exact, animation-synced)
      const anims = (typeof cube.getAnimations === 'function') ? cube.getAnimations() : [];
      if (anims.length > 0 && anims[0].playState !== 'paused') {
        const t = anims[0].currentTime; // ms, wraps per iteration
        if (t != null) {
          const phase = Math.floor((t % ANIM_DURATION_MS) / PHASE_MS);
          return (phase % STEP_COUNT) + 1;
        }
      }
      // Fallback: wall-clock derived (still animation-synced if page loaded at t=0)
      const elapsed = performance.now() % ANIM_DURATION_MS;
      return Math.floor(elapsed / PHASE_MS) % STEP_COUNT + 1;
    }

    function autoSyncLoop() {
      if (!isHovering) {
        setActiveStep(getCubeAnimationStep());
      }
      rafHandle = requestAnimationFrame(autoSyncLoop);
    }
    autoSyncLoop();

    /* ─────────────────────────────────────────────
       HOVER OVERRIDE: pause auto-sync, snap cube face
    ───────────────────────────────────────────── */
    steps.forEach((step) => {
      step.addEventListener('mouseenter', () => {
        isHovering = true;
        cube.style.animationPlayState = 'paused';
        const stepNum = step.getAttribute('data-step');
        steps.forEach(s => s.classList.remove('active-step'));
        step.classList.add('active-step');
        if (rotations[stepNum]) {
          cube.style.transform  = `${rotations[stepNum]} scale(1.1)`;
          cube.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        }
        // Clear auto-sync visual states so they don't flicker
        Object.values(orbitNodes).forEach(n => n && n.classList.remove('node-active'));
        connectors.forEach(c => c.classList.remove('connector-active'));
      });

      step.addEventListener('mouseleave', () => {
        isHovering = false;
        lastActiveStep = 0; // force re-evaluation on next frame
        step.classList.remove('active-step');
        cube.style.transform  = '';
        cube.style.transition = '';
        cube.style.animationPlayState = 'running';
      });
    });

    /* ─────────────────────────────────────────────
       FACE CLICK: flash the matching panel
    ───────────────────────────────────────────── */
    faces.forEach((face) => {
      face.style.cursor = 'pointer';
      face.addEventListener('click', () => {
        const stepNum = face.getAttribute('data-step');
        setActiveStep(Number(stepNum));
        // Brief override then resume auto-sync
        lastActiveStep = 0; // allow auto-sync to re-activate next frame
      });
    });
  }
}

// Initialize MotionEngine on DOM ready
document.addEventListener("DOMContentLoaded", function () {
  MotionEngine.init();
  MotionEngine.initInteractiveCubeAndTimeline();
});

// Enhanced Website-Wide Interactive Parallax (Mouse Move)
document.addEventListener("DOMContentLoaded", function () {
  const bgGrid = document.querySelector(".bg-grid");
  const bgSpotlight = document.querySelector(".bg-spotlight-beam");
  const bgSpheres = document.querySelectorAll(".bg-gradient-sphere");

  if (!bgGrid && !bgSpotlight && bgSpheres.length === 0) return;

  let ticking = false;

  window.addEventListener("mousemove", function (e) {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(function () {
      // Calculate normalized cursor coordinates across full window (-0.5 to +0.5)
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;

      // Micro-grid shifts clearly in opposite direction
      if (bgGrid) {
        bgGrid.style.transform = `translate3d(${x * -40}px, ${y * -40}px, 0)`;
      }

      // Spotlight beam moves dynamically across the top
      if (bgSpotlight) {
        bgSpotlight.style.transform = `translate3d(calc(-50% + ${x * -30}px), ${y * -20}px, 0)`;
      }

      // Spheres float gracefully with deep 3D separation
      bgSpheres.forEach((sphere, idx) => {
        const factorX = (idx + 1) * 35;
        const factorY = (idx + 1) * 25;
        sphere.style.transform = `translate3d(${x * factorX}px, ${y * factorY}px, 0)`;
      });

      ticking = false;
    });
  });
});
