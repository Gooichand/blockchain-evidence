// Simplified Navbar functionality for EVID-DGC System
document.addEventListener('DOMContentLoaded', function() {
    // Navbar elements
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
            if (navToggle) navToggle.classList.remove('active');
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
        if (walletStatusMini && walletAddressMini && connectWalletNav) {
            if (address) {
                walletStatusMini.classList.remove('hidden');
                connectWalletNav.classList.add('hidden');
                walletAddressMini.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
            } else {
                walletStatusMini.classList.add('hidden');
                connectWalletNav.classList.remove('hidden');
            }
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
    
    // Check if user is already connected
    function checkExistingConnection() {
        if (typeof web3 !== 'undefined' && web3.currentProvider && web3.currentProvider.selectedAddress) {
            updateNavWalletStatus(web3.currentProvider.selectedAddress);
        }
    }
    
    // Check initial wallet state
    setTimeout(checkExistingConnection, 1000);
    
    // Role card selection
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            roleCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            // Update hidden input
            const roleInput = document.getElementById('userRole');
            if (roleInput) {
                roleInput.value = this.getAttribute('data-role');
            }
            
            // Toggle professional fields
            const professionalFields = document.getElementById('professionalFields');
            if (professionalFields) {
                if (this.getAttribute('data-role') === '1') {
                    professionalFields.classList.add('hidden');
                } else {
                    professionalFields.classList.remove('hidden');
                }
            }
        });
    });
    
    // Override disconnectWallet to update navbar
    if (typeof disconnectWallet === 'function') {
        const originalDisconnectWallet = disconnectWallet;
        window.disconnectWallet = function() {
            originalDisconnectWallet();
            
            // Update navbar
            updateNavWalletStatus(null);
            
            showToast('Wallet disconnected', 'info');
        };
    }
});