require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// -- Shared config --
const { PORT, connectedUsers } = require('./config');
const { validateWalletAddress } = require('./middleware/verifyAdmin');
const { limiter } = require('./middleware/rateLimiters');
const { setIO: setNotificationIO } = require('./services/notificationService');
const { setIO: setNotificationControllerIO } = require('./controllers/notificationController');

// -- Shared CORS origins (single source of truth) --
const allowedOrigins = [
  'http://localhost:10000',
  'http://127.0.0.1:10000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || ['https://blockchain-evidence.onrender.com']).map(
    (url) => url.trim()
  )
].filter((url, index, self) => self.indexOf(url) === index); // Unique list

// -- Express + HTTP + Socket.IO --
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

// -- Security middlewares --
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://cdn.socket.io",
          "https://cdn.jsdelivr.net",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://vkqswulxmuuganmjqumb.supabase.co"],
        connectSrc: [
          "'self'",
          "https://vkqswulxmuuganmjqumb.supabase.co",
          "https://polygon-amoy.g.alchemy.com",
          "https://polygon-rpc.com",
          "https://api.emailjs.com",
          "wss://*.socket.io",
          "ws://localhost:10000",
        ],
        upgradeInsecureRequests: [],
      },
    },
  }),
); // Sets various security headers
app.use(cors({ origin: allowedOrigins, credentials: true })); // CORS

// -- WebSocket connection handling --
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (walletAddress) => {
    if (validateWalletAddress(walletAddress)) {
      connectedUsers.set(walletAddress, socket.id);
      socket.join(walletAddress);
      console.log(`User ${walletAddress} joined notifications`);
    }
  });

  socket.on('disconnect', () => {
    for (const [wallet, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(wallet);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// -- Middleware (ORDER IS CRITICAL!) --

// 1. JSON / BODY PARSER
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. STATIC FILES - BEFORE API ROUTES
//    Server-side page guard runs BEFORE static so privileged dashboard/tool
//    pages are authorized (401/403 or safe redirect) before any HTML is served.
const { protectPage } = require('./middleware/authorization');
app.use(protectPage);
app.use(express.static(path.join(__dirname, 'public')));

// 3. General rate limiter - applied to all API routes
app.use('/api/', limiter);

// 4. Cryptographic signature verification for wallet authentication
// SECURITY FIX: Applied BEFORE route registration so all API routes are covered.
// Auth routes are exempt because verifySignature skips requests with no recognized wallet field.
const { verifySignature } = require('./middleware/verifySignature');
app.use('/api/', verifySignature);

// 5. All routes
// SECURITY FIX: Removed duplicate app.use('/api/auth', authRoutes) that created wrong
// paths like /api/auth/auth/email/login and allowed bypassing verifySignature.
const registerRoutes = require('./routes');
registerRoutes(app);

// -- Error handling (ORDER: 404 handler BEFORE generic error handler) --

// 404 handler (must come BEFORE error handler - this is a regular middleware)
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Generic error handler (must be LAST - Express requires 4-arg signature)
app.use((error, req, res, _next) => {
  console.error('Unhandled error:', error);
  const status = error.status || 500;
  // SECURITY FIX: Never expose stack traces or internal error details in production
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
  res.status(status).json({ success: false, error: message });
});

// -- Start server (only when run directly, not when imported for testing) --
if (require.main === module) {
  // Resilience: never let a transient async/parse error silently kill the API.
  // Log it and keep serving (each unhandled error is also caught by the Express error handler).
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection (kept alive):', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception (kept alive):', err);
  });

  server.listen(PORT, () => {
    console.log(`EVID-DGC API Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`WebSocket notifications enabled`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
