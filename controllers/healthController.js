const { PORT } = require('../config');

const getHealth = (req, res) => {
    console.log('🏥 Health check endpoint called');
    res.setHeader('Content-Type', 'application/json');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT
    });
};

module.exports = { getHealth };
