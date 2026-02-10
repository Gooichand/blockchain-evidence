const { supabase, connectedUsers } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');

// io instance will be set after server initialization
let io = null;
const setIO = (socketIO) => { io = socketIO; };

// Get user notifications
const getNotifications = async (req, res) => {
    try {
        const { wallet } = req.params;
        const { limit = 50, offset = 0, unread_only = false } = req.query;

        if (!validateWalletAddress(wallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_wallet', wallet)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) throw error;

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_wallet', wallet)
            .eq('is_read', false);

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_wallet', userWallet);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const { userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_wallet', userWallet)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

// Create notification (for testing)
const createTestNotification = async (req, res) => {
    try {
        const { userWallet, title, message, type, data } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        // Create notification object
        const notification = {
            id: Date.now(),
            user_wallet: userWallet,
            title,
            message,
            type,
            data,
            is_read: false,
            created_at: new Date().toISOString()
        };

        // Send real-time notification if user is connected
        if (io && connectedUsers.has(userWallet)) {
            io.to(userWallet).emit('notification', notification);
        }

        res.json({ success: true, notification });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

module.exports = {
    setIO,
    getNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification
};
