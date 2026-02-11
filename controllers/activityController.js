const { supabase } = require('../config');

const logActivity = async (req, res) => {
    try {
        const { user_id, action, details } = req.body;
        if (!user_id || !action) {
            return res.status(400).json({ error: 'User ID and action are required' });
        }
        const { error } = await supabase
            .from('activity_logs')
            .insert({
                user_id,
                action,
                details: typeof details === 'string' ? details : JSON.stringify(details),
                timestamp: new Date().toISOString()
            });
        if (error) throw error;
        res.json({ success: true, message: 'Activity logged successfully' });
    } catch (error) {
        console.error('Activity logging error:', error);
        res.status(500).json({ error: 'Failed to log activity' });
    }
};

module.exports = { logActivity };
