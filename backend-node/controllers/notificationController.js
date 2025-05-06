const { Notification, User } = require('../models');
        const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
        const { logAuditAction } = require('../utils/audit');
        const { Op } = require('sequelize');

        // Get Notifications for the logged-in user
        exports.getNotifications = async (req, res) => {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const offset = (page - 1) * limit;
            const status = req.query.status; // 'unread' or undefined/all

            const whereClause = { userId };
            if (status === 'unread') {
                // Assuming 'isRead' column exists and is boolean
                whereClause.isRead = false;
            }

            try {
                const { count, rows } = await Notification.findAndCountAll({
                    where: whereClause,
                    limit: limit,
                    offset: offset,
                    order: [['createdAt', 'DESC']], // Show newest first
                    // Include user details if needed, but likely not necessary here
                    // include: [{ model: User, attributes: ['id', 'firstName'] }]
                });

                const totalPages = Math.ceil(count / limit);

                // Log successful fetch
                await logAuditAction(userId, 'get_notifications_success', { page, limit, status, count }, req.ip).catch(console.error);

                sendSuccessResponse(res, {
                    notifications: rows,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalItems: count,
                        itemsPerPage: limit
                    }
                }, 'Powiadomienia pobrane pomyślnie.');

            } catch (error) {
                console.error("Error fetching notifications:", error);
                await logAuditAction(userId, 'get_notifications_failed', { error: error.message }, req.ip).catch(console.error);
                sendErrorResponse(res, 500, 'Błąd podczas pobierania powiadomień.', error);
            }
        };

        // Mark a single notification as read
        exports.markAsRead = async (req, res) => {
            const userId = req.user.id;
            const notificationId = req.params.id;

            try {
                const notification = await Notification.findOne({
                    where: { id: notificationId, userId: userId }
                });

                if (!notification) {
                    await logAuditAction(userId, 'mark_notification_read_failed_not_found', { notificationId }, req.ip).catch(console.error);
                    return sendErrorResponse(res, 404, 'Nie znaleziono powiadomienia.');
                }

                if (notification.isRead) {
                     await logAuditAction(userId, 'mark_notification_read_skipped_already_read', { notificationId }, req.ip).catch(console.error);
                    // Already read, send success without making changes
                    return sendSuccessResponse(res, notification, 'Powiadomienie jest już oznaczone jako przeczytane.');
                }

                notification.isRead = true;
                await notification.save();

                await logAuditAction(userId, 'mark_notification_read_success', { notificationId }, req.ip).catch(console.error);
                sendSuccessResponse(res, notification, 'Powiadomienie oznaczone jako przeczytane.');

            } catch (error) {
                console.error("Error marking notification as read:", error);
                await logAuditAction(userId, 'mark_notification_read_failed', { notificationId, error: error.message }, req.ip).catch(console.error);
                sendErrorResponse(res, 500, 'Błąd podczas oznaczania powiadomienia jako przeczytane.', error);
            }
        };

        // Mark all notifications as read for the user
        exports.markAllAsRead = async (req, res) => {
            const userId = req.user.id;

            try {
                const [affectedCount] = await Notification.update(
                    { isRead: true },
                    {
                        where: {
                            userId: userId,
                            isRead: false // Only update unread ones
                        },
                        // returning: false // No need to return updated records for bulk update
                    }
                );

                await logAuditAction(userId, 'mark_all_notifications_read_success', { affectedCount }, req.ip).catch(console.error);
                sendSuccessResponse(res, { markedAsReadCount: affectedCount }, 'Wszystkie powiadomienia oznaczone jako przeczytane.');

            } catch (error) {
                console.error("Error marking all notifications as read:", error);
                await logAuditAction(userId, 'mark_all_notifications_read_failed', { error: error.message }, req.ip).catch(console.error);
                sendErrorResponse(res, 500, 'Błąd podczas oznaczania wszystkich powiadomień jako przeczytane.', error);
            }
        };

        // Delete a single notification
        exports.deleteNotification = async (req, res) => {
            const userId = req.user.id;
            const notificationId = req.params.id;

            try {
                const notification = await Notification.findOne({
                    where: { id: notificationId, userId: userId }
                });

                if (!notification) {
                    await logAuditAction(userId, 'delete_notification_failed_not_found', { notificationId }, req.ip).catch(console.error);
                    return sendErrorResponse(res, 404, 'Nie znaleziono powiadomienia.');
                }

                await notification.destroy();

                await logAuditAction(userId, 'delete_notification_success', { notificationId }, req.ip).catch(console.error);
                sendSuccessResponse(res, null, 'Powiadomienie usunięte pomyślnie.');

            } catch (error) {
                console.error("Error deleting notification:", error);
                await logAuditAction(userId, 'delete_notification_failed', { notificationId, error: error.message }, req.ip).catch(console.error);
                sendErrorResponse(res, 500, 'Błąd podczas usuwania powiadomienia.', error);
            }
        };
