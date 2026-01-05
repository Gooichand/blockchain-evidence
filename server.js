const express = require('express');
const cors = require('cors');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Routes
const apiRoutes = require('./routes');
const authRoutes = require('./routes/auth.routes');
const auditLogsRoutes = require('./routes/auditLogs.routes');

// Middlewares
const { limiter } = require('./middlewares/rateLimiter.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rate limiting
app.use('/api/', limiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api", apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        service: 'EVID-DGC API'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🔐 EVID-DGC API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;