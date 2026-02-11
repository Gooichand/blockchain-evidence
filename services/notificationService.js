const { supabase, connectedUsers } = require('../config');

// io instance will be set after server initialization
let io = null;

const setIO = (socketIO) => {
    io = socketIO;
};

const createNotification = async (userWallet, title, message, type, data = {}) => {
    try {
        const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
                user_wallet: userWallet,
                title,
                message,
                type,
                data
            })
            .select()
            .single();

        if (error) throw error;

        // Send real-time notification if user is connected
        if (io && connectedUsers.has(userWallet)) {
            io.to(userWallet).emit('notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

const notifyMultipleUsers = async (userWallets, title, message, type, data = {}) => {
    const notifications = userWallets.map(wallet => ({
        user_wallet: wallet,
        title,
        message,
        type,
        data
    }));

    try {
        const { data: createdNotifications, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;

        // Send real-time notifications
        createdNotifications.forEach(notification => {
            if (io && connectedUsers.has(notification.user_wallet)) {
                io.to(notification.user_wallet).emit('notification', notification);
            }
        });

        return createdNotifications;
    } catch (error) {
        console.error('Error creating multiple notifications:', error);
    }
};

module.exports = {
    setIO,
    createNotification,
    notifyMultipleUsers
};
