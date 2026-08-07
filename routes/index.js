const healthRoutes = require('./healthRoutes');
const notificationRoutes = require('./notificationRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const evidenceRoutes = require('./evidenceRoutes');
const tagRoutes = require('./tagRoutes');
const retentionRoutes = require('./retentionRoutes');
const caseRoutes = require('./caseRoutes');
const activityRoutes = require('./activityRoutes');
const blockchainRoutes = require('./blockchainRoutes');
const monitoringRoutes = require('./monitoringRoutes');
const contactRoutes = require('./contactRoutes');
const publicRoutes = require('./publicRoutes');
const analystRoutes = require('./analystRoutes');
const auditRoutes = require('./auditRoutes');
const legalRoutes = require('./legalRoutes');
const courtRoutes = require('./courtRoutes');
const legalHoldRoutes = require('./legalHoldRoutes');

function registerRoutes(app) {
  app.use('/api', healthRoutes);
  app.use('/api', notificationRoutes);
  app.use('/api', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', tagRoutes);
  app.use('/api', evidenceRoutes);
  app.use('/api', retentionRoutes);
  app.use('/api', caseRoutes);
  app.use('/api', activityRoutes);
  app.use('/api/blockchain', blockchainRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api', contactRoutes);
  app.use('/api', publicRoutes);
  app.use('/api', analystRoutes);
  app.use('/api', auditRoutes);
  app.use('/api', legalRoutes);
  app.use('/api', courtRoutes);
  app.use('/api', legalHoldRoutes);
}

module.exports = registerRoutes;
