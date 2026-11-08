const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Server-side revocation list for logged-out sessions. JWTs are stateless, so
 * logout adds the token's jti here. This makes logout take effect immediately
 * (survives refresh / back-button) without a full session store.
 */
const revokedTokens = new Set();

function revokeToken(jti) {
  if (jti) revokedTokens.add(jti);
}

function isRevoked(jti) {
  return jti ? revokedTokens.has(jti) : false;
}

// Periodic cleanup so the in-memory set cannot grow unbounded.
setInterval(() => {
  if (revokedTokens.size > 10000) revokedTokens.clear();
}, 60 * 60 * 1000).unref();

/**
 * Central, single-source permission map for the application.
 *
 * All role checks (page guards and API guards) MUST go through this map so the
 * authorization policy is defined in exactly one place. Do not duplicate role
 * lists across controllers and routes.
 *
 * Roles are the canonical set defined by the application:
 *   admin, public_viewer, investigator, forensic_analyst,
 *   legal_professional, court_official, evidence_manager, auditor
 */
const ROLES = [
  'admin',
  'public_viewer',
  'investigator',
  'forensic_analyst',
  'legal_professional',
  'court_official',
  'evidence_manager',
  'auditor',
];

const INTERNAL_ROLES = ROLES.filter((r) => r !== 'public_viewer');
const ALL_AUTH_ROLES = ROLES.slice();

/** role -> the dashboard page that role is entitled to land on */
const ROLE_DASHBOARD = {
  admin: 'admin.html',
  public_viewer: 'dashboard-public.html',
  investigator: 'dashboard-investigator.html',
  forensic_analyst: 'dashboard-analyst.html',
  legal_professional: 'dashboard-legal.html',
  court_official: 'dashboard-court.html',
  evidence_manager: 'dashboard-manager.html',
  auditor: 'dashboard-auditor.html',
};

/**
 * Protected static pages -> roles allowed to open them.
 * Any .html file NOT listed here is served normally (public pages, login, etc).
 */
const PROTECTED_PAGES = {
  'admin.html': ['admin'],
  'dashboard-public.html': ['public_viewer'],
  'dashboard-investigator.html': ['investigator'],
  'dashboard-analyst.html': ['forensic_analyst'],
  'dashboard-legal.html': ['legal_professional'],
  'dashboard-court.html': ['court_official'],
  'dashboard-manager.html': ['evidence_manager'],
  'dashboard-auditor.html': ['auditor'],
  'evidence-manager.html': ['evidence_manager'],
  'case-management.html': ['investigator', 'evidence_manager', 'legal_professional', 'court_official', 'admin'],
  'audit-trail.html': ['admin', 'auditor'],
  'legal-hold-management.html': ['legal_professional', 'evidence_manager', 'court_official', 'admin'],
  'retention-policy.html': ['evidence_manager', 'admin'],
  'evidence-comparison.html': INTERNAL_ROLES,
  'evidence-verification.html': INTERNAL_ROLES,
  'evidence-export.html': INTERNAL_ROLES,
  'evidence-tagging.html': INTERNAL_ROLES,
  'forensic-lab.html': INTERNAL_ROLES,
  'timeline-visualization.html': INTERNAL_ROLES,
  'system-health.html': INTERNAL_ROLES,
  'account-settings.html': ALL_AUTH_ROLES,
  'profile.html': ALL_AUTH_ROLES,
  'dashboard.html': ALL_AUTH_ROLES,
};

/** Returns the dashboard file name a role should be redirected to, or null. */
function dashboardForRole(role) {
  return ROLE_DASHBOARD[role] || null;
}

/** Parse the JWT from either the cookie or the Authorization Bearer header. */
function extractToken(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    cookies[k] = v;
  });
  if (cookies.evid_token) return cookies.evid_token;

  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

/**
 * Verify the request's token and return the verified user identity.
 * Returns { user, error }. `user` shape mirrors requireAuth: { id, role, ... }.
 * Never trusts a role supplied by the client body/query/localStorage.
 */
function verifyRequestIdentity(req) {
  if (!JWT_SECRET) {
    return { user: null, error: 'JWT_SECRET not configured' };
  }
  const token = extractToken(req);
  if (!token) return { user: null, error: 'no_token' };

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || !payload.userId) return { user: null, error: 'invalid_token' };
    if (isRevoked(payload.jti)) return { user: null, error: 'revoked_token' };
    return {
      user: {
        id: payload.userId,
        email: payload.email || null,
        wallet_address: payload.walletAddress || payload.wallet_address || null,
        role: payload.role || null,
      },
      error: null,
    };
  } catch (err) {
    return { user: null, error: 'invalid_token' };
  }
}

/**
 * API guard factory. Authenticates, then checks the user's verified role.
 * - no valid session -> 401
 * - valid session, wrong role -> 403
 * Usage: router.get('/x', requireRole('admin','auditor'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    const { user, error } = verifyRequestIdentity(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!user.role || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient privileges' });
    }
    req.user = req.user || user;
    next();
  };
}

/**
 * Static-page guard. Registered BEFORE express.static so it can short-circuit
 * requests for privileged dashboard/tool pages.
 *
 * Behaviour:
 *  - Unauthenticated -> 401 JSON for API-like requests, else redirect to home.
 *  - Authenticated but wrong role -> 403 JSON, else redirect to own dashboard.
 *  - Allowed -> next() so express.static serves the file.
 */
function protectPage(req, res, next) {
  const fileName = req.path.split('?')[0].split('/').pop();
  const allowed = PROTECTED_PAGES[fileName];
  if (!allowed) return next();

  const { user, error } = verifyRequestIdentity(req);
  const acceptsHtml = (req.headers.accept || '').includes('text/html');

  if (!user || !user.role) {
    if (acceptsHtml) return res.redirect('/?auth=required');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (!allowed.includes(user.role)) {
    const own = dashboardForRole(user.role) || 'dashboard.html';
    if (acceptsHtml) return res.redirect('/' + own + '?auth=denied');
    return res.status(403).json({ success: false, error: 'Forbidden: role not permitted' });
  }

  return next();
}

module.exports = {
  ROLES,
  INTERNAL_ROLES,
  ALL_AUTH_ROLES,
  ROLE_DASHBOARD,
  PROTECTED_PAGES,
  dashboardForRole,
  extractToken,
  verifyRequestIdentity,
  requireRole,
  protectPage,
  revokeToken,
  isRevoked,
};
