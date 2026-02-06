/**
 * Two-Factor Authentication (2FA) System
 * Enhanced security for sensitive roles
 */

class TwoFactorAuth {
    constructor() {
        this.sensitiveRoles = ['admin', 'evidence_manager', 'court_official', 8, 6, 5];
        this.totpSecrets = new Map();
        this.backupCodes = new Map();
        this.init();
    }

    init() {
        this.loadStoredSecrets();
        this.setupEventListeners();
    }

    // Check if role requires 2FA
    requiresTwoFactor(role) {
        return this.sensitiveRoles.includes(role);
    }

    // Generate TOTP secret for user
    generateSecret(userId) {
        const secret = this.generateBase32Secret();
        this.totpSecrets.set(userId, {
            secret: secret,
            enabled: false,
            setupComplete: false,
            createdAt: new Date().toISOString()
        });
        this.saveSecrets();
        return secret;
    }

    // Generate QR code data for authenticator apps
    generateQRCodeData(userId, userEmail) {
        const secret = this.totpSecrets.get(userId)?.secret;
        if (!secret) return null;

        const issuer = 'EVID-DGC';
        const label = `${issuer}:${userEmail}`;
        return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    }

    // Verify TOTP code
    verifyTOTP(userId, code) {
        const userSecret = this.totpSecrets.get(userId);
        if (!userSecret || !userSecret.enabled) return false;

        const validCodes = this.generateValidCodes(userSecret.secret);
        return validCodes.includes(code.toString().padStart(6, '0'));
    }

    // Generate backup codes
    generateBackupCodes(userId) {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(this.generateRandomCode(8));
        }
        
        this.backupCodes.set(userId, {
            codes: codes,
            used: [],
            generatedAt: new Date().toISOString()
        });
        this.saveSecrets();
        return codes;
    }

    // Verify backup code
    verifyBackupCode(userId, code) {
        const userBackup = this.backupCodes.get(userId);
        if (!userBackup) return false;

        const codeIndex = userBackup.codes.indexOf(code);
        if (codeIndex === -1 || userBackup.used.includes(code)) return false;

        userBackup.used.push(code);
        this.saveSecrets();
        return true;
    }

    // Enable 2FA for user
    enable2FA(userId, verificationCode) {
        if (!this.verifyTOTP(userId, verificationCode)) {
            throw new Error('Invalid verification code');
        }

        const userSecret = this.totpSecrets.get(userId);
        userSecret.enabled = true;
        userSecret.setupComplete = true;
        userSecret.enabledAt = new Date().toISOString();
        
        this.saveSecrets();
        return this.generateBackupCodes(userId);
    }

    // Disable 2FA for user
    disable2FA(userId, verificationCode) {
        if (!this.verifyTOTP(userId, verificationCode) && !this.verifyBackupCode(userId, verificationCode)) {
            throw new Error('Invalid verification code');
        }

        this.totpSecrets.delete(userId);
        this.backupCodes.delete(userId);
        this.saveSecrets();
    }

    // Check if user has 2FA enabled
    is2FAEnabled(userId) {
        const userSecret = this.totpSecrets.get(userId);
        return userSecret && userSecret.enabled;
    }

    // Generate time-based codes
    generateValidCodes(secret) {
        const timeStep = 30;
        const currentTime = Math.floor(Date.now() / 1000);
        const codes = [];

        // Allow for time drift (previous, current, next)
        for (let i = -1; i <= 1; i++) {
            const time = Math.floor((currentTime + (i * timeStep)) / timeStep);
            codes.push(this.generateTOTPCode(secret, time));
        }

        return codes;
    }

    // Generate TOTP code for specific time
    generateTOTPCode(secret, time) {
        const key = this.base32Decode(secret);
        const timeBuffer = new ArrayBuffer(8);
        const timeView = new DataView(timeBuffer);
        timeView.setUint32(4, time, false);

        return this.hmacSHA1(key, new Uint8Array(timeBuffer))
            .then(hash => {
                const offset = hash[hash.length - 1] & 0xf;
                const code = ((hash[offset] & 0x7f) << 24) |
                           ((hash[offset + 1] & 0xff) << 16) |
                           ((hash[offset + 2] & 0xff) << 8) |
                           (hash[offset + 3] & 0xff);
                return (code % 1000000).toString().padStart(6, '0');
            });
    }

    // Generate base32 secret
    generateBase32Secret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }

    // Generate random backup code
    generateRandomCode(length) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Base32 decode
    base32Decode(encoded) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';
        
        for (let i = 0; i < encoded.length; i++) {
            const val = alphabet.indexOf(encoded.charAt(i).toUpperCase());
            if (val === -1) continue;
            bits += val.toString(2).padStart(5, '0');
        }

        const bytes = new Uint8Array(Math.floor(bits.length / 8));
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
        }
        
        return bytes;
    }

    // HMAC-SHA1
    async hmacSHA1(key, data) {
        const cryptoKey = await crypto.subtle.importKey(
            'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
        return new Uint8Array(signature);
    }

    // Storage methods
    saveSecrets() {
        const data = {
            secrets: Array.from(this.totpSecrets.entries()),
            backups: Array.from(this.backupCodes.entries()),
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('evid_2fa_data', JSON.stringify(data));
    }

    loadStoredSecrets() {
        try {
            const stored = localStorage.getItem('evid_2fa_data');
            if (stored) {
                const data = JSON.parse(stored);
                this.totpSecrets = new Map(data.secrets || []);
                this.backupCodes = new Map(data.backups || []);
            }
        } catch (error) {
            console.error('Error loading 2FA data:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeUI();
        });
    }

    // Initialize UI components
    initializeUI() {
        this.createSetupModal();
        this.createVerificationModal();
        this.addSecuritySettings();
    }

    // Create 2FA setup modal
    createSetupModal() {
        const modal = document.createElement('div');
        modal.id = 'twofa-setup-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Setup Two-Factor Authentication</h2>
                    <button class="modal-close" onclick="twoFactorAuth.closeSetupModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="setup-step-1" class="setup-step">
                        <h3>Step 1: Install Authenticator App</h3>
                        <p>Install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.</p>
                        <button class="btn btn-primary" onclick="twoFactorAuth.nextStep(2)">Next</button>
                    </div>
                    <div id="setup-step-2" class="setup-step hidden">
                        <h3>Step 2: Scan QR Code</h3>
                        <div id="qr-code-container"></div>
                        <p>Or enter this code manually: <code id="manual-code"></code></p>
                        <button class="btn btn-primary" onclick="twoFactorAuth.nextStep(3)">Next</button>
                    </div>
                    <div id="setup-step-3" class="setup-step hidden">
                        <h3>Step 3: Verify Setup</h3>
                        <p>Enter the 6-digit code from your authenticator app:</p>
                        <input type="text" id="verification-code" maxlength="6" placeholder="000000">
                        <button class="btn btn-success" onclick="twoFactorAuth.completeSetup()">Enable 2FA</button>
                    </div>
                    <div id="setup-step-4" class="setup-step hidden">
                        <h3>Setup Complete!</h3>
                        <p>Save these backup codes in a secure location:</p>
                        <div id="backup-codes"></div>
                        <button class="btn btn-primary" onclick="twoFactorAuth.closeSetupModal()">Done</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Create verification modal
    createVerificationModal() {
        const modal = document.createElement('div');
        modal.id = 'twofa-verify-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Two-Factor Authentication Required</h2>
                </div>
                <div class="modal-body">
                    <p>Enter your 6-digit authentication code:</p>
                    <input type="text" id="auth-code" maxlength="6" placeholder="000000">
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="twoFactorAuth.verifyLogin()">Verify</button>
                        <button class="btn btn-outline" onclick="twoFactorAuth.showBackupCodes()">Use Backup Code</button>
                    </div>
                    <div id="backup-code-section" class="hidden">
                        <p>Enter a backup code:</p>
                        <input type="text" id="backup-code" placeholder="XXXXXXXX">
                        <button class="btn btn-warning" onclick="twoFactorAuth.verifyBackup()">Verify Backup Code</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Add security settings to user interface
    addSecuritySettings() {
        // This will be called when user accesses security settings
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;

        const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUser) || '{}');
        if (this.requiresTwoFactor(userData.role)) {
            this.addSecurityPanel();
        }
    }

    // Add security panel to dashboard
    addSecurityPanel() {
        const container = document.querySelector('.container');
        if (!container) return;

        const securityCard = document.createElement('div');
        securityCard.className = 'card';
        securityCard.innerHTML = `
            <div class="card-header">
                <h2>🔐 Security Settings</h2>
                <p>Enhanced security for your account</p>
            </div>
            <div class="card-body">
                <div class="security-option">
                    <div class="security-info">
                        <h3>Two-Factor Authentication</h3>
                        <p>Add an extra layer of security to your account</p>
                    </div>
                    <div class="security-action">
                        <span id="2fa-status" class="status-badge">Disabled</span>
                        <button id="2fa-toggle" class="btn btn-primary" onclick="twoFactorAuth.toggle2FA()">Enable</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(securityCard);
        this.updateSecurityStatus();
    }

    // Update security status display
    updateSecurityStatus() {
        const currentUser = localStorage.getItem('currentUser');
        const statusElement = document.getElementById('2fa-status');
        const toggleButton = document.getElementById('2fa-toggle');
        
        if (this.is2FAEnabled(currentUser)) {
            statusElement.textContent = 'Enabled';
            statusElement.className = 'status-badge status-enabled';
            toggleButton.textContent = 'Disable';
            toggleButton.className = 'btn btn-danger';
        } else {
            statusElement.textContent = 'Disabled';
            statusElement.className = 'status-badge status-disabled';
            toggleButton.textContent = 'Enable';
            toggleButton.className = 'btn btn-primary';
        }
    }

    // Toggle 2FA
    toggle2FA() {
        const currentUser = localStorage.getItem('currentUser');
        if (this.is2FAEnabled(currentUser)) {
            this.showDisableModal();
        } else {
            this.showSetupModal();
        }
    }

    // Show setup modal
    showSetupModal() {
        const currentUser = localStorage.getItem('currentUser');
        const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUser) || '{}');
        
        const secret = this.generateSecret(currentUser);
        const qrData = this.generateQRCodeData(currentUser, userData.email || 'user@evid-dgc.com');
        
        document.getElementById('manual-code').textContent = secret;
        this.generateQRCode(qrData);
        
        document.getElementById('twofa-setup-modal').classList.add('active');
    }

    // Generate QR code
    generateQRCode(data) {
        const container = document.getElementById('qr-code-container');
        container.innerHTML = `
            <div class="qr-placeholder">
                <p>QR Code would be generated here</p>
                <p>Data: ${data}</p>
            </div>
        `;
    }

    // Navigation methods
    nextStep(step) {
        document.querySelectorAll('.setup-step').forEach(el => el.classList.add('hidden'));
        document.getElementById(`setup-step-${step}`).classList.remove('hidden');
    }

    closeSetupModal() {
        document.getElementById('twofa-setup-modal').classList.remove('active');
    }

    // Complete setup
    async completeSetup() {
        const currentUser = localStorage.getItem('currentUser');
        const code = document.getElementById('verification-code').value;
        
        try {
            const backupCodes = this.enable2FA(currentUser, code);
            this.displayBackupCodes(backupCodes);
            this.nextStep(4);
            this.updateSecurityStatus();
        } catch (error) {
            alert('Invalid verification code. Please try again.');
        }
    }

    // Display backup codes
    displayBackupCodes(codes) {
        const container = document.getElementById('backup-codes');
        container.innerHTML = codes.map(code => `<code>${code}</code>`).join(' ');
    }

    // Verify login
    verifyLogin() {
        const currentUser = localStorage.getItem('currentUser');
        const code = document.getElementById('auth-code').value;
        
        if (this.verifyTOTP(currentUser, code)) {
            this.closeVerifyModal();
            this.onVerificationSuccess();
        } else {
            alert('Invalid authentication code');
        }
    }

    // Show backup codes section
    showBackupCodes() {
        document.getElementById('backup-code-section').classList.remove('hidden');
    }

    // Verify backup code
    verifyBackup() {
        const currentUser = localStorage.getItem('currentUser');
        const code = document.getElementById('backup-code').value;
        
        if (this.verifyBackupCode(currentUser, code)) {
            this.closeVerifyModal();
            this.onVerificationSuccess();
        } else {
            alert('Invalid backup code');
        }
    }

    // Close verify modal
    closeVerifyModal() {
        document.getElementById('twofa-verify-modal').classList.remove('active');
    }

    // Handle successful verification
    onVerificationSuccess() {
        // Continue with login process
        console.log('2FA verification successful');
    }

    // Check if 2FA verification is required
    requiresVerification(userId, role) {
        return this.requiresTwoFactor(role) && this.is2FAEnabled(userId);
    }

    // Show verification modal
    showVerificationModal() {
        document.getElementById('twofa-verify-modal').classList.add('active');
        return new Promise((resolve, reject) => {
            this.verificationPromise = { resolve, reject };
        });
    }
}

// Initialize 2FA system
const twoFactorAuth = new TwoFactorAuth();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.twoFactorAuth = twoFactorAuth;
}