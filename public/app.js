/* =========================================================
   Evidence Management System – FINAL CLEAN VERSION
   ========================================================= */

let userAccount = null;

/* ================= ROLE DEFINITIONS ================= */

const roleNames = {
  1: 'Public Viewer',
  2: 'Investigator',
  3: 'Forensic Analyst',
  4: 'Legal Professional',
  5: 'Court Official',
  6: 'Evidence Manager',
  7: 'Auditor',
  8: 'Administrator'
};

const roleMapping = {
  1: 'public_viewer',
  2: 'investigator',
  3: 'forensic_analyst',
  4: 'legal_professional',
  5: 'court_official',
  6: 'evidence_manager',
  7: 'auditor',
  8: 'admin'
};

const dashboardRoutes = {
  public_viewer: 'dashboard-public.html',
  investigator: 'dashboard-investigator.html',
  forensic_analyst: 'dashboard-analyst.html',
  legal_professional: 'dashboard-legal.html',
  court_official: 'dashboard-court.html',
  evidence_manager: 'dashboard-manager.html',
  auditor: 'dashboard-auditor.html',
  admin: 'admin.html'
};

/* ================= INITIALIZE ================= */

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  bindUIEvents();

  if (window.ethereum) {
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length) await connectWallet();
    } catch {}
  }
}

/* ================= UI BINDINGS ================= */

function bindUIEvents() {
  document.getElementById('connectWallet')?.addEventListener('click', connectWallet);
  document.getElementById('registrationForm')?.addEventListener('submit', handleRegistration);
  document.getElementById('goToDashboard')?.addEventListener('click', goToDashboard);
}

/* ================= WALLET ================= */

async function connectWallet() {
  try {
    showLoading(true);

    if (!window.ethereum) {
      userAccount = '0xDEMO1234567890';
    } else {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      userAccount = accounts[0];
    }

    updateWalletUI();
    dispatchWalletEvent();
    await checkRegistrationStatus();
  } catch (e) {
    showAlert('Wallet connection failed', 'error');
  } finally {
    showLoading(false);
  }
}

function updateWalletUI() {
  document.getElementById('walletAddress').textContent = userAccount;
  document.getElementById('walletStatus')?.classList.remove('hidden');
  const btn = document.getElementById('connectWallet');
  if (btn) {
    btn.textContent = 'Connected';
    btn.disabled = true;
  }
}

function dispatchWalletEvent() {
  window.dispatchEvent(new CustomEvent('walletConnected', {
    detail: { address: userAccount }
  }));
}

/* ================= REGISTRATION CHECK ================= */

async function checkRegistrationStatus() {
  let user = null;

  try {
    const res = await fetch(`/api/user/${userAccount}`);
    if (res.ok) user = (await res.json()).user;
  } catch {}

  if (!user) {
    const local = localStorage.getItem(`evidUser_${userAccount}`);
    if (local) user = JSON.parse(local);
  }

  if (!user) return toggleSections('registration');

  if (user.is_active === false) {
    showAlert('Account deactivated', 'error');
    logout();
    return;
  }

  if (normalizeRole(user.role) === 'admin') {
    updateAdminUI(user);
  } else {
    updateUserUI(user);
  }

  toggleSections('alreadyRegistered');
}

/* ================= UI UPDATES ================= */

function updateUserUI(user) {
  setUserHeader(user, roleNames[getRoleId(user.role)]);
}

function updateAdminUI(user) {
  setUserHeader(user, '👑 Administrator');
  const btn = document.getElementById('goToDashboard');
  if (btn) {
    btn.textContent = '👑 Go to Admin Dashboard';
    btn.onclick = goToAdminDashboard;
  }
}

function setUserHeader(user, roleText) {
  document.getElementById('userName').textContent = user.fullName || user.full_name;
  document.getElementById('userRoleName').textContent = roleText;
  document.getElementById('userDepartment').textContent = user.department || '—';
}

/* ================= REGISTRATION ================= */

async function handleRegistration(e) {
  e.preventDefault();

  if (!userAccount) return showAlert('Connect wallet first', 'error');

  const data = getFormData();
  if (!data) return;

  if (data.role === 8) {
    return showAlert('Admin cannot self-register', 'error');
  }

  localStorage.setItem(`evidUser_${userAccount}`, JSON.stringify(data));
  localStorage.setItem('currentUser', userAccount);

  try {
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: userAccount,
        fullName: data.fullName,
        role: roleMapping[data.role],
        department: data.department,
        jurisdiction: data.jurisdiction,
        badgeNumber: data.badgeNumber
      })
    });
  } catch {}

  showAlert('Registration successful', 'success');
  setTimeout(goToDashboard, 1200);
}

function getFormData() {
  const fullName = document.getElementById('fullName')?.value;
  const role = parseInt(document.getElementById('userRole')?.value);

  if (!fullName || !role) {
    showAlert('Fill all required fields', 'error');
    return null;
  }

  return {
    fullName,
    role,
    department: document.getElementById('department')?.value || 'Public',
    jurisdiction: document.getElementById('jurisdiction')?.value || 'Public',
    badgeNumber: document.getElementById('badgeNumber')?.value || '',
    is_active: true
  };
}

/* ================= DASHBOARD ================= */

async function goToDashboard() {
  localStorage.setItem('currentUser', userAccount);

  try {
    const res = await fetch(`/api/user/${userAccount}`);
    if (!res.ok) throw Error();
    const role = normalizeRole((await res.json()).user.role);
    window.location.href = dashboardRoutes[role];
  } catch {
    window.location.href = 'dashboard.html';
  }
}

function goToAdminDashboard() {
  window.location.href = 'admin.html';
}

/* ================= HELPERS ================= */

function normalizeRole(role) {
  return typeof role === 'number' ? roleMapping[role] : role;
}

function getRoleId(role) {
  return typeof role === 'string'
    ? Number(Object.keys(roleMapping).find(k => roleMapping[k] === role))
    : role;
}

function toggleSections(active) {
  ['wallet', 'registration', 'alreadyRegistered'].forEach(id => {
    document.getElementById(`${id}Section`)?.classList.toggle('hidden', id !== active);
  });
}

/* ================= LOGOUT ================= */

function logout() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('evidUser_') || k === 'currentUser')
    .forEach(k => localStorage.removeItem(k));

  userAccount = null;
  location.replace('index.html');
}

/* ================= ALERTS & LOADING ================= */

function showLoading(show) {
  document.getElementById('loadingModal')?.classList.toggle('active', show);
}

function showAlert(msg, type) {
  document.querySelectorAll('.alert').forEach(a => a.remove());

  const el = document.createElement('div');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    background: type === 'success' ? '#28a745' : '#dc3545',
    color: '#fff',
    zIndex: 9999
  });

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ================= METAMASK EVENTS ================= */

if (window.ethereum) {
  ethereum.on('accountsChanged', () => location.reload());
  ethereum.on('chainChanged', () => location.reload());
}
