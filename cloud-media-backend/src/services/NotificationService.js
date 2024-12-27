const Notification = require('../models/Notification');
const { createLogger } = require('../utils/logger');

const logger = createLogger('notification-service');

class NotificationService {
  static async create({ type, title, message }) {
    try {
      const notification = new Notification({
        type,
        title,
        message,
        read: false
      });

      await notification.save();
      logger.info(`Created notification: ${title}`);

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  static async markAsRead(id) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        id,
        { read: true },
        { new: true }
      );
      
      logger.info(`Marked notification as read: ${id}`);
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;