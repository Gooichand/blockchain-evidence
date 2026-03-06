require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// ── Shared config ───────────────────────────────────────────────────────────
const { PORT, connectedUsers } = require('./config');
const { validateWalletAddress } = require('./middleware/verifyAdmin');
const { limiter } = require('./middleware/rateLimiters');
const { setIO: setNotificationIO } = require('./services/notificationService');
const { setIO: setNotificationControllerIO } = require('./controllers/notificationController');

// WebSocket security tracking
const activeConnections = new Map();
const connectionTimestamps = new Map();
const ipConnectionCounts = new Map();
const eventRateLimits = new Map(); // socket.id -> {event: deque of timestamps}

// Rate limiting constants
const MAX_CONNECTIONS_TOTAL = 1000;
const MAX_CONNECTIONS_PER_IP = 10;
const RATE_LIMIT_PER_MINUTE = 20; // messages per connection per minute

// ── Shared CORS origins (single source of truth) ───────────────────────────
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://blockchain-evidence.onrender.com']).map(
        (url) => url.trim(),
      )
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// ── WebSocket security helpers ──────────────────────────────────────────────
function getClientIP(socket) {
  return socket.handshake.address || socket.request.connection.remoteAddress;
}

function checkConnectionLimits(socket) {
  const clientIP = getClientIP(socket);
  
  if (activeConnections.size >= MAX_CONNECTIONS_TOTAL) {
    socket.emit('error', { message: 'Server connection limit reached' });
    socket.disconnect(true);
    return false;
  }
  
  const ipCount = ipConnectionCounts.get(clientIP) || 0;
  if (ipCount >= MAX_CONNECTIONS_PER_IP) {
    socket.emit('error', { message: 'Too many connections from your IP' });
    socket.disconnect(true);
    return false;
  }
  
  return true;
}

function checkRateLimit(socket, event) {
  const socketId = socket.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  if (!eventRateLimits.has(socketId)) {
    eventRateLimits.set(socketId, new Map());
  }
  
  const socketLimits = eventRateLimits.get(socketId);
  if (!socketLimits.has(event)) {
    socketLimits.set(event, []);
  }
  
  const timestamps = socketLimits.get(event);
  
  // Remove old timestamps
  while (timestamps.length > 0 && now - timestamps[0] > windowMs) {
    timestamps.shift();
  }
  
  if (timestamps.length >= RATE_LIMIT_PER_MINUTE) {
    socket.emit('error', { 
      message: `Rate limit exceeded for ${event}. Maximum ${RATE_LIMIT_PER_MINUTE} events per minute.` 
    });
    return false;
  }
  
  timestamps.push(now);
  return true;
}

// ── Express + HTTP + Socket.IO ──────────────────────────────────────────────
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Inject the io instance into services that need it
setNotificationIO(io);
setNotificationControllerIO(io);

// ── WebSocket connection handling ───────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Check connection limits
  if (!checkConnectionLimits(socket)) {
    return;
  }

  const clientIP = getClientIP(socket);
  activeConnections.set(socket.id, { ip: clientIP, connectedAt: Date.now() });
  ipConnectionCounts.set(clientIP, (ipConnectionCounts.get(clientIP) || 0) + 1);

  socket.on('join', (walletAddress) => {
    // Rate limit the join event
    if (!checkRateLimit(socket, 'join')) {
      return;
    }

    if (validateWalletAddress(walletAddress)) {
      connectedUsers.set(walletAddress, socket.id);
      socket.join(walletAddress);
      console.log(`User ${walletAddress} joined notifications`);
    } else {
      socket.emit('error', { message: 'Invalid wallet address' });
    }
  });

  // Add rate limiting to other potential events if needed
  // For example, if there were AI processing events, add them here

  socket.on('disconnect', () => {
    // Cleanup connection tracking
    if (activeConnections.has(socket.id)) {
      const { ip } = activeConnections.get(socket.id);
      activeConnections.delete(socket.id);
      const currentCount = ipConnectionCounts.get(ip) || 0;
      if (currentCount > 1) {
        ipConnectionCounts.set(ip, currentCount - 1);
      } else {
        ipConnectionCounts.delete(ip);
      }
    }

    // Cleanup from connectedUsers
    for (const [wallet, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(wallet);
        break;
      }
    }

    // Cleanup rate limits
    if (eventRateLimits.has(socket.id)) {
      eventRateLimits.delete(socket.id);
    }

    console.log('User disconnected:', socket.id);
  });
});

// ── Middleware (ORDER IS CRITICAL!) ─────────────────────────────────────────

// 1. CORS MUST BE FIRST
app.use(cors({ origin: allowedOrigins, credentials: true }));

// 2. JSON / BODY PARSER
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. STATIC FILES — BEFORE API ROUTES
app.use(express.static(path.join(__dirname, 'public')));

// 4. General rate limiter
app.use('/api/', limiter);

// 5. Cryptographic signature verification for wallet authentication
const { verifySignature } = require('./middleware/verifySignature');
app.use('/api/', verifySignature);

// ── Routes ──────────────────────────────────────────────────────────────────
const registerRoutes = require('./routes');
registerRoutes(app);

// ── Error handling (ORDER: 404 handler BEFORE generic error handler) ───────

// 404 handler (must come BEFORE error handler — this is a regular middleware)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Generic error handler (must be LAST — Express requires 4-arg signature)
app.use((error, req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server (only when run directly, not when imported for testing) ───
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🔐 EVID-DGC API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔔 WebSocket notifications enabled`);
  });
}

module.exports = app;
