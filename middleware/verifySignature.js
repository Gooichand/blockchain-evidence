const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// In-memory store for used nonces to prevent replay attacks
const usedNonces = new Map();

// Periodically clean up expired nonces
setInterval(
  () => {
    const now = Date.now();
    for (const [nonce, expiry] of usedNonces.entries()) {
      if (now > expiry) {
        usedNonces.delete(nonce);
      }
    }
  },
  15 * 60 * 1000, // Cleanup every 15 mins
).unref();

/**
 * SECURITY FIX: Global signature verification middleware.
 * This middleware verifies that the caller owns the wallet address they claim to be.
 * It uses EIP-191 / ERC-1271 style message signing.
 */
const verifySignature = (req, res, next) => {
  try {
    // SECURITY FIX: Exempt auth routes. They perform their own authentication
    // (bcrypt for email login, nonce+ECDSA for wallet registration, and the
    // wallet login is a verified-address lookup). Requiring a per-request
    // signature here would break the login flow, since the user has not yet
    // established a session.
    if (req.path.startsWith('/auth/')) {
      return next();
    }

    // SECURITY FIX: A valid Bearer JWT establishes a verified identity for
    // email-based sessions (which have no wallet signature). Trust the signed
    // token and skip the wallet-signature requirement for these requests.
    const authHeader = (req.headers && req.headers['authorization']) || '';
    if (authHeader.startsWith('Bearer ') && JWT_SECRET) {
      try {
        const payload = jwt.verify(authHeader.slice(7).trim(), JWT_SECRET);
        if (payload && payload.userId) {
          req.authenticatedWallet =
            (payload.walletAddress || payload.wallet_address || '').toLowerCase() || undefined;
          req.jwtUser = payload;
          return next();
        }
      } catch (_) {
        // Invalid/expired JWT — fall through to wallet-signature checks.
      }
    }

    // A valid httpOnly session cookie also establishes a verified identity for
    // email-based sessions. Trust it and skip the wallet-signature requirement
    // so email sessions work even when only the cookie (not a Bearer header) is sent.
    const cookieHeader = (req.headers && req.headers.cookie) || '';
    const cookieMatch = /(?:^|;\s*)evid_token=([^;]+)/.exec(cookieHeader);
    if (cookieMatch && JWT_SECRET) {
      try {
        const payload = jwt.verify(decodeURIComponent(cookieMatch[1]), JWT_SECRET);
        if (payload && payload.userId) {
          req.authenticatedWallet =
            (payload.walletAddress || payload.wallet_address || '').toLowerCase() || undefined;
          req.jwtUser = payload;
          return next();
        }
      } catch (_) {
        // Invalid/expired cookie — fall through to wallet-signature checks.
      }
    }

    // SECURITY FIX: Standardized list of possible wallet identity fields
    const body = req.body || {};
    const query = req.query || {};
    let claimedWallet =
      req.headers['x-user-wallet'] ||
      body.userWallet ||
      query.userWallet ||
      body.adminWallet ||
      query.adminWallet ||
      body.wallet ||
      query.wallet;

    /**
     * If no wallet is claimed, we proceed.
     * Protected controllers MUST check for req.authenticatedWallet.
     * This allows public routes (like health checks) to function.
     */
    if (!claimedWallet) {
      return next();
    }

    // A wallet claim must be a properly-formatted 0x address. Anything else is
    // malformed: reject it (no valid Bearer/cookie identity was established above,
    // so this is not a legitimate email session).
    if (typeof claimedWallet !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(claimedWallet)) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address format' });
    }

    const { signature, message } = req.headers;

    // If they claimed a wallet, they MUST provide proof
    if (!signature || !message) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing cryptographic signature or message payload.',
      });
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(message);
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid message format. Expected JSON.' });
    }

    const { nonce, timestamp, method, path } = parsedPayload;

    if (!nonce || !timestamp) {
      return res.status(400).json({ success: false, error: 'Message payload missing nonce or timestamp.' });
    }

    // SECURITY FIX: Strict timestamp verification (max 5 mins old)
    const MAX_AGE = 5 * 60 * 1000;
    const messageTime = new Date(timestamp).getTime();
    if (isNaN(messageTime) || Math.abs(Date.now() - messageTime) > MAX_AGE) {
      return res.status(401).json({ success: false, error: 'Signature timestamp expired or clock desync.' });
    }

    // Replay Attack Protection
    const nonceKey = `${claimedWallet.toLowerCase()}:${nonce}`;
    if (usedNonces.has(nonceKey)) {
      return res.status(401).json({ success: false, error: 'Replay detected. This signature has already been used.' });
    }

    // Domain Binding: HTTP Method & Path
    if (method && method.toUpperCase() !== req.method.toUpperCase()) {
      return res.status(401).json({ success: false, error: 'Signature method mismatch' });
    }

    // Check path (ignoring query params)
    if (path) {
      const requestPath = req.originalUrl.split('?')[0];
      if (requestPath !== path && req.path !== path) {
        return res.status(401).json({ success: false, error: 'Signature path mismatch' });
      }
    }

    // Cryptographic recovery
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== claimedWallet.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Signature does not match claimed wallet.' });
    }

    // Mark nonce as used
    usedNonces.set(nonceKey, messageTime + MAX_AGE);

    // Establish verified identity
    req.authenticatedWallet = recoveredAddress.toLowerCase();
    next();
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(401).json({ success: false, error: 'Invalid cryptographic signature' });
  }
};

module.exports = { verifySignature };
