const express = require('express');
    const router = express.Router();
    const { User, Notification } = require('../models'); // Add necessary models
    const authenticate = require('../middleware/authenticate');
    // const authMiddleware = require('../middleware/auth'); // Not needed if routes apply to all authenticated users
    const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
    const { logAuditAction } = require('../utils/audit');
    
    // Middleware to ensure user is authenticated for all common routes
    router.use(authenticate);
    
    // --- Settings Management ---
    
    // GET: Get user's current settings
    router.get('/settings', async (req, res) => {
      const userId = req.user.id;
      try {
        // User object is already attached by 'authenticate' middleware
        // Select only the relevant settings fields
        const settings = {
          receiveNotifications: req.user.receiveNotifications,
          profileVisibility: req.user.profileVisibility,
          // Add other settings fields as needed from the User model
          email: req.user.email, // Include email for display?
          phoneNumber: req.user.phoneNumber,
          phoneNumberVerified: req.user.phoneNumberVerified,
        };
        await logAuditAction(userId, 'fetch_settings_success', { settings }, req.ip);
        sendSuccessResponse(res, settings, 'Settings fetched successfully');
      } catch (err) {
        // This catch might not be necessary if req.user is guaranteed by middleware,
        // but good practice in case of unexpected issues.
        await logAuditAction(userId, 'fetch_settings_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to fetch settings', err);
      }
    });
    
    // PUT: Update user's settings
    router.put('/settings', async (req, res) => {
      const userId = req.user.id;
      const { receiveNotifications, profileVisibility } = req.body; // Add other updatable settings
    
      // Validate input
      let changes = {};
      if (receiveNotifications !== undefined && typeof receiveNotifications === 'boolean') {
         changes.receiveNotifications = receiveNotifications;
      }
      if (profileVisibility !== undefined && ['public', 'private'].includes(profileVisibility)) {
         changes.profileVisibility = profileVisibility;
      }
      // Add validation for other settings fields
    
      if (Object.keys(changes).length === 0) {
         return sendErrorResponse(res, 400, 'No valid settings provided for update');
      }
    
      try {
        // Find the user again to update (or use req.user if it's the full instance)
        const user = await User.findByPk(userId);
        if (!user) return sendErrorResponse(res, 404, 'User not found'); // Should not happen
    
        // Apply changes
        Object.assign(user, changes);
        await user.save();
    
        await logAuditAction(userId, 'update_settings_success', { changes }, req.ip);
    
        // Return the updated settings
        const updatedSettings = {
          receiveNotifications: user.receiveNotifications,
          profileVisibility: user.profileVisibility,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneNumberVerified: user.phoneNumberVerified,
        };
        sendSuccessResponse(res, updatedSettings, 'Settings updated successfully');
      } catch (err) {
        await logAuditAction(userId, 'update_settings_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to update settings', err);
      }
    });
    
    // --- Notification Management ---
    
    // GET: Get user's notifications (unread first, then read)
    router.get('/notifications', async (req, res) => {
      const userId = req.user.id;
      try {
        const notifications = await Notification.findAll({
          where: { userId },
          order: [['isRead', 'ASC'], ['createdAt', 'DESC']], // Unread first, then newest first
          limit: 50 // Limit the number of notifications fetched
        });
        await logAuditAction(userId, 'fetch_notifications_success', { count: notifications.length }, req.ip);
        sendSuccessResponse(res, notifications, 'Notifications fetched successfully');
      } catch (err) {
        await logAuditAction(userId, 'fetch_notifications_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to fetch notifications', err);
      }
    });
    
    // PUT: Mark a specific notification as read
    router.put('/notifications/:id/read', async (req, res) => {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        return sendErrorResponse(res, 400, 'Invalid notification ID');
      }
    
      try {
        const notification = await Notification.findOne({
          where: {
            id: notificationId,
            userId: userId // Ensure user owns the notification
          }
        });
    
        if (!notification) {
          await logAuditAction(userId, 'mark_notification_read_failed_not_found', { notificationId }, req.ip);
          return sendErrorResponse(res, 404, 'Notification not found or access denied');
        }
    
        if (notification.isRead) {
           await logAuditAction(userId, 'mark_notification_read_already_read', { notificationId }, req.ip);
           // Return success even if already read
           sendSuccessResponse(res, notification, 'Notification is already marked as read');
        } else {
           notification.isRead = true;
           await notification.save();
           await logAuditAction(userId, 'mark_notification_read_success', { notificationId }, req.ip);
           sendSuccessResponse(res, notification, 'Notification marked as read');
        }
      } catch (err) {
        await logAuditAction(userId, 'mark_notification_read_failed', { notificationId, error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to mark notification as read', err);
      }
    });
    
    // POST: Mark all unread notifications as read
    router.post('/notifications/mark-all-read', async (req, res) => {
       const userId = req.user.id;
       try {
          const [updateCount] = await Notification.update(
             { isRead: true },
             { where: { userId: userId, isRead: false } }
          );
    
          await logAuditAction(userId, 'mark_all_notifications_read_success', { count: updateCount }, req.ip);
          sendSuccessResponse(res, { updatedCount: updateCount }, `${updateCount} notifications marked as read.`);
    
       } catch (err) {
          await logAuditAction(userId, 'mark_all_notifications_read_failed', { error: err.message }, req.ip);
          sendErrorResponse(res, 500, 'Failed to mark all notifications as read', err);
       }
    });
    
    // --- Subscription Info (Placeholder/Basic) ---
    // GET: Get current subscription status and basic info
    router.get('/subscription', async (req, res) => {
       const userId = req.user.id;
       try {
          // Assuming basic status/price is on User model,
          // and detailed subscription info is in Subscription model
          const user = req.user; // From authenticate middleware
          const subscriptionDetails = await Subscription.findOne({
             where: { userId: userId, status: 'active' }, // Find active subscription
             order: [['endDate', 'DESC']] // Get the latest one if multiple exist
          });
    
          const responseData = {
             status: user.subscriptionStatus || 'inactive', // From User model
             price: user.subscriptionPrice || 0, // From User model
             planName: subscriptionDetails?.planName || null,
             startDate: subscriptionDetails?.startDate || null,
             endDate: subscriptionDetails?.endDate || null,
             // Add more details from Subscription model if needed
          };
    
          await logAuditAction(userId, 'fetch_subscription_info_success', { data: responseData }, req.ip);
          sendSuccessResponse(res, responseData, 'Subscription information fetched');
       } catch (err) {
          await logAuditAction(userId, 'fetch_subscription_info_failed', { error: err.message }, req.ip);
          sendErrorResponse(res, 500, 'Failed to fetch subscription information', err);
       }
    });
    
    // Add endpoints for managing subscriptions (upgrade, cancel) - requires payment gateway integration
    // POST /subscription/upgrade
    // POST /subscription/cancel
    
    
    module.exports = router;
