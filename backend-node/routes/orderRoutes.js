const express = require('express');
    const router = express.Router();
    const { Op } = require('sequelize'); // Import Op directly
    const db = require('../models'); // Import the db object
    const { User, Order, Service, Feedback, Notification } = db; // Destructure models from db
    const authenticate = require('../middleware/authenticate');
    const authMiddleware = require('../middleware/auth');
    const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
    const { logAuditAction } = require('../utils/audit');

    // Helper to get user display name
    const getUserName = (user) => {
      if (!user) return 'N/A';
      if (user.companyName) return user.companyName;
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    };

    // --- Get Orders (based on role) ---
    router.get('/', authenticate, async (req, res) => {
      // DETAILED LOGGING HERE
      console.log('[OrderRoutes DEBUG /] --- Route Handler Start ---');
      console.log('[OrderRoutes DEBUG /] req.user object:', JSON.stringify(req.user, null, 2));
      if (req.user) {
          console.log(`[OrderRoutes DEBUG /] req.user.id: ${req.user.id}, Type: ${typeof req.user.id}`);
          console.log(`[OrderRoutes DEBUG /] req.user.role: "${req.user.role}", Type: ${typeof req.user.role}`);
      } else {
          console.log('[OrderRoutes DEBUG /] req.user is undefined or null');
      }
      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : null;
      console.log(`[OrderRoutes DEBUG /] Extracted userId: ${userId}, userRole: "${userRole}"`);

      try {
        const where = {};
        // const userRole = req.user.role; // Already defined above
        // const userId = req.user.id; // Already defined above

        if (userRole === 'provider') {
          where.providerId = userId;
        } else if (userRole === 'client') {
          where.clientId = userId;
        } else if (userRole !== 'admin') {
          return sendErrorResponse(res, 403, 'Access denied');
        }

        const orders = await Order.findAll({
          where,
          include: [
            { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
            { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
            { model: Service, as: 'Service', attributes: ['id', 'name', 'price', 'duration'] }, // Dodano as: 'Service'
          ],
          order: [['startAt', 'ASC'], ['createdAt', 'DESC']],
        });

        const formattedOrders = orders.map(order => ({
          ...order.toJSON(),
          Client: order.Client ? { ...order.Client.toJSON(), name: getUserName(order.Client) } : null,
          Provider: order.Provider ? { ...order.Provider.toJSON(), name: getUserName(order.Provider) } : null,
        }));

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_orders_success', { role: userRole, count: formattedOrders.length }, req.ip);
         }
        sendSuccessResponse(res, formattedOrders, 'Orders fetched successfully');
      } catch (err) {
        console.error(`Error fetching orders for user ${req.user?.id} (role: ${req.user?.role}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(req.user?.id, 'fetch_orders_failed', { role: req.user?.role, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch orders', err);
      }
    });

    // --- Get Recent Orders (for Dashboard) ---
    router.get('/recent', authenticate, async (req, res) => {
      // DETAILED LOGGING HERE
      console.log('[OrderRoutes DEBUG /recent] --- Route Handler Start ---');
      console.log('[OrderRoutes DEBUG /recent] req.user object:', JSON.stringify(req.user, null, 2));
      if (req.user) {
          console.log(`[OrderRoutes DEBUG /recent] req.user.id: ${req.user.id}, Type: ${typeof req.user.id}`);
          console.log(`[OrderRoutes DEBUG /recent] req.user.role: "${req.user.role}", Type: ${typeof req.user.role}`);
      } else {
          console.log('[OrderRoutes DEBUG /recent] req.user is undefined or null');
      }
      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : null; // This is the critical assignment
      
      // This log line will now use the userRole defined just above
      console.log(`[DEBUG] /orders/recent called by user ${userId}, role: ${userRole}`);


      try {
        let where = {};

        if (!userRole) { // Check the locally defined userRole
            console.error(`[ERROR] /orders/recent: Missing user role for user ${userId}. Value of userRole: "${userRole}"`);
            return sendErrorResponse(res, 400, 'User role not found in token.');
        }

        if (userRole === 'provider') {
          console.log('[OrderRoutes DEBUG /recent] Role is "provider"');
          where.providerId = userId;
        } else if (userRole === 'client') {
          console.log('[OrderRoutes DEBUG /recent] Role is "client"');
          where.clientId = userId;
        } else if (userRole !== 'admin') {
          console.log(`[OrderRoutes DEBUG /recent] Role is "${userRole}" - Access denied`);
          return sendErrorResponse(res, 403, 'Access denied for this role');
        } else {
           console.log('[OrderRoutes DEBUG /recent] Role is "admin"');
           // Admin sees all recent if not denied above
        }


        const orders = await Order.findAll({
          where,
          include: [
            { model: User, as: 'Client', attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'] }, 
            { model: User, as: 'Provider', attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'] }, 
            { model: Service, as: 'Service', attributes: ['id', 'name'] }, // Dodano as: 'Service'
          ],
          order: [['createdAt', 'DESC']],
          limit: 10, 
        });

        const formattedOrders = orders.map(order => ({
          id: order.id,
          title: order.title,
          clientName: order.Client ? getUserName(order.Client) : 'N/A',
          providerName: order.Provider ? getUserName(order.Provider) : 'N/A',
          serviceName: order.Service?.name || 'N/A',
          status: order.status,
          createdAt: order.createdAt,
        }));

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_recent_orders_success', { role: userRole, count: formattedOrders.length }, req.ip);
         }
        sendSuccessResponse(res, formattedOrders, 'Recent orders fetched successfully');
      } catch (err) {
        console.error(`Error fetching recent orders for user ${userId} (role: ${userRole}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(req.user?.id, 'fetch_recent_orders_failed', { role: req.user?.role, error: err.message }, req.ip);
         }
        if (err.message === 'User role not found in token.') {
             sendErrorResponse(res, 400, err.message, err);
        } else {
             sendErrorResponse(res, 500, 'Failed to fetch recent orders', err);
        }
      }
    });

    // --- Get Order Statistics (Sales/Expenses) ---
    router.get('/stats', authenticate, async (req, res) => {
      console.log('[OrderRoutes DEBUG /stats] --- Route Handler Start ---');
      console.log('[OrderRoutes DEBUG /stats] req.user object:', JSON.stringify(req.user, null, 2));
      if (req.user) {
          console.log(`[OrderRoutes DEBUG /stats] req.user.id: ${req.user.id}, Type: ${typeof req.user.id}`);
          console.log(`[OrderRoutes DEBUG /stats] req.user.role: "${req.user.role}", Type: ${typeof req.user.role}`);
      } else {
          console.log('[OrderRoutes DEBUG /stats] req.user is undefined or null');
      }
      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : null;
      console.log(`[OrderRoutes DEBUG /stats] Extracted userId: ${userId}, userRole: "${userRole}"`);

      try {
        // const userId = req.user.id; // Defined above
        // const userRole = req.user.role; // Defined above
        let stats = { pending: 0, accepted: 0, completed: 0, rejected: 0, cancelled: 0, totalValue: 0, valueLabel: 'Value' };

        let whereBase = {};
        let valueLabel = '';

        if (userRole === 'provider') {
          whereBase = { providerId: userId };
          valueLabel = 'Earnings';
        } else if (userRole === 'client') {
          whereBase = { clientId: userId };
          valueLabel = 'Expenses';
        } else if (userRole === 'admin') {
           whereBase = { status: 'completed' }; 
           valueLabel = 'Total Revenue';
        } else {
           return sendErrorResponse(res, 403, 'Access denied');
        }

        const statusCounts = await Order.findAll({
            attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            where: whereBase,
            group: ['status'],
            raw: true,
        });
        statusCounts.forEach(item => {
            if (stats.hasOwnProperty(item.status)) {
                stats[item.status] = parseInt(item.count, 10) || 0;
            }
        });

        const valueResult = await Order.findOne({
           attributes: [[db.sequelize.fn('SUM', db.sequelize.col('Service.price')), 'total']],
           include: [{ model: Service, as: 'Service', attributes: [], required: true }], // Dodano as: 'Service'
           where: { ...whereBase, status: 'completed' }, 
           raw: true,
        });
        stats.totalValue = parseFloat(valueResult?.total || 0);
        stats.valueLabel = valueLabel;

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_order_stats_success', { role: userRole, stats }, req.ip);
         }
        sendSuccessResponse(res, stats, 'Order statistics fetched successfully');
      } catch (err) {
        console.error(`Error fetching order stats for user ${req.user?.id} (role: ${req.user?.role}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(req.user?.id, 'fetch_order_stats_failed', { role: req.user?.role, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch order statistics', err);
      }
    });

    // --- Get Daily Order Count (for charts) ---
    router.get('/daily-count', authenticate, async (req, res) => {
      console.log('[OrderRoutes DEBUG /daily-count] --- Route Handler Start ---');
      console.log('[OrderRoutes DEBUG /daily-count] req.user object:', JSON.stringify(req.user, null, 2));
      if (req.user) {
          console.log(`[OrderRoutes DEBUG /daily-count] req.user.id: ${req.user.id}, Type: ${typeof req.user.id}`);
          console.log(`[OrderRoutes DEBUG /daily-count] req.user.role: "${req.user.role}", Type: ${typeof req.user.role}`);
      } else {
          console.log('[OrderRoutes DEBUG /daily-count] req.user is undefined or null');
      }
      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : null;
      console.log(`[OrderRoutes DEBUG /daily-count] Extracted userId: ${userId}, userRole: "${userRole}"`);

      try {
        // const userId = req.user.id; // Defined above
        // const userRole = req.user.role; // Defined above
        let where = {};

        if (userRole === 'provider') {
          where.providerId = userId;
        } else if (userRole === 'client') {
          where.clientId = userId;
        } else if (userRole !== 'admin') {
          return sendErrorResponse(res, 403, 'Access denied');
        }
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); 

        where.createdAt = { [Op.gte]: sevenDaysAgo };

        const dailyCounts = await Order.findAll({
          where,
          attributes: [
            [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
          ],
          group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
          order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']], 
          raw: true,
        });

         const formattedCounts = dailyCounts.map(item => ({
             date: item.date, 
             count: parseInt(item.count, 10) || 0
         }));


         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_daily_order_count_success', { role: userRole, count: formattedCounts.length }, req.ip);
         }
        sendSuccessResponse(res, formattedCounts, 'Daily order count fetched successfully');
      } catch (err) {
        console.error(`Error fetching daily order count for user ${req.user?.id} (role: ${req.user?.role}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(req.user?.id, 'fetch_daily_order_count_failed', { role: req.user?.role, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch daily order count', err);
      }
    });


    // --- Get Single Order Details ---
    router.get('/:id', authenticate, async (req, res) => {
      console.log(`[DEBUG] GET /orders/:id called with id: ${req.params.id}`); 
      // DETAILED LOGGING HERE
      console.log('[OrderRoutes DEBUG /:id] --- Route Handler Start ---');
      console.log('[OrderRoutes DEBUG /:id] req.user object:', JSON.stringify(req.user, null, 2));
      if (req.user) {
          console.log(`[OrderRoutes DEBUG /:id] req.user.id: ${req.user.id}, Type: ${typeof req.user.id}`);
          console.log(`[OrderRoutes DEBUG /:id] req.user.role: "${req.user.role}", Type: ${typeof req.user.role}`);
      } else {
          console.log('[OrderRoutes DEBUG /:id] req.user is undefined or null');
      }
      const currentUserId = req.user ? req.user.id : null; // Renamed to avoid conflict with order.clientId etc.
      const currentUserRole = req.user ? req.user.role : null;
      console.log(`[OrderRoutes DEBUG /:id] Extracted currentUserId: ${currentUserId}, currentUserRole: "${currentUserRole}"`);


      const orderId = parseInt(req.params.id, 10);

      if (isNaN(orderId)) {
        console.error(`[ERROR] Invalid order ID received: ${req.params.id}`);
        return sendErrorResponse(res, 400, 'Invalid order ID format'); 
      }

      try {
        const order = await Order.findByPk(orderId, {
          include: [
            { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName', 'phoneNumber'] },
            { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName', 'phoneNumber'] },
            { model: Service, as: 'Service', attributes: ['id', 'name', 'price', 'description', 'duration', 'category'] }, // Dodano as: 'Service'
            { model: Feedback, attributes: ['id', 'rating', 'comment', 'createdAt'] }
          ],
        });

        if (!order) {
           if (typeof logAuditAction === 'function') {
              await logAuditAction(currentUserId, 'fetch_order_detail_failed_not_found', { orderId }, req.ip);
           }
          return sendErrorResponse(res, 404, 'Order not found');
        }

        const isClient = currentUserRole === 'client' && order.clientId === currentUserId;
        const isProvider = currentUserRole === 'provider' && order.providerId === currentUserId;
        const isAdmin = currentUserRole === 'admin';

        if (!isClient && !isProvider && !isAdmin) {
           if (typeof logAuditAction === 'function') {
              await logAuditAction(currentUserId, 'fetch_order_detail_failed_unauthorized', { orderId, targetClientId: order.clientId, targetProviderId: order.providerId }, req.ip);
           }
          return sendErrorResponse(res, 403, 'Access denied to this order');
        }

        const formattedOrder = {
          ...order.toJSON(),
          Client: order.Client ? { ...order.Client.toJSON(), name: getUserName(order.Client) } : null,
          Provider: order.Provider ? { ...order.Provider.toJSON(), name: getUserName(order.Provider) } : null,
        };

         if (typeof logAuditAction === 'function') {
            await logAuditAction(currentUserId, 'fetch_order_detail_success', { orderId }, req.ip);
         }
        sendSuccessResponse(res, formattedOrder, 'Order details fetched successfully');
      } catch (err) {
        console.error(`Error fetching order detail ${orderId} for user ${currentUserId}:`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(currentUserId, 'fetch_order_detail_failed', { orderId, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch order details', err);
      }
    });

    // --- Create Order ---
    router.post('/', authenticate, authMiddleware(['client', 'provider', 'admin']), async (req, res) => {
      console.log('[OrderRoutes DEBUG POST /] --- Route Handler Start ---');
      console.log('[OrderRoutes DEBUG POST /] req.user object:', JSON.stringify(req.user, null, 2));
      if (req.user) {
          console.log(`[OrderRoutes DEBUG POST /] req.user.id: ${req.user.id}, Type: ${typeof req.user.id}`);
          console.log(`[OrderRoutes DEBUG POST /] req.user.role: "${req.user.role}", Type: ${typeof req.user.role}`);
      } else {
          console.log('[OrderRoutes DEBUG POST /] req.user is undefined or null');
      }
      const userRole = req.user ? req.user.role : null;
      const userId = req.user ? req.user.id : null;
      console.log(`[OrderRoutes DEBUG POST /] Extracted userId: ${userId}, userRole: "${userRole}"`);


      const {
          serviceId,
          title, 
          description, 
          startAt,
          providerId, 
          clientId, 
          notes, 
          duration 
      } = req.body;
      // const userRole = req.user.role; // Defined above
      // const userId = req.user.id; // Defined above

      console.log(`[POST /orders] Request received from user ${userId} (Role: ${userRole})`);
      console.log(`[POST /orders] Body:`, req.body);


      try {
        if (!serviceId || !startAt) {
          return sendErrorResponse(res, 400, 'Missing required fields: serviceId, startAt');
        }
        const startDate = new Date(startAt);
        if (isNaN(startDate.getTime())) {
            return sendErrorResponse(res, 400, 'Invalid start date format');
        }
        
        const service = await Service.findByPk(serviceId);
        if (!service) {
           if (typeof logAuditAction === 'function') {
              await logAuditAction(userId, 'create_order_failed_service_not_found', { serviceId }, req.ip);
           }
          return sendErrorResponse(res, 404, 'Service not found');
        }

        let orderData = {
          title: title || service.name, 
          description: description || notes || null, 
          startAt: startDate,
          endAt: new Date(startDate.getTime() + (duration || service.duration || 30) * 60 * 1000), 
          status: 'pending', 
          serviceId: service.id,
          totalAmount: service.price, 
          notes: notes || null, 
        };

        let notificationRecipientId = null;
        let notificationMessage = '';
        const creatorName = getUserName(req.user); 

        if (userRole === 'client') {
            if (!providerId || parseInt(providerId, 10) !== service.providerId) {
                console.error(`[POST /orders] Client ${userId} attempting to book service ${serviceId} for incorrect provider ${providerId} (Service belongs to ${service.providerId})`);
                 if (typeof logAuditAction === 'function') {
                    await logAuditAction(userId, 'create_order_failed_client_provider_mismatch', { serviceId, requestedProviderId: providerId, actualProviderId: service.providerId }, req.ip);
                 }
                return sendErrorResponse(res, 400, 'Invalid provider specified for this service.');
            }
            const providerExists = await User.findByPk(providerId);
            if (!providerExists || providerExists.role !== 'provider') {
                 return sendErrorResponse(res, 404, 'Provider not found.');
            }
            orderData.clientId = userId; 
            orderData.providerId = parseInt(providerId, 10);
            notificationRecipientId = orderData.providerId;
            notificationMessage = `Nowe zlecenie "${orderData.title}" od klienta ${creatorName}.`;
            console.log(`[POST /orders] Client ${userId} creating order for provider ${orderData.providerId}`);

        } else if (userRole === 'provider') {
            if (service.providerId !== userId) {
                 if (typeof logAuditAction === 'function') {
                    await logAuditAction(userId, 'create_order_failed_provider_mismatch', { serviceId, expectedProviderId: service.providerId }, req.ip);
                 }
                return sendErrorResponse(res, 403, 'Provider can only create orders for their own services');
            }
            orderData.providerId = userId; 
            if (clientId) {
                const clientExists = await User.findByPk(clientId);
                if (!clientExists || clientExists.role !== 'client') {
                    return sendErrorResponse(res, 404, 'Specified client not found or is not a client.');
                }
                orderData.clientId = parseInt(clientId, 10);
                notificationRecipientId = orderData.clientId;
                notificationMessage = `Usługodawca ${creatorName} utworzył dla Ciebie nowe zlecenie: ${orderData.title}`;
                console.log(`[POST /orders] Provider ${userId} creating order for client ${orderData.clientId}`);
            } else {
                orderData.clientId = null; 
                orderData.status = 'pending'; 
                console.log(`[POST /orders] Provider ${userId} creating order (blocking time)`);
            }
        } else if (userRole === 'admin') {
             if (!clientId || !providerId) {
                 return sendErrorResponse(res, 400, 'Admin must specify both clientId and providerId.');
             }
             const [clientExists, providerExists] = await Promise.all([
                 User.findOne({ where: { id: clientId, role: 'client' } }),
                 User.findOne({ where: { id: providerId, role: 'provider' } })
             ]);
             if (!clientExists) return sendErrorResponse(res, 404, 'Client not found.');
             if (!providerExists) return sendErrorResponse(res, 404, 'Provider not found.');
             if (service.providerId !== parseInt(providerId, 10)) {
                 return sendErrorResponse(res, 400, 'Service does not belong to the specified provider.');
             }

             orderData.clientId = parseInt(clientId, 10);
             orderData.providerId = parseInt(providerId, 10);
             orderData.status = 'accepted'; 
             notificationMessage = `Administrator utworzył zlecenie "${orderData.title}".`;
             console.log(`[POST /orders] Admin ${userId} creating order for client ${orderData.clientId} and provider ${orderData.providerId}`);
        } else {
            return sendErrorResponse(res, 403, 'Invalid user role for creating orders');
        }

        const conflictingOrder = await Order.findOne({
            where: {
                providerId: orderData.providerId,
                status: { [Op.in]: ['pending', 'accepted', 'in_progress'] }, 
                [Op.or]: [
                    { startAt: { [Op.between]: [orderData.startAt, orderData.endAt] } },
                    { endAt: { [Op.between]: [orderData.startAt, orderData.endAt] } },
                    { [Op.and]: [
                        { startAt: { [Op.lte]: orderData.startAt } },
                        { endAt: { [Op.gte]: orderData.endAt } }
                    ]}
                ]
            }
        });

        if (conflictingOrder) {
            console.warn(`[POST /orders] Conflict detected for provider ${orderData.providerId} at ${orderData.startAt}. Conflicting order ID: ${conflictingOrder.id}`);
            return sendErrorResponse(res, 409, 'Wybrany termin jest już zajęty lub oczekuje na akceptację.'); 
        }

        const order = await Order.create(orderData);
        console.log(`[POST /orders] Order ${order.id} created successfully.`);

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'create_order_success', { orderId: order.id, role: userRole, clientId: order.clientId, providerId: order.providerId }, req.ip);
         }

        if (notificationRecipientId && notificationMessage && typeof Notification !== 'undefined') {
          try {
              const recipients = Array.isArray(notificationRecipientId) ? notificationRecipientId : [notificationRecipientId];
              for (const recipient of recipients) {
                  await Notification.create({
                    userId: recipient,
                    message: notificationMessage,
                    type: 'order', 
                    relatedId: order.id,
                    relatedType: 'order',
                    isRead: false,
                  });
                   console.log(`[POST /orders] Notification sent to user ${recipient}`);
              }
          } catch (notificationError) {
              console.error(`Failed to create notification for order ${order.id}:`, notificationError);
          }
        }

        const createdOrder = await Order.findByPk(order.id, {
           include: [
             { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: Service, as: 'Service', attributes: ['id', 'name', 'price', 'duration'] }, // Dodano as: 'Service'
           ]
        });
         const formattedOrder = {
           ...createdOrder.toJSON(),
           Client: createdOrder.Client ? { ...createdOrder.Client.toJSON(), name: getUserName(createdOrder.Client) } : null,
           Provider: createdOrder.Provider ? { ...createdOrder.Provider.toJSON(), name: getUserName(createdOrder.Provider) } : null,
         };

        sendSuccessResponse(res, formattedOrder, 'Order created successfully', 201);

      } catch (err) {
        console.error(`Error creating order for user ${userId} (role: ${userRole}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(req.user?.id, 'create_order_failed', { role: req.user?.role, error: err.message }, req.ip);
         }
        if (err.name === 'SequelizeValidationError') {
             const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
             return sendErrorResponse(res, 400, 'Validation failed', { errors });
        }
        sendErrorResponse(res, 500, 'Failed to create order', err);
      }
    });

    // --- Update Order Status (Provider or Client cancelling pending) ---
    router.patch('/:id/status', authenticate, async (req, res) => {
      console.log('[OrderRoutes DEBUG PATCH /:id/status] --- Route Handler Start ---');
      console.log('[OrderRoutes DEBUG PATCH /:id/status] req.user object:', JSON.stringify(req.user, null, 2));
      if (req.user) {
          console.log(`[OrderRoutes DEBUG PATCH /:id/status] req.user.id: ${req.user.id}, Type: ${typeof req.user.id}`);
          console.log(`[OrderRoutes DEBUG PATCH /:id/status] req.user.role: "${req.user.role}", Type: ${typeof req.user.role}`);
      } else {
          console.log('[OrderRoutes DEBUG PATCH /:id/status] req.user is undefined or null');
      }
      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : null;
      console.log(`[OrderRoutes DEBUG PATCH /:id/status] Extracted userId: ${userId}, userRole: "${userRole}"`);

      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return sendErrorResponse(res, 400, 'Invalid order ID');
      }
      const { status } = req.body;
      // const userId = req.user.id; // Defined above
      // const userRole = req.user.role; // Defined above

      const allowedStatuses = {
          provider: ['accepted', 'rejected', 'completed', 'cancelled'],
          client: ['cancelled'], 
          admin: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] 
      };

      if (!status || !allowedStatuses[userRole]?.includes(status)) {
        return sendErrorResponse(res, 400, `Invalid status value "${status}" or role "${userRole}" not allowed to set this status.`);
      }

      try {
        const order = await Order.findByPk(orderId);

        if (!order) {
           if (typeof logAuditAction === 'function') {
              await logAuditAction(userId, 'update_order_status_failed_not_found', { orderId, status }, req.ip);
           }
          return sendErrorResponse(res, 404, 'Order not found');
        }

        const oldStatus = order.status;
        let canUpdate = false;
        let notificationRecipientId = null;
        let notificationMessage = '';
        const updaterName = getUserName(req.user);


        if (userRole === 'provider' && order.providerId === userId) {
            if ((status === 'accepted' || status === 'rejected') && oldStatus === 'pending') {
                 canUpdate = true;
                 notificationRecipientId = order.clientId;
                 notificationMessage = `Twoje zlecenie "${order.title}" zostało ${status === 'accepted' ? 'zaakceptowane' : 'odrzucone'} przez ${updaterName}.`;
            }
            else if (status === 'completed' && oldStatus === 'accepted') {
                 canUpdate = true;
                 notificationRecipientId = order.clientId;
                 notificationMessage = `Twoje zlecenie "${order.title}" zostało zakończone przez ${updaterName}.`;
            }
            else if (status === 'cancelled' && (oldStatus === 'pending' || oldStatus === 'accepted')) {
                 canUpdate = true;
                 notificationRecipientId = order.clientId;
                 notificationMessage = `Zlecenie "${order.title}" zostało anulowane przez usługodawcę ${updaterName}.`;
            }
        } else if (userRole === 'client' && order.clientId === userId) {
            if (status === 'cancelled' && oldStatus === 'pending') {
                 canUpdate = true;
                 notificationRecipientId = order.providerId;
                 notificationMessage = `Zlecenie "${order.title}" zostało anulowane przez klienta ${updaterName}.`;
            }
        } else if (userRole === 'admin') {
            canUpdate = true; 
            notificationRecipientId = [order.clientId, order.providerId].filter(id => id); 
            notificationMessage = `Status zlecenia "${order.title}" został zmieniony na "${status}" przez administratora.`;
        }

        if (!canUpdate) {
             if (typeof logAuditAction === 'function') {
                await logAuditAction(userId, 'update_order_status_failed_unauthorized_or_invalid_transition', { orderId, oldStatus, newStatus: status, role: userRole }, req.ip);
             }
            return sendErrorResponse(res, 403, `Access denied or invalid status transition from "${oldStatus}" to "${status}" for role "${userRole}".`);
        }


        if (oldStatus === status) {
            return sendSuccessResponse(res, order, 'Order status unchanged');
        }

        order.status = status;
        await order.save();

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'update_order_status_success', { orderId: order.id, oldStatus, newStatus: status, role: userRole }, req.ip);
         }

        if (notificationRecipientId && notificationMessage && typeof Notification !== 'undefined') {
           try {
                const recipients = Array.isArray(notificationRecipientId) ? notificationRecipientId : [notificationRecipientId];
                for (const recipient of recipients) {
                   if (recipient) { 
                       await Notification.create({
                         userId: recipient,
                         message: notificationMessage,
                         type: 'order_updated',
                         relatedId: order.id,
                         relatedType: 'order',
                         isRead: false,
                       });
                       console.log(`[PATCH /orders/:id/status] Notification sent to user ${recipient}`);
                   }
                }
           } catch (notificationError) {
               console.error(`Failed to create notification for order status update ${order.id}:`, notificationError);
           }
        }

        const updatedOrder = await Order.findByPk(order.id, {
           include: [
             { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: Service, as: 'Service', attributes: ['id', 'name', 'price', 'duration'] }, // Dodano as: 'Service'
           ]
        });
         const formattedOrder = {
           ...updatedOrder.toJSON(),
           Client: updatedOrder.Client ? { ...updatedOrder.Client.toJSON(), name: getUserName(updatedOrder.Client) } : null,
           Provider: updatedOrder.Provider ? { ...updatedOrder.Provider.toJSON(), name: getUserName(updatedOrder.Provider) } : null,
         };

        sendSuccessResponse(res, formattedOrder, 'Order status updated successfully');
      } catch (err) {
        console.error(`Error updating order status ${orderId} for user ${userId} (role: ${userRole}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'update_order_status_failed', { orderId, status, role: userRole, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to update order status', err);
      }
    });


    module.exports = router;
