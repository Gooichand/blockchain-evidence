// Clean Evidence Management System - Enhanced with Admin Management
/* global trackUserAction, trackEvent */
let userAccount;

const roleNames = {
    1: 'Public Viewer', 2: 'Investigator', 3: 'Forensic Analyst',
    4: 'Legal Professional', 5: 'Court Official', 6: 'Evidence Manager',
    7: 'Auditor', 8: 'Administrator'
};

const roleMapping = {
    1: 'public_viewer', 2: 'investigator', 3: 'forensic_analyst',
    4: 'legal_professional', 5: 'court_official', 6: 'evidence_manager',
    7: 'auditor', 8: 'admin'
};

// Initialize app
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Set up application event handlers, initialize the hamburger menu, and attempt to auto-connect MetaMask if available.
 *
 * Attaches click/submit handlers for wallet connection, registration submission, and dashboard navigation, initializes the hamburger menu UI, and, when a web3 provider exists, tries to restore an existing MetaMask connection.
 */
async function initializeApp() {
    const connectBtn = document.getElementById('connectWallet');
    const regForm = document.getElementById('registrationForm');
    const dashBtn = document.getElementById('goToDashboard');

    if (connectBtn) connectBtn.addEventListener('click', connectWallet);
    if (regForm) regForm.addEventListener('submit', handleRegistration);
    if (dashBtn) dashBtn.addEventListener('click', goToDashboard);

    // Initialize hamburger menu
    initializeHamburgerMenu();

    // Auto-connect if MetaMask is available
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.log('MetaMask not connected');
        }
    }
}

/**
 * Sets up the hamburger menu toggle and closes the menu when a navigation link is clicked.
 *
 * If elements with IDs "menuToggle" or "navMenu" are not present, the function does nothing.
 */
// Initialize hamburger menu
function initializeHamburgerMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when link is clicked
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}
/**
 * Connects to the user's Ethereum wallet (MetaMask) or uses a demo address when MetaMask is unavailable, then updates application state and UI.
 *
 * Attempts to request accounts from window.ethereum; on success, sets the global `userAccount`, updates the wallet UI, and checks the user's registration status. If no provider is present, assigns a fixed demo address, updates UI, and checks registration. Shows loading and error alerts as needed and records analytics events when `trackUserAction` is available.
 */
async function connectWallet() {
    // Reset any previous errors
    closeErrorModal();

    // Check Internet Connection
    if (!navigator.onLine) {
        showErrorModal('No Internet Connection', 'Please check your network settings and try again.');
        return;
    }

    try {
        // Show loader
        const loader = document.getElementById('loader');
        const loaderMessage = document.getElementById('loaderMessage');
        if (loader) loader.classList.remove('hidden');
        if (loaderMessage) loaderMessage.classList.remove('hidden');

        showLoading(true);

        // Track wallet connection attempt
        if (typeof trackUserAction === 'function') {
            trackUserAction('wallet_connect_attempt', 'authentication');
        }

        // Check if MetaMask is installed
        if (!window.ethereum) {
            // Demo mode fallback or Install Prompt
            if (config.DEMO_MODE) {
                userAccount = '0x1234567890123456789012345678901234567890';
                await new Promise(resolve => setTimeout(resolve, 1500));
                updateWalletUI();
                await checkRegistrationStatus();
                showLoading(false);
                hideLoader();
                return;
            }

            showLoading(false);
            hideLoader();
            showErrorModal(
                'MetaMask Not Found',
                'MetaMask is not installed. Please install it to use this application.',
                'Install MetaMask',
                () => window.open('https://metamask.io/download/', '_blank')
            );
            return;
        }

        // Check Network
        if (config.TARGET_CHAIN_ID && !(await checkNetwork())) {
            showLoading(false);
            hideLoader();
            return; // checkNetwork handles the UI
        }

        // Request Accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts.length === 0) {
            showLoading(false);
            hideLoader();
            showErrorModal('Account Access Required', 'Please unlock your MetaMask wallet and select an account.');
            return;
        }

        userAccount = accounts[0];
        updateWalletUI();
        await checkRegistrationStatus();

        // Track successful connection
        if (typeof trackUserAction === 'function') {
            trackUserAction('wallet_connected', 'authentication');
        }

        showLoading(false);
        hideLoader();

    } catch (error) {
        showLoading(false);
        hideLoader();

        console.error('Wallet connection error:', error);

        // Handle specific error codes
        if (error.code === 4001) {
            // User rejected the request
            showErrorModal(
                'Connection Rejected',
                'You rejected the connection request. This app requires a wallet connection to function.',
                'Try Again',
                connectWallet
            );
        } else if (error.code === -32002) {
            // Request pending
            showErrorModal(
                'Check MetaMask',
                'A connection request is already pending. Please check your MetaMask extension popups.'
            );
        } else {
            // Generic or other errors
            showErrorModal('Connection Failed', error.message || 'An unexpected error occurred.');
        }

        // Track failure
        if (typeof trackUserAction === 'function') {
            trackUserAction('wallet_connect_failed', 'authentication');
        }
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    const loaderMessage = document.getElementById('loaderMessage');
    if (loader) loader.classList.add('hidden');
    if (loaderMessage) loaderMessage.classList.add('hidden');
}

function updateWalletUI() {
    const walletAddr = document.getElementById('walletAddress');
    const walletStatus = document.getElementById('walletStatus');
    const connectBtn = document.getElementById('connectWallet');

    if (walletAddr) walletAddr.textContent = userAccount;
    if (walletStatus) walletStatus.classList.remove('hidden');
    if (connectBtn) {
        connectBtn.textContent = 'Connected';
        connectBtn.disabled = true;
    }
}

/**
 * Verify whether the currently connected wallet address is registered and update the UI to reflect the result.
 *
 * Checks the primary database (via `window.storage.getUser`) when available, falls back to `localStorage` for backward
 * compatibility, and updates the interface accordingly:
 * - If the account is inactive, shows an error and logs the user out.
 * - If the account is an admin, configures the admin UI and shows the "already registered" section.
 * - If the account is a regular registered user, configures the user UI and shows the "already registered" section.
 * - If no record is found, displays the registration form.
 * On unexpected errors, shows an error alert and displays the registration form.
 */
async function checkRegistrationStatus() {
    try {
        if (!userAccount) {
            showAlert('Please connect your wallet first.', 'error');
            return;
        }

        // Check database for user first (primary source) - safe check
        let userInfo = null;
        if (typeof window.storage !== 'undefined' && window.storage) {
            try {
                userInfo = await window.storage.getUser(userAccount);
            } catch (error) {
                console.log('Database not available, checking localStorage');
            }
        }

        // If user found in database
        if (userInfo) {
            // Check if user is inactive
            if (!userInfo.is_active) {
                showAlert('Your account has been deactivated. Contact administrator.', 'error');
                logout();
                return;
            }

            // Check if user is admin - show options instead of auto-redirect
            if (userInfo.role === 'admin') {
                updateAdminUI(userInfo);
                toggleSections('alreadyRegistered');
                return;
            }

            // Regular user - show dashboard access
            updateUserUI(userInfo);
            toggleSections('alreadyRegistered');
            return;
        }

        // Fallback to localStorage for existing users (backward compatibility)
        const savedUser = localStorage.getItem('evidUser_' + userAccount);
        if (savedUser) {
            const localUserInfo = JSON.parse(savedUser);

            // Check if it's an admin in localStorage - show options instead of auto-redirect
            if (localUserInfo.role === 8 || localUserInfo.role === 'admin') {
                updateAdminUI(localUserInfo);
                toggleSections('alreadyRegistered');
                return;
            }

            updateUserUI(localUserInfo);
            toggleSections('alreadyRegistered');
            return;
        }

        // New wallet - show registration form
        toggleSections('registration');

    } catch (error) {
        console.error('Registration check error:', error);
        showAlert('Error checking registration. Please try again.', 'error');
        // On error, show registration form
        toggleSections('registration');
    }
}

function updateUserUI(userInfo) {
    const userName = document.getElementById('userName');
    const userRoleName = document.getElementById('userRoleName');
    const userDepartment = document.getElementById('userDepartment');

    if (userName) userName.textContent = userInfo.fullName || userInfo.full_name;
    if (userRoleName) {
        const role = userInfo.role;
        userRoleName.textContent = roleNames[role];
        userRoleName.className = `badge badge-${getRoleClass(role)}`;
    }
    if (userDepartment) userDepartment.textContent = userInfo.department || 'Public';
}

function updateAdminUI(userInfo) {
    const userName = document.getElementById('userName');
    const userRoleName = document.getElementById('userRoleName');
    const userDepartment = document.getElementById('userDepartment');
    const dashBtn = document.getElementById('goToDashboard');

    if (userName) userName.textContent = userInfo.fullName || userInfo.full_name;
    if (userRoleName) {
        userRoleName.textContent = '👑 Administrator';
        userRoleName.className = 'badge badge-admin';
    }
    if (userDepartment) userDepartment.textContent = 'System Administration';

    // Change dashboard button to admin dashboard
    if (dashBtn) {
        dashBtn.textContent = '👑 Go to Admin Dashboard';
        dashBtn.onclick = goToAdminDashboard;
    }
}

function toggleSections(activeSection) {
    const sections = {
        wallet: document.getElementById('walletSection'),
        registration: document.getElementById('registrationSection'),
        alreadyRegistered: document.getElementById('alreadyRegisteredSection')
    };

    Object.keys(sections).forEach(key => {
        if (sections[key]) {
            sections[key].classList.toggle('hidden', key !== activeSection);
        }
    });
}

/**
 * Handle the registration form submission: validate input, persist the new user's data, track the registration event, and redirect to the dashboard on success.
 *
 * Prevents administrator self-registration, requires a connected wallet, saves the prepared user record to localStorage (always) and to window.storage when available, shows loading/alert UI for status, and attempts to track the registration via analytics when available.
 * @param {Event} event - The form submit event.
 */
async function handleRegistration(event) {
    event.preventDefault();

    try {
        showLoading(true);

        if (!userAccount) {
            showAlert('Please connect your wallet first.', 'error');
            showLoading(false);
            return;
        }

        const formData = getFormData();
        if (!formData) {
            showLoading(false);
            return;
        }

        // Prevent admin role self-registration
        if (formData.role === 8 || formData.role === 'admin') {
            showAlert('Administrator role cannot be self-registered. Contact an existing administrator.', 'error');
            showLoading(false);
            return;
        }

        // Convert role number to string for database
        const dbRole = roleMapping[formData.role];

        // Save to localStorage (always works)
        localStorage.setItem('evidUser_' + userAccount, JSON.stringify(formData));
        localStorage.setItem('currentUser', userAccount);

        // Try to save to database if available - safe check
        if (typeof window.storage !== 'undefined' && window.storage) {
            try {
                const userData = {
                    walletAddress: userAccount,
                    fullName: formData.fullName,
                    role: dbRole,
                    department: formData.department,
                    jurisdiction: formData.jurisdiction,
                    badgeNumber: formData.badgeNumber,
                    accountType: 'real',
                    createdBy: 'self'
                };
                await window.storage.saveUser(userData);
                console.log('User saved to database');
            } catch (error) {
                console.log('Database save failed, using localStorage only');
            }
        }

        // Track successful registration (safe check)
        if (typeof trackEvent === 'function') {
            trackEvent('user_registration', {
                event_category: 'registration',
                role_type: dbRole,
                user_type: 'new_user',
                department: formData.department
            });
        }

        showLoading(false);
        showAlert('Registration successful! Redirecting to dashboard...', 'success');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        showLoading(false);
        console.error('Registration error:', error);
        showAlert('Registration failed: ' + error.message, 'error');
    }
}

function getFormData() {
    const fullName = document.getElementById('fullName')?.value;
    const role = parseInt(document.getElementById('userRole')?.value);

    if (!fullName || !role) {
        showAlert('Please fill in all required fields and select a role.', 'error');
        return null;
    }

    return {
        fullName,
        role,
        department: role === 1 ? 'Public' : document.getElementById('department')?.value || 'Unknown',
        badgeNumber: role === 1 ? '' : document.getElementById('badgeNumber')?.value || '',
        jurisdiction: role === 1 ? 'Public' : document.getElementById('jurisdiction')?.value || 'Unknown',
        registrationDate: Date.now(),
        isRegistered: true,
        isActive: true
    };
}

async function goToDashboard() {
    localStorage.setItem('currentUser', userAccount);

    // Get user role to redirect to appropriate dashboard
    try {
        const userResponse = await fetch(`/api/user/${userAccount}`);
        const userData = await userResponse.json();

        if (userData.user) {
            const role = userData.user.role;
            switch (role) {
                case 'investigator':
                    window.location.href = 'dashboard-investigator.html';
                    break;
                case 'forensic_analyst':
                    window.location.href = 'dashboard-analyst.html';
                    break;
                case 'legal_professional':
                    window.location.href = 'dashboard-legal.html';
                    break;
                case 'court_official':
                    window.location.href = 'dashboard-court.html';
                    break;
                case 'evidence_manager':
                    window.location.href = 'dashboard-manager.html';
                    break;
                case 'auditor':
                    window.location.href = 'dashboard-auditor.html';
                    break;
                case 'admin':
                    window.location.href = 'admin.html';
                    break;
                case 'public_viewer':
                    window.location.href = 'dashboard-public.html';
                    break;
                default:
                    window.location.href = 'dashboard.html'; // Fallback
            }
        } else {
            window.location.href = 'dashboard.html'; // Fallback
        }
    } catch (error) {
        console.error('Error determining dashboard:', error);
        window.location.href = 'dashboard.html'; // Fallback
    }
}

async function goToAdminDashboard() {
    localStorage.setItem('currentUser', userAccount);
    window.location.href = 'admin.html';
}

/**
 * Get the CSS class name associated with a numeric role identifier.
 * @param {number} role - Numeric role identifier (e.g., 1 for public, 8 for admin).
 * @returns {string} The corresponding CSS role class name; `'public'` if the role is unrecognized.
 */
function getRoleClass(role) {
    const roleClasses = {
        1: 'public', 2: 'investigator', 3: 'forensic', 4: 'legal',
        5: 'court', 6: 'manager', 7: 'auditor', 8: 'admin'
    };
    return roleClasses[role] || 'public';
}

/**
 * Logs the current user out and restores the application to its initial unauthenticated state.
 *
 * Clears all stored client data, resets the in-memory wallet state and the connect button UI, shows only the wallet section, and navigates to index.html to reload the app.
 */
// eslint-disable-next-line no-unused-vars
function logout() {
    // Clear all stored data
    localStorage.clear();

    // Reset UI
    userAccount = null;
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.textContent = '🚀 Connect MetaMask Wallet';
        connectBtn.disabled = false;
    }

    // Hide all sections except wallet
    toggleSections('wallet');
    document.getElementById('walletStatus')?.classList.add('hidden');

    // Force page reload to ensure clean state
    window.location.replace('index.html');
}

/**
 * Disconnects the currently connected wallet and restores the app to its initial connect state.
 *
 * Clears stored wallet state, resets the connect button to an enabled "Connect MetaMask Wallet" state,
 * hides registration and status sections, shows the wallet connect section, and displays a success alert.
 */
// eslint-disable-next-line no-unused-vars
function disconnectWallet() {
    // Clear wallet connection
    userAccount = null;
    localStorage.clear();

    // Reset connect button
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.textContent = '🚀 Connect MetaMask Wallet';
        connectBtn.disabled = false;
    }

    // Hide wallet status and show connect section
    document.getElementById('walletStatus')?.classList.add('hidden');
    document.getElementById('registrationSection')?.classList.add('hidden');
    document.getElementById('alreadyRegisteredSection')?.classList.add('hidden');
    document.getElementById('walletSection')?.classList.remove('hidden');

    showAlert('Wallet disconnected. You can now connect a different account.', 'success');
}

function showLoading(show) {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.classList.toggle('active', show);
}

function showAlert(message, type) {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        max-width: 400px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;

    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Role selection functionality
document.addEventListener('DOMContentLoaded', function () {
    const roleCards = document.querySelectorAll('.role-card');
    const userRoleInput = document.getElementById('userRole');
    const professionalFields = document.getElementById('professionalFields');

    roleCards.forEach(card => {
        card.addEventListener('click', function () {
            // Remove selected class from all cards
            roleCards.forEach(c => c.classList.remove('selected'));

            // Add selected class to clicked card
            this.classList.add('selected');

            // Set the role value
            const role = this.dataset.role;
            if (userRoleInput) userRoleInput.value = role;

            // Track role selection (safe check)
            if (typeof trackUserAction === 'function') {
                trackUserAction('role_selected', 'registration');
            }
            if (typeof trackEvent === 'function') {
                trackEvent('role_selection', {
                    event_category: 'registration',
                    role_type: roleNames[parseInt(role)] || 'Unknown',
                    role_id: role
                });
            }

            // Show/hide professional fields
            if (professionalFields) {
                if (role === '1') { // Public Viewer
                    professionalFields.classList.remove('show');
                    document.getElementById('badgeNumber').required = false;
                    document.getElementById('department').required = false;
                    document.getElementById('jurisdiction').required = false;
                } else {
                    professionalFields.classList.add('show');
                    document.getElementById('badgeNumber').required = true;
                    document.getElementById('department').required = true;
                    document.getElementById('jurisdiction').required = true;
                }
            }
        });
    });
});

// Ethereum event listeners
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => location.reload());
    window.ethereum.on('chainChanged', () => location.reload());
}

// Error Handling & Network Helpers
function showErrorModal(title, description, actionText = null, actionCallback = null) {
    const modal = document.getElementById('errorModal');
    const titleEl = document.getElementById('errorTitle');
    const descEl = document.getElementById('errorDescription');
    const actionBtn = document.getElementById('errorActionBtn');

    if (modal && titleEl && descEl) {
        titleEl.textContent = title;
        descEl.innerHTML = description; // Allow HTML for links

        if (actionText && actionCallback) {
            actionBtn.textContent = actionText;
            actionBtn.onclick = actionCallback;
            actionBtn.classList.remove('hidden');
        } else {
            actionBtn.classList.add('hidden');
        }

        modal.classList.add('active');
    } else {
        // Fallback if modal is missing
        showAlert(`${title}: ${description.replace(/<[^>]*>/g, '')}`, 'error');
    }
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) modal.classList.remove('active');
}

async function checkNetwork() {
    if (!window.ethereum) return false;

    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

    // config.TARGET_CHAIN_ID is '0xaa36a7' (Sepolia)
    if (currentChainId.toLowerCase() !== config.TARGET_CHAIN_ID.toLowerCase()) {
        const networkName = config.NETWORK_NAME;

        showErrorModal(
            'Wrong Network',
            `Please switch your wallet to <strong>${networkName}</strong> to continue.`,
            `Switch to ${networkName}`,
            async () => {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: config.TARGET_CHAIN_ID }],
                    });
                    closeErrorModal();
                    // Reload or re-connect could happen here, chainChanged event will reload page
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        showErrorModal(
                            'Network Not Found',
                            `The ${networkName} is not added to your MetaMask. Please add it manually.`,
                            null, null
                        );
                    } else {
                        showErrorModal('Switch Failed', 'Failed to switch network. Please try explicitly from your wallet.');
                    }
                }
            }
        );
        return false;
    }
    return true;
}