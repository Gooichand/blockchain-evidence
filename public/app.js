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

// Initialize application
function initializeApp() {
  console.log("Initializing EVID-DGC application...");

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
  if (modal) {
    modal.classList.add("active");
    toggleScroll(false);
  }
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

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showAlert("Please enter both email and password", "error");
    return;
  }

  try {
    showLoading(true, "Logging in...");

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

  try {
    showLoading(true, "Connecting to MetaMask...");

    if (!window.ethereum) {
      showLoading(false);
      showErrorModal(
        "MetaMask Not Found",
        "MetaMask is not installed. Please install it to use this application.",
        "Install MetaMask",
        () => window.open("https://metamask.io/download/", "_blank")
      );
      return;
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      showLoading(false);
      showErrorModal(
        "Account Access Required",
        "Please unlock your MetaMask wallet and select an account."
      );
      return;
    }

    userAccount = accounts[0];
    console.log("Wallet connected:", userAccount);

    // Check if we're on the correct network
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== config.TARGET_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: config.TARGET_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          // Network not added to MetaMask
          showErrorModal(
            "Network Not Found",
            `Please add ${config.NETWORK_NAME} to your MetaMask wallet.`
          );
        } else {
          console.error("Network switch error:", switchError);
        }
        showLoading(false);
        return;
      }
    }

    localStorage.setItem("wasConnected", "true");

    updateWalletUI();
    await checkRegistrationStatus();
    showLoading(false);
  } catch (error) {
    showLoading(false);
    console.error("Wallet connection error:", error);

    if (error.code === 4001) {
      showErrorModal(
        "Connection Rejected",
        "You rejected the connection request. This app requires a wallet connection to function.",
        "Try Again",
        connectWallet
      );
    } else {
      showErrorModal(
        "Connection Failed",
        error.message || "An unexpected error occurred."
      );
    }
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

    const data = await window.apiClient.get(`/users/wallet/${userAccount}`);

    if (data.user) {
      console.log("Found existing user:", data.user);

      const walletAddr = userAccount.toLowerCase();
      // Store in dashboard-compatible format
      localStorage.setItem("currentUser", walletAddr);
      localStorage.setItem("evidUser_" + walletAddr, JSON.stringify(data.user));

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
  localStorage.removeItem("wasConnected");

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
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      location.reload();
    }
  });

  window.ethereum.on("chainChanged", () => {
    location.reload();
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
