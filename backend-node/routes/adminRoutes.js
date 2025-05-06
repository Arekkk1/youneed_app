// Assuming adminRoutes.js exists, add order management routes
const express = require('express');
const router = express.Router();
const { Order, User, Service, Notification } = require('../models'); // Adjust models as needed
const authenticate = require('../middleware/authenticate');
const authMiddleware = require('../middleware/auth'); // Middleware for role check
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { logAuditAction } = require('../utils/audit');
const { Op } = require('sequelize');

// Middleware to ensure only admins access these routes
router.use(authenticate, authMiddleware('admin'));

// Helper to get user display name
const getUserName = (user) => {
  if (!user) return 'N/A';
  if (user.companyName) return user.companyName;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
};


// GET /api/admin/orders - Fetch orders (potentially filtered)
router.get('/orders', async (req, res) => {
    const adminId = req.user.id;
    const { providerId, clientId, date, status } = req.query; // Add filters

    try {
        const where = {};
        if (providerId) where.providerId = parseInt(providerId, 10);
        if (clientId) where.clientId = parseInt(clientId, 10);
        if (status) where.status = status;
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
             const targetDate = new Date(date);
             const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
             const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
             where.startAt = { [Op.lt]: endOfDay };
             where[Op.or] = [ { endAt: { [Op.gt]: startOfDay } }, { endAt: null } ];
        }

        const orders = await Order.findAll({
            where,
            include: [
                { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
                { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
                { model: Service, attributes: ['id', 'name', 'price'] },
            ],
            order: [['startAt', 'ASC'], ['createdAt', 'DESC']],
        });

         const formattedOrders = orders.map(order => ({
             id: order.id,
             title: order.title,
             description: order.description,
             startAt: order.startAt,
             endAt: order.endAt,
             status: order.status,
             createdAt: order.createdAt,
             updatedAt: order.updatedAt,
             clientId: order.clientId,
             providerId: order.providerId,
             serviceId: order.serviceId,
             client: order.Client ? { ...order.Client.toJSON(), name: getUserName(order.Client) } : null,
             provider: order.Provider ? { ...order.Provider.toJSON(), name: getUserName(order.Provider) } : null,
             service: order.Service ? order.Service.toJSON() : null,
         }));

        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_fetch_orders_success', { filters: req.query, count: formattedOrders.length }, req.ip);
        }
        sendSuccessResponse(res, formattedOrders, 'Admin: Orders fetched successfully');
    } catch (err) {
        console.error(`Admin ${adminId} error fetching orders:`, err);
        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_fetch_orders_failed', { filters: req.query, error: err.message }, req.ip);
        }
        sendErrorResponse(res, 500, 'Admin: Failed to fetch orders', err);
    }
});

// POST /api/admin/orders - Create an order as admin
router.post('/orders', async (req, res) => {
    const adminId = req.user.id;
    const { serviceId, title, description, startAt, endAt, providerId, clientId, status } = req.body;

    try {
        // Basic validation
        if (!serviceId || !title || !startAt || !providerId || !clientId) {
            return sendErrorResponse(res, 400, 'Missing required fields: serviceId, title, startAt, providerId, clientId');
        }
        const startDate = new Date(startAt);
        const endDate = endAt ? new Date(endAt) : null; // endAt is optional
        if (isNaN(startDate.getTime()) || (endDate && isNaN(endDate.getTime())) || (endDate && startDate >= endDate)) {
            return sendErrorResponse(res, 400, 'Invalid start or end date');
        }

        // Verify provider, client, and service exist
        const [provider, client, service] = await Promise.all([
            User.findOne({ where: { id: providerId, role: 'provider' } }),
            User.findOne({ where: { id: clientId, role: 'client' } }),
            Service.findByPk(serviceId)
        ]);

        if (!provider) return sendErrorResponse(res, 404, 'Provider not found or is not a provider.');
        if (!client) return sendErrorResponse(res, 404, 'Client not found or is not a client.');
        if (!service) return sendErrorResponse(res, 404, 'Service not found.');
        if (service.providerId !== provider.id) return sendErrorResponse(res, 400, 'Service does not belong to the specified provider.');


        const orderData = {
            title,
            description: description || null,
            startAt: startDate,
            endAt: endDate,
            status: status || 'accepted', // Default to accepted if admin creates it? Or pending?
            serviceId,
            providerId,
            clientId,
        };

        const order = await Order.create(orderData);

        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_create_order_success', { orderId: order.id, data: orderData }, req.ip);
        }

        // Notify provider and client
        const notifyClient = Notification.create({ userId: clientId, message: `Administrator utworzył dla Ciebie nowe zlecenie: ${title}`, type: 'order', relatedId: order.id, relatedType: 'order' });
        const notifyProvider = Notification.create({ userId: providerId, message: `Administrator utworzył nowe zlecenie: ${title}`, type: 'order', relatedId: order.id, relatedType: 'order' });
        await Promise.all([notifyClient, notifyProvider]).catch(err => console.error("Admin create order notification error:", err));


        // Fetch created order with associations
        const createdOrder = await Order.findByPk(order.id, {
           include: [
             { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: Service, attributes: ['id', 'name', 'price'] },
           ]
        });
         const formattedOrder = {
           ...createdOrder.toJSON(),
           Client: createdOrder.Client ? { ...createdOrder.Client.toJSON(), name: getUserName(createdOrder.Client) } : null,
           Provider: createdOrder.Provider ? { ...createdOrder.Provider.toJSON(), name: getUserName(createdOrder.Provider) } : null,
           service: createdOrder.Service ? createdOrder.Service.toJSON() : null,
         };

        sendSuccessResponse(res, formattedOrder, 'Admin: Order created successfully', 201);

    } catch (err) {
        console.error(`Admin ${adminId} error creating order:`, err);
        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_create_order_failed', { data: req.body, error: err.message }, req.ip);
        }
        sendErrorResponse(res, 500, 'Admin: Failed to create order', err);
    }
});

// PATCH /api/admin/orders/:id - Update an order as admin
router.patch('/orders/:id', async (req, res) => {
    const adminId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return sendErrorResponse(res, 400, 'Invalid order ID');

    const { title, description, startAt, endAt, status, serviceId, providerId, clientId } = req.body;

    try {
        const order = await Order.findByPk(orderId);
        if (!order) {
            if (typeof logAuditAction === 'function') {
               await logAuditAction(adminId, 'admin_update_order_failed_not_found', { orderId }, req.ip);
            }
            return sendErrorResponse(res, 404, 'Order not found');
        }

        const fieldsToUpdate = {};
        if (title !== undefined) fieldsToUpdate.title = title;
        if (description !== undefined) fieldsToUpdate.description = description || null;
        if (status !== undefined) fieldsToUpdate.status = status; // Admin can set any status? Add validation if needed.
        if (serviceId !== undefined) fieldsToUpdate.serviceId = parseInt(serviceId, 10);
        if (providerId !== undefined) fieldsToUpdate.providerId = parseInt(providerId, 10);
        if (clientId !== undefined) fieldsToUpdate.clientId = parseInt(clientId, 10);

        if (startAt !== undefined) {
            const startDate = new Date(startAt);
            if (isNaN(startDate.getTime())) return sendErrorResponse(res, 400, 'Invalid startAt date format');
            fieldsToUpdate.startAt = startDate;
        }
        if (endAt !== undefined) {
             // Allow null or valid date
             if (endAt === null) {
                 fieldsToUpdate.endAt = null;
             } else {
                 const endDate = new Date(endAt);
                 if (isNaN(endDate.getTime())) return sendErrorResponse(res, 400, 'Invalid endAt date format');
                 // Ensure end date is after start date if both are provided/updated
                 const finalStartDate = fieldsToUpdate.startAt || order.startAt;
                 if (finalStartDate && endDate <= finalStartDate) {
                     return sendErrorResponse(res, 400, 'End date must be after start date');
                 }
                 fieldsToUpdate.endAt = endDate;
             }
        } else if (fieldsToUpdate.startAt && order.endAt && fieldsToUpdate.startAt >= order.endAt) {
             // If only startAt is updated, check against existing endAt
             return sendErrorResponse(res, 400, 'New start date must be before existing end date');
        }


        // Optional: Add validation to ensure serviceId, providerId, clientId exist if changed

        if (Object.keys(fieldsToUpdate).length === 0) {
            return sendSuccessResponse(res, order, 'Admin: No changes detected in order.');
        }

        await order.update(fieldsToUpdate);

        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_update_order_success', { orderId, changes: fieldsToUpdate }, req.ip);
        }

        // Notify provider and client about the change
        const notifyClient = Notification.create({ userId: order.clientId, message: `Administrator zmodyfikował zlecenie: ${order.title}`, type: 'order_updated', relatedId: order.id, relatedType: 'order' });
        const notifyProvider = Notification.create({ userId: order.providerId, message: `Administrator zmodyfikował zlecenie: ${order.title}`, type: 'order_updated', relatedId: order.id, relatedType: 'order' });
        await Promise.all([notifyClient, notifyProvider]).catch(err => console.error("Admin update order notification error:", err));

        // Fetch updated order with associations
        const updatedOrder = await Order.findByPk(order.id, {
           include: [
             { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: Service, attributes: ['id', 'name', 'price'] },
           ]
        });
         const formattedOrder = {
           ...updatedOrder.toJSON(),
           Client: updatedOrder.Client ? { ...updatedOrder.Client.toJSON(), name: getUserName(updatedOrder.Client) } : null,
           Provider: updatedOrder.Provider ? { ...updatedOrder.Provider.toJSON(), name: getUserName(updatedOrder.Provider) } : null,
           service: updatedOrder.Service ? updatedOrder.Service.toJSON() : null,
         };

        sendSuccessResponse(res, formattedOrder, 'Admin: Order updated successfully');

    } catch (err) {
        console.error(`Admin ${adminId} error updating order ${orderId}:`, err);
        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_update_order_failed', { orderId, data: req.body, error: err.message }, req.ip);
        }
        sendErrorResponse(res, 500, 'Admin: Failed to update order', err);
    }
});

// DELETE /api/admin/orders/:id - Delete an order as admin
router.delete('/orders/:id', async (req, res) => {
    const adminId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return sendErrorResponse(res, 400, 'Invalid order ID');

    try {
        const order = await Order.findByPk(orderId);
        if (!order) {
            if (typeof logAuditAction === 'function') {
               await logAuditAction(adminId, 'admin_delete_order_failed_not_found', { orderId }, req.ip);
            }
            return sendErrorResponse(res, 404, 'Order not found');
        }

        const { clientId, providerId, title } = order; // Get details before deleting

        await order.destroy();

        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_delete_order_success', { orderId, clientId, providerId, title }, req.ip);
        }

        // Notify provider and client
        const notifyClient = Notification.create({ userId: clientId, message: `Administrator usunął zlecenie: ${title}`, type: 'order_deleted', relatedId: orderId, relatedType: 'order' });
        const notifyProvider = Notification.create({ userId: providerId, message: `Administrator usunął zlecenie: ${title}`, type: 'order_deleted', relatedId: orderId, relatedType: 'order' });
        await Promise.all([notifyClient, notifyProvider]).catch(err => console.error("Admin delete order notification error:", err));

        sendSuccessResponse(res, null, 'Admin: Order deleted successfully', 204); // 204 No Content

    } catch (err) {
        console.error(`Admin ${adminId} error deleting order ${orderId}:`, err);
        if (typeof logAuditAction === 'function') {
            await logAuditAction(adminId, 'admin_delete_order_failed', { orderId, error: err.message }, req.ip);
        }
        sendErrorResponse(res, 500, 'Admin: Failed to delete order', err);
    }
});


// Add other admin routes here (e.g., user management, settings)

module.exports = router;
