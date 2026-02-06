let userAccount;

// Initialize application
function initializeApp() {
    console.log('Initializing EVID-DGC application...');
    
    try {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
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
        
        // Add click handler for wallet connection
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.onclick = connectWallet;
        }
        
        // Initialize forms
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistration);
        }
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Application initialization failed. Please refresh the page.', 'error');
    }
}

// Navigation functions
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Email login functions
function showEmailLogin() {
    console.log('Showing email login modal...');
    const modal = document.getElementById('emailLoginModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeEmailLogin() {
    const modal = document.getElementById('emailLoginModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showEmailRegistration() {
    const modal = document.getElementById('emailRegistrationModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeEmailRegistration() {
    const modal = document.getElementById('emailRegistrationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Email login handler
async function handleEmailLogin(event) {
    event.preventDefault();
    console.log('Handling email login...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
    }
    
    try {
        showLoading(true, 'Logging in...');
        
        const response = await fetch(`${config.API_BASE_URL}/auth/email-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user data
            localStorage.setItem('currentUser', JSON.stringify({
                type: 'email',
                user: data.user
            }));
            
            showAlert('Login successful!', 'success');
            closeEmailLogin();
            
            // Check if admin
            if (data.user.role === 'admin') {
                displayAdminOptions(data.user);
                toggleSections('adminOptions');
            } else {
                displayUserInfo(data.user);
                toggleSections('alreadyRegistered');
            }
        } else {
            showAlert(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle email registration
async function handleEmailRegistration(event) {
    event.preventDefault();
    console.log('Handling email registration...');

    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const fullName = document.getElementById('regFullName').value;
    const role = document.getElementById('regRole').value;

    console.log('Registration data:', { email, fullName, role });

    if (password !== confirmPassword) {
        showAlert('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters.', 'error');
        return;
    }

    if (!fullName || !role) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }

    try {
        showLoading(true, 'Creating account...');
        
        const response = await fetch(`${config.API_BASE_URL}/auth/email-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password,
                fullName: fullName.trim(),
                role,
                department: 'General',
                jurisdiction: 'General'
            })
        });
        
        const data = await response.json();
        console.log('Registration response:', data);
        
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify({
                type: 'email',
                user: data.user
            }));
            
            showAlert('Registration successful! Redirecting to dashboard...', 'success');
            closeEmailRegistration();
            
            setTimeout(() => {
                window.location.href = getDashboardUrl(data.user.role);
            }, 1500);
        } else {
            showAlert(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Initialize email login functionality
function initializeEmailLogin() {
    const emailLoginForm = document.getElementById('emailLoginForm');
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', handleEmailLogin);
    }
    
    const emailRegForm = document.getElementById('emailRegistrationForm');
    if (emailRegForm) {
        emailRegForm.addEventListener('submit', handleEmailRegistration);
    }
}

// Wallet connection
async function connectWallet() {
    console.log('Attempting to connect wallet...');
    closeErrorModal();

    if (!navigator.onLine) {
        showErrorModal('No Internet Connection', 'Please check your network settings and try again.');
        return;
    }

    try {
        showLoading(true, 'Connecting to MetaMask...');

        if (!window.ethereum) {
            showLoading(false);
            showErrorModal(
                'MetaMask Not Found',
                'MetaMask is not installed. Please install it to use this application.',
                'Install MetaMask',
                () => window.open('https://metamask.io/download/', '_blank')
            );
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            showLoading(false);
            showErrorModal('Account Access Required', 'Please unlock your MetaMask wallet and select an account.');
            return;
        }

        userAccount = accounts[0];
        console.log('Wallet connected:', userAccount);
        
        // Check if we're on the correct network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== config.TARGET_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: config.TARGET_CHAIN_ID }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    // Network not added to MetaMask
                    showErrorModal(
                        'Network Not Found',
                        `Please add ${config.NETWORK_NAME} to your MetaMask wallet.`
                    );
                } else {
                    console.error('Network switch error:', switchError);
                }
                showLoading(false);
                return;
            }
        }
        
        localStorage.setItem('wasConnected', 'true');
        
        updateWalletUI();
        await checkRegistrationStatus();
        showLoading(false);

    } catch (error) {
        showLoading(false);
        console.error('Wallet connection error:', error);

        if (error.code === 4001) {
            showErrorModal('Connection Rejected', 'You rejected the connection request. This app requires a wallet connection to function.', 'Try Again', connectWallet);
        } else {
            showErrorModal('Connection Failed', error.message || 'An unexpected error occurred.');
        }
    }
}

function updateWalletUI() {
    const walletAddr = document.getElementById('walletAddress');
    const walletStatus = document.getElementById('walletStatus');
    const connectBtn = document.getElementById('connectWallet');

    if (walletAddr) {
        walletAddr.textContent = userAccount;
    }

    if (walletStatus) {
        walletStatus.classList.remove('hidden');
    }

    if (connectBtn) {
        connectBtn.innerHTML = '<i data-lucide="check"></i> Connected';
        connectBtn.disabled = true;
        connectBtn.classList.add('btn-success');
        lucide.createIcons();
    }
}

// Check registration status
async function checkRegistrationStatus() {
    console.log('Checking registration status for:', userAccount);
    
    if (!userAccount) {
        showAlert('Please connect your wallet first', 'error');
        return;
    }
    
    try {
        showLoading(true, 'Checking registration...');
        
        const response = await fetch(`${config.API_BASE_URL}/user/${userAccount}`);
        const data = await response.json();
        
        if (data.user) {
            console.log('Found existing user:', data.user);
            
            // Store user data
            localStorage.setItem('currentUser', JSON.stringify({
                type: 'wallet',
                user: data.user
            }));
            
            displayUserInfo(data.user);
            
            if (data.user.role === 'admin') {
                displayAdminOptions(data.user);
                toggleSections('adminOptions');
            } else {
                toggleSections('alreadyRegistered');
            }
        } else {
            console.log('No existing user found, showing registration');
            toggleSections('registration');
        }
    } catch (error) {
        console.error('Error checking registration:', error);
        showAlert('Error checking registration status', 'error');
        toggleSections('registration');
    } finally {
        showLoading(false);
    }
}

function displayAdminOptions(userData) {
    const userName = document.getElementById('adminUserName');
    const userRoleName = document.getElementById('adminUserRoleName');

    if (userName) {
        userName.textContent = userData.fullName || 'Administrator';
    }

    if (userRoleName) {
        userRoleName.textContent = 'Administrator';
    }
}

function displayUserInfo(userData) {
    const userName = document.getElementById('userName');
    const userRoleName = document.getElementById('userRoleName');

    if (userName) {
        userName.textContent = userData.full_name || userData.fullName || 'User';
    }

    if (userRoleName) {
        const roleName = userData.role.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        userRoleName.textContent = roleName;
    }
}

function toggleSections(active) {
    const sections = ['wallet', 'registration', 'alreadyRegistered', 'adminOptions'];

    sections.forEach(id => {
        const element = document.getElementById(id + 'Section');
        if (element) {
            element.classList.toggle('hidden', id !== active);
        }
    });
}

// Registration handler
async function handleRegistration(event) {
    event.preventDefault();

    try {
        const role = document.getElementById('userRole')?.value;
        const fullName = document.getElementById('fullName')?.value;
        const badgeNumber = document.getElementById('badgeNumber')?.value;
        const department = document.getElementById('department')?.value;
        const jurisdiction = document.getElementById('jurisdiction')?.value;

        console.log('Wallet registration data:', { role, fullName, userAccount });

        if (!role || !fullName) {
            showAlert('Please select a role and enter your full name.', 'error');
            return;
        }

        if (!userAccount) {
            showAlert('Please connect your wallet first.', 'error');
            return;
        }

        showLoading(true, 'Registering user...');
        
        const response = await fetch(`${config.API_BASE_URL}/auth/wallet-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: userAccount.toLowerCase(),
                fullName: fullName.trim(),
                role: role,
                badgeNumber: badgeNumber || '',
                department: department || 'General',
                jurisdiction: jurisdiction || 'General'
            })
        });
        
        const data = await response.json();
        console.log('Wallet registration response:', data);
        
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify({
                type: 'wallet',
                user: data.user
            }));
            
            showAlert('Registration successful! Redirecting to dashboard...', 'success');
            
            setTimeout(() => {
                window.location.href = getDashboardUrl(data.user.role);
            }, 2000);
        } else {
            showAlert(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration failed:', error);
        showAlert('Registration failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Navigation functions
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function goToAdminDashboard() {
    window.location.href = 'admin.html';
}

function logout() {
    localStorage.clear();
    userAccount = null;

    const walletStatus = document.getElementById('walletStatus');
    const connectBtn = document.getElementById('connectWallet');

    if (walletStatus) walletStatus.classList.add('hidden');
    if (connectBtn) {
        connectBtn.innerHTML = '<i data-lucide="link"></i> Connect MetaMask';
        connectBtn.disabled = false;
        connectBtn.classList.remove('btn-success');
        lucide.createIcons();
    }

    initializeSections();
    showAlert('Logged out successfully', 'info');
}

function disconnectWallet() {
    userAccount = null;
    localStorage.removeItem('wasConnected');

    const walletStatus = document.getElementById('walletStatus');
    const connectBtn = document.getElementById('connectWallet');

    if (walletStatus) walletStatus.classList.add('hidden');
    if (connectBtn) {
        connectBtn.innerHTML = '<i data-lucide="link"></i> Connect MetaMask';
        connectBtn.disabled = false;
        connectBtn.classList.remove('btn-success');
        lucide.createIcons();
    }

    initializeSections();
    showAlert('Wallet disconnected successfully', 'info');
}

// Initialize sections
function initializeSections() {
    const sections = ['walletStatus', 'registrationSection', 'alreadyRegisteredSection', 'adminOptionsSection'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    const walletSection = document.getElementById('walletSection');
    if (walletSection) {
        walletSection.classList.remove('hidden');
    }
}

// Initialize navigation
function initializeNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');

            const icon = menuToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });

        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }
        });
    }
}

// Initialize scroll up button
function initializeScrollUp() {
    const scrollBtn = document.getElementById('scrollUpBtn');

    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize role selection
function initializeRoleSelection() {
    const roleCards = document.querySelectorAll('.role-card');
    const userRoleInput = document.getElementById('userRole');

    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            roleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            const roleValue = card.getAttribute('data-role');
            if (userRoleInput) {
                userRoleInput.value = roleValue;
            }
        });
    });
}

// Initialize particles
function initializeParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 25 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Initialize FAQ
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                item.classList.toggle('active');
                lucide.createIcons();
            });
        }
    });
}

// Loading functions
function showLoading(show, message = 'Loading...') {
    const loader = document.getElementById('loader');
    if (loader) {
        if (show) {
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
        }
    }
}

// Alert system
function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="${getAlertIcon(type)}" style="width: 16px; height: 16px;"></i>
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

    alert.addEventListener('click', () => {
        alert.remove();
    });
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    return icons[type] || 'info';
}

// Error modal functions
function showErrorModal(title, description, actionText = null, actionCallback = null) {
    const modal = document.getElementById('errorModal');
    const titleEl = document.getElementById('errorTitle');
    const descEl = document.getElementById('errorDescription');
    const actionBtn = document.getElementById('errorActionBtn');

    if (modal && titleEl && descEl) {
        titleEl.textContent = title;
        descEl.innerHTML = description;

        if (actionText && actionCallback) {
            actionBtn.textContent = actionText;
            actionBtn.onclick = actionCallback;
            actionBtn.classList.remove('hidden');
        } else {
            actionBtn.classList.add('hidden');
        }
        modal.classList.add('active');
    } else {
        showAlert(`${title}: ${description}`, 'error');
    }
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) modal.classList.remove('active');
}

// Ethereum event listeners
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            location.reload();
        }
    });

    window.ethereum.on('chainChanged', () => {
        location.reload();
    });
}

// Helper function to get dashboard URL based on role
function getDashboardUrl(role) {
    if (role === 'admin') {
        return 'dashboard-admin.html';
    }
    return `dashboard-${role.replace('_', '-')}.html`;
}

// Global exports
window.EVID_DGC = {
    connectWallet,
    disconnectWallet,
    logout,
    showAlert,
    scrollToSection,
    handleEmailRegistration,
    handleEmailLogin
};

// Global error handlers
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});