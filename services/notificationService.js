const { supabase, connectedUsers } = require('../config');

// io instance will be set after server initialization
let io = null;

const setIO = (socketIO) => {
  io = socketIO;
};

const createNotification = async (userWallet, title, message, type, data = {}) => {
  try {
    const { data: notification, error } = (await supabase
      .from('notifications')
      .insert({
        user_wallet: userWallet,
        title,
        message,
        type,
        data,
      })
      .select()
      .single()) || {};

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
  const notifications = userWallets.map((wallet) => ({
    user_wallet: wallet,
    title,
    message,
    type,
    data,
  }));

  try {
    const { data: createdNotifications, error } = (await supabase
      .from('notifications')
      .insert(notifications)
      .select()) || {};

    if (error) throw error;

    // Send real-time notifications
    createdNotifications.forEach((notification) => {
      if (io && connectedUsers.has(notification.user_wallet)) {
        io.to(notification.user_wallet).emit('notification', notification);
      }
    });

    return createdNotifications;
  } catch (error) {
    console.error('Error creating multiple notifications:', error);
  }
};

// S8: event types that also go out by email. The recipient list for these is
// always a stable user id (wallet or `user_<id>`), so email-login users are
// covered the same way as wallet users.
const EMAIL_TYPES = ['analysis_complete', 'evidence_transfer', 'integrity_alert', 'case_status'];

/**
 * Insert an in-app notification and, for key workflow events, email it too.
 * Never throws: a failed email must not break the in-app notification.
 */
const notifyUser = async (userSid, title, message, type, data = {}) => {
  const notification = await createNotification(userSid, title, message, type, data);
  if (EMAIL_TYPES.includes(type)) {
    try {
      const { sendUserEmail } = require('./emailService');
      await sendUserEmail(userSid, `[EVID-DGC] ${title}`, `${message}\n\nSign in to review: ${process.env.APP_BASE_URL || 'https://blockchain-evidence.onrender.com'}`);
    } catch (e) {
      console.error('notifyUser: email hook failed:', e.message);
    }
  }
  return notification;
};

module.exports = {
  setIO,
  createNotification,
  notifyMultipleUsers,
  notifyUser,
  EMAIL_TYPES,
};
