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

function registerRoutes(app) {
    app.use('/api', healthRoutes);
    app.use('/api', notificationRoutes);
    app.use('/api', authRoutes);
    app.use('/api', userRoutes);
    app.use('/api', adminRoutes);
    app.use('/api', evidenceRoutes);
    app.use('/api', tagRoutes);
    app.use('/api', retentionRoutes);
    app.use('/api', caseRoutes);
    app.use('/api', activityRoutes);
}

module.exports = registerRoutes;
