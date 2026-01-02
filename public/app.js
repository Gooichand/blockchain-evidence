// Clean Evidence Management System - Enhanced with Admin Management
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

async function initializeApp() {
    const connectBtn = document.getElementById('connectWallet');
    const regForm = document.getElementById('registrationForm');
    const dashBtn = document.getElementById('goToDashboard');
    
    if (connectBtn) connectBtn.addEventListener('click', connectWallet);
    if (regForm) regForm.addEventListener('submit', handleRegistration);
    if (dashBtn) dashBtn.addEventListener('click', goToDashboard);

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

async function connectWallet() {
    try {
        showLoading(true);
        
        // Track wallet connection attempt
        if (typeof trackUserAction === 'function') {
            trackUserAction('wallet_connect_attempt', 'authentication');
        }
        
        // Demo mode for testing without MetaMask
        if (!window.ethereum) {
            userAccount = '0x1234567890123456789012345678901234567890';
            updateWalletUI();
            await checkRegistrationStatus();
            showLoading(false);
            return;
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length === 0) {
            showAlert('No accounts found. Please unlock MetaMask.', 'error');
            showLoading(false);
            return;
        }
        
        userAccount = accounts[0];
        updateWalletUI();
        await checkRegistrationStatus();
        
        // Track successful wallet connection
        if (typeof trackUserAction === 'function') {
            trackUserAction('wallet_connected', 'authentication');
        }
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        console.error('Wallet connection error:', error);
        showAlert('Failed to connect wallet: ' + error.message, 'error');
        
        // Track wallet connection failure
        if (typeof trackUserAction === 'function') {
            trackUserAction('wallet_connect_failed', 'authentication');
        }
    }
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

async function checkRegistrationStatus() {
    try {
        if (!userAccount) {
            showAlert('Please connect your wallet first.', 'error');
            return;
        }
        
        // Check database for user first (primary source)
        let userInfo = null;
        if (typeof storage !== 'undefined') {
            try {
                userInfo = await storage.getUser(userAccount);
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
        
        // Try to save to database if available
        if (typeof storage !== 'undefined') {
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
                await storage.saveUser(userData);
                console.log('User saved to database');
            } catch (error) {
                console.log('Database save failed, using localStorage only');
            }
        }
        
        // Track successful registration
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

function getRoleClass(role) {
    const roleClasses = {
        1: 'public', 2: 'investigator', 3: 'forensic', 4: 'legal',
        5: 'court', 6: 'manager', 7: 'auditor', 8: 'admin'
    };
    return roleClasses[role] || 'public';
}

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
document.addEventListener('DOMContentLoaded', function() {
    const roleCards = document.querySelectorAll('.role-card');
    const userRoleInput = document.getElementById('userRole');
    const professionalFields = document.getElementById('professionalFields');
    
    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            roleCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Set the role value
            const role = this.dataset.role;
            if (userRoleInput) userRoleInput.value = role;
            
            // Track role selection
            if (typeof trackUserAction === 'function') {
                const roleName = roleNames[parseInt(role)] || 'Unknown';
                trackUserAction('role_selected', 'registration');
                trackEvent('role_selection', {
                    event_category: 'registration',
                    role_type: roleName,
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
// Navbar functionality
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const connectWalletNav = document.getElementById('connectWalletNav');
  const connectWalletMain = document.getElementById('connectWallet');
  const walletStatusMini = document.getElementById('walletStatusMini');
  const walletAddressMini = document.getElementById('walletAddressMini');
  
  // Mobile menu toggle
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      this.classList.toggle('active');
    });
  }
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.nav-container') && navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    }
  });
  
  // Connect wallet from navbar
  if (connectWalletNav) {
    connectWalletNav.addEventListener('click', function() {
      if (typeof connectWallet === 'function') {
        connectWallet();
      } else if (connectWalletMain) {
        connectWalletMain.click();
      }
    });
  }
  
  // Update wallet status in navbar
  function updateNavWalletStatus(address) {
    if (address) {
      walletStatusMini.classList.remove('hidden');
      connectWalletNav.classList.add('hidden');
      walletAddressMini.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    } else {
      walletStatusMini.classList.add('hidden');
      connectWalletNav.classList.remove('hidden');
    }
  }
  
  // Listen for wallet connection events
  window.addEventListener('walletConnected', function(e) {
    updateNavWalletStatus(e.detail.address);
  });
  
  // Scroll effect for navbar
  window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
  
  // Role-based link visibility (based on your existing logic)
  function updateNavForRole(role) {
    const adminLink = document.getElementById('adminLink');
    const dashboardLink = document.getElementById('dashboardLink');
    
    // Show/hide admin link based on role
    if (adminLink) {
      if (role === 'administrator') {
        adminLink.classList.remove('hidden');
      } else {
        adminLink.classList.add('hidden');
      }
    }
    
    // Show dashboard link if user is logged in
    if (dashboardLink) {
      if (role && role !== 'public') {
        dashboardLink.classList.remove('hidden');
      } else {
        dashboardLink.classList.add('hidden');
      }
    }
  }
  
  // Check initial wallet state
  if (typeof web3 !== 'undefined' && web3.currentProvider.selectedAddress) {
    updateNavWalletStatus(web3.currentProvider.selectedAddress);
  }
});
// Ethereum event listeners
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => location.reload());
    window.ethereum.on('chainChanged', () => location.reload());
}