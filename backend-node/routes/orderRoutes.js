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
      try {
        const where = {};
        const userRole = req.user.role;
        const userId = req.user.id;

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
            { model: Service, attributes: ['id', 'name', 'price', 'duration'] }, // Added duration
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
    // ** FIX: Moved this route BEFORE /:id to avoid conflict **
    router.get('/recent', authenticate, async (req, res) => {
      const userId = req.user.id;
      const userRole = req.user.role;
      console.log(`[DEBUG] /orders/recent called by user ${userId}, role: ${userRole}`);

      try {
        let where = {};

        if (!userRole) {
            console.error(`[ERROR] /orders/recent: Missing user role for user ${userId}`);
            return sendErrorResponse(res, 400, 'User role not found in token.');
        }

        if (userRole === 'provider') {
          where.providerId = userId;
        } else if (userRole === 'client') {
          where.clientId = userId;
        } else if (userRole !== 'admin') {
          // Allow admin to see all recent orders if needed, otherwise deny
          // For now, let's assume admin shouldn't see this specific view
          return sendErrorResponse(res, 403, 'Access denied for this role');
        }

        const orders = await Order.findAll({
          where,
          include: [
            { model: User, as: 'Client', attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'] }, // Added email
            { model: User, as: 'Provider', attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'] }, // Added email
            { model: Service, attributes: ['id', 'name'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: 10, // Keep limit for recent orders
        });

        const formattedOrders = orders.map(order => ({
          id: order.id,
          title: order.title,
          // Use helper function for consistency
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
      try {
        const userId = req.user.id;
        const userRole = req.user.role;
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
           // Admin stats might need different logic, e.g., total platform revenue
           whereBase = { status: 'completed' }; // Example: total completed value across platform
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
                // Ensure count is treated as a number
                stats[item.status] = parseInt(item.count, 10) || 0;
            }
        });

        // Calculate total value based on completed orders and associated service price
        const valueResult = await Order.findOne({
           attributes: [[db.sequelize.fn('SUM', db.sequelize.col('Service.price')), 'total']],
           include: [{ model: Service, attributes: [], required: true }], // Ensure join with Service
           where: { ...whereBase, status: 'completed' }, // Only sum completed orders
           raw: true,
        });
        // Ensure totalValue is a number, default to 0 if null/undefined
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
      try {
        const userId = req.user.id;
        const userRole = req.user.role;
        let where = {};

        if (userRole === 'provider') {
          where.providerId = userId;
        } else if (userRole === 'client') {
          where.clientId = userId;
        } else if (userRole !== 'admin') {
          return sendErrorResponse(res, 403, 'Access denied');
        }
        // Admin might see aggregated daily counts across all users

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the day 7 days ago

        where.createdAt = { [Op.gte]: sevenDaysAgo };

        const dailyCounts = await Order.findAll({
          where,
          attributes: [
            // Use DATE function to group by date part only
            [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
          ],
          group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
          order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']], // Order by date
          raw: true,
        });

         // Format the date to YYYY-MM-DD for consistency if needed by the frontend chart library
         const formattedCounts = dailyCounts.map(item => ({
             date: item.date, // Keep as is or format: new Date(item.date).toISOString().split('T')[0],
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
    // ** IMPORTANT: This route MUST come AFTER specific routes like /recent, /stats etc. **
    router.get('/:id', authenticate, async (req, res) => {
      console.log(`[DEBUG] GET /orders/:id called with id: ${req.params.id}`); // Keep this log
      const orderId = parseInt(req.params.id, 10);

      // Check if parsing resulted in NaN (e.g., if id was "recent")
      if (isNaN(orderId)) {
        console.error(`[ERROR] Invalid order ID received: ${req.params.id}`);
        return sendErrorResponse(res, 400, 'Invalid order ID format'); // More specific error
      }

      try {
        const order = await Order.findByPk(orderId, {
          include: [
            { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName', 'phoneNumber'] },
            { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName', 'phoneNumber'] },
            { model: Service, attributes: ['id', 'name', 'price', 'description', 'duration', 'category'] },
            { model: Feedback, attributes: ['id', 'rating', 'comment', 'createdAt'] }
          ],
        });

        if (!order) {
           if (typeof logAuditAction === 'function') {
              await logAuditAction(req.user.id, 'fetch_order_detail_failed_not_found', { orderId }, req.ip);
           }
          return sendErrorResponse(res, 404, 'Order not found');
        }

        // Authorization check: Ensure the logged-in user is related to the order or is an admin
        const isClient = req.user.role === 'client' && order.clientId === req.user.id;
        const isProvider = req.user.role === 'provider' && order.providerId === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isClient && !isProvider && !isAdmin) {
           if (typeof logAuditAction === 'function') {
              await logAuditAction(req.user.id, 'fetch_order_detail_failed_unauthorized', { orderId, targetClientId: order.clientId, targetProviderId: order.providerId }, req.ip);
           }
          return sendErrorResponse(res, 403, 'Access denied to this order');
        }

        // Format response using helper function
        const formattedOrder = {
          ...order.toJSON(),
          Client: order.Client ? { ...order.Client.toJSON(), name: getUserName(order.Client) } : null,
          Provider: order.Provider ? { ...order.Provider.toJSON(), name: getUserName(order.Provider) } : null,
        };

         if (typeof logAuditAction === 'function') {
            await logAuditAction(req.user.id, 'fetch_order_detail_success', { orderId }, req.ip);
         }
        sendSuccessResponse(res, formattedOrder, 'Order details fetched successfully');
      } catch (err) {
        console.error(`Error fetching order detail ${orderId} for user ${req.user.id}:`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(req.user.id, 'fetch_order_detail_failed', { orderId, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch order details', err);
      }
    });

    // --- Create Order ---
    // Allows clients to create orders for providers
    // Allows providers to create orders (potentially for clients, or just block time)
    router.post('/', authenticate, authMiddleware(['client', 'provider', 'admin']), async (req, res) => {
      // Added 'admin' to authMiddleware if admins can also create orders
      const {
          serviceId,
          title, // Title might be optional if derived from service
          description, // Optional notes from frontend
          startAt,
          // endAt, // endAt is usually calculated based on service duration
          providerId, // Required if client is creating
          clientId, // Required if provider is creating FOR a client
          notes, // Use 'notes' from frontend form
          duration // Pass duration from frontend if available
      } = req.body;
      const userRole = req.user.role;
      const userId = req.user.id; // ID of the logged-in user making the request

      console.log(`[POST /orders] Request received from user ${userId} (Role: ${userRole})`);
      console.log(`[POST /orders] Body:`, req.body);


      try {
        // --- Validation ---
        if (!serviceId || !startAt) {
          return sendErrorResponse(res, 400, 'Missing required fields: serviceId, startAt');
        }
        const startDate = new Date(startAt);
        if (isNaN(startDate.getTime())) {
            return sendErrorResponse(res, 400, 'Invalid start date format');
        }
        // Optional: Validate start date is not in the past (allow buffer?)
        // if (startDate < new Date()) {
        //     return sendErrorResponse(res, 400, 'Start date cannot be in the past');
        // }

        // --- Fetch Service Details ---
        const service = await Service.findByPk(serviceId);
        if (!service) {
           if (typeof logAuditAction === 'function') {
              await logAuditAction(userId, 'create_order_failed_service_not_found', { serviceId }, req.ip);
           }
          return sendErrorResponse(res, 404, 'Service not found');
        }

        // --- Determine Order Details based on Role ---
        let orderData = {
          title: title || service.name, // Use provided title or default to service name
          description: description || notes || null, // Use description or notes
          startAt: startDate,
          // Calculate endAt based on service duration
          endAt: new Date(startDate.getTime() + (duration || service.duration || 30) * 60 * 1000), // Use passed duration, service duration, or default 30 mins
          status: 'pending', // Default status for new orders
          serviceId: service.id,
          totalAmount: service.price, // Store the price at the time of booking
          notes: notes || null, // Store notes separately if needed
        };

        let notificationRecipientId = null;
        let notificationMessage = '';
        const creatorName = getUserName(req.user); // Get creator's name

        if (userRole === 'client') {
            // Client is creating the order
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
            orderData.clientId = userId; // The logged-in client
            orderData.providerId = parseInt(providerId, 10);
            notificationRecipientId = orderData.providerId;
            notificationMessage = `Nowe zlecenie "${orderData.title}" od klienta ${creatorName}.`;
            console.log(`[POST /orders] Client ${userId} creating order for provider ${orderData.providerId}`);

        } else if (userRole === 'provider') {
            // Provider is creating the order (e.g., blocking time or booking for a client)
            if (service.providerId !== userId) {
                 if (typeof logAuditAction === 'function') {
                    await logAuditAction(userId, 'create_order_failed_provider_mismatch', { serviceId, expectedProviderId: service.providerId }, req.ip);
                 }
                return sendErrorResponse(res, 403, 'Provider can only create orders for their own services');
            }
            orderData.providerId = userId; // The logged-in provider
            if (clientId) {
                // Provider is booking FOR a specific client
                const clientExists = await User.findByPk(clientId);
                if (!clientExists || clientExists.role !== 'client') {
                    return sendErrorResponse(res, 404, 'Specified client not found or is not a client.');
                }
                orderData.clientId = parseInt(clientId, 10);
                notificationRecipientId = orderData.clientId;
                notificationMessage = `Usługodawca ${creatorName} utworzył dla Ciebie nowe zlecenie: ${orderData.title}`;
                console.log(`[POST /orders] Provider ${userId} creating order for client ${orderData.clientId}`);
            } else {
                // Provider is blocking time (no client assigned)
                orderData.clientId = null; // Explicitly set to null
                orderData.status = 'accepted'; // Provider blocking time is auto-accepted? Or keep pending? Let's keep pending for consistency.
                console.log(`[POST /orders] Provider ${userId} creating order (blocking time)`);
            }
        } else if (userRole === 'admin') {
             // Admin creating order - requires both clientId and providerId in request body
             if (!clientId || !providerId) {
                 return sendErrorResponse(res, 400, 'Admin must specify both clientId and providerId.');
             }
             // Validate client and provider exist and have correct roles
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
             orderData.status = 'accepted'; // Admin-created orders might be auto-accepted?
             // Notify both client and provider?
             // notificationRecipientId = [orderData.clientId, orderData.providerId]; // Send to both?
             notificationMessage = `Administrator utworzył zlecenie "${orderData.title}".`;
             console.log(`[POST /orders] Admin ${userId} creating order for client ${orderData.clientId} and provider ${orderData.providerId}`);
        } else {
            return sendErrorResponse(res, 403, 'Invalid user role for creating orders');
        }

        // --- Check for Conflicts (Optional but Recommended) ---
        // Find existing orders for the provider that overlap with the new order's time slot
        const conflictingOrder = await Order.findOne({
            where: {
                providerId: orderData.providerId,
                status: { [Op.in]: ['pending', 'accepted', 'in_progress'] }, // Check against non-final statuses
                [Op.or]: [
                    // Existing order starts within the new order's time
                    { startAt: { [Op.between]: [orderData.startAt, orderData.endAt] } },
                    // Existing order ends within the new order's time
                    { endAt: { [Op.between]: [orderData.startAt, orderData.endAt] } },
                    // Existing order completely envelops the new order's time
                    { [Op.and]: [
                        { startAt: { [Op.lte]: orderData.startAt } },
                        { endAt: { [Op.gte]: orderData.endAt } }
                    ]}
                ]
            }
        });

        if (conflictingOrder) {
            console.warn(`[POST /orders] Conflict detected for provider ${orderData.providerId} at ${orderData.startAt}. Conflicting order ID: ${conflictingOrder.id}`);
            return sendErrorResponse(res, 409, 'Wybrany termin jest już zajęty lub oczekuje na akceptację.'); // 409 Conflict
        }


        // --- Create the Order ---
        const order = await Order.create(orderData);
        console.log(`[POST /orders] Order ${order.id} created successfully.`);

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'create_order_success', { orderId: order.id, role: userRole, clientId: order.clientId, providerId: order.providerId }, req.ip);
         }

        // --- Send Notification ---
        if (notificationRecipientId && notificationMessage && typeof Notification !== 'undefined') {
          try {
              // Handle single or multiple recipients if admin creates
              const recipients = Array.isArray(notificationRecipientId) ? notificationRecipientId : [notificationRecipientId];
              for (const recipient of recipients) {
                  await Notification.create({
                    userId: recipient,
                    message: notificationMessage,
                    type: 'order', // Or 'new_order'
                    relatedId: order.id,
                    relatedType: 'order',
                    isRead: false,
                  });
                   console.log(`[POST /orders] Notification sent to user ${recipient}`);
              }
          } catch (notificationError) {
              console.error(`Failed to create notification for order ${order.id}:`, notificationError);
              // Decide if order creation should fail if notification fails (probably not)
          }
        }

        // --- Fetch the created order with associations for the response ---
        const createdOrder = await Order.findByPk(order.id, {
           include: [
             { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: Service, attributes: ['id', 'name', 'price', 'duration'] }, // Include duration
           ]
        });
         // Format response using helper function
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
        // Check for specific Sequelize validation errors if needed
        if (err.name === 'SequelizeValidationError') {
             const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
             return sendErrorResponse(res, 400, 'Validation failed', { errors });
        }
        sendErrorResponse(res, 500, 'Failed to create order', err);
      }
    });

    // --- Update Order Status (Provider or Client cancelling pending) ---
    router.patch('/:id/status', authenticate, async (req, res) => {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return sendErrorResponse(res, 400, 'Invalid order ID');
      }
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Define allowed statuses based on role
      const allowedStatuses = {
          provider: ['accepted', 'rejected', 'completed', 'cancelled'],
          client: ['cancelled'], // Clients can only cancel pending orders
          admin: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] // Admins can potentially change to any status
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

        // Authorization and State Transition Logic
        let canUpdate = false;
        let notificationRecipientId = null;
        let notificationMessage = '';
        const updaterName = getUserName(req.user);


        if (userRole === 'provider' && order.providerId === userId) {
            // Provider can accept/reject pending, complete accepted, or cancel pending/accepted
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
            // Client can only cancel a pending order
            if (status === 'cancelled' && oldStatus === 'pending') {
                 canUpdate = true;
                 notificationRecipientId = order.providerId;
                 notificationMessage = `Zlecenie "${order.title}" zostało anulowane przez klienta ${updaterName}.`;
            }
        } else if (userRole === 'admin') {
            // Admin can change status (potentially bypass state checks, use with caution)
            canUpdate = true; // Or add specific admin rules if needed
            // Notify both client and provider?
            notificationRecipientId = [order.clientId, order.providerId].filter(id => id); // Filter out null IDs
            notificationMessage = `Status zlecenia "${order.title}" został zmieniony na "${status}" przez administratora.`;
        }

        if (!canUpdate) {
             if (typeof logAuditAction === 'function') {
                await logAuditAction(userId, 'update_order_status_failed_unauthorized_or_invalid_transition', { orderId, oldStatus, newStatus: status, role: userRole }, req.ip);
             }
            return sendErrorResponse(res, 403, `Access denied or invalid status transition from "${oldStatus}" to "${status}" for role "${userRole}".`);
        }


        if (oldStatus === status) {
            // No change needed, return success but indicate no change
            return sendSuccessResponse(res, order, 'Order status unchanged');
        }

        // Update status and save
        order.status = status;
        await order.save();

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'update_order_status_success', { orderId: order.id, oldStatus, newStatus: status, role: userRole }, req.ip);
         }

        // Send notification to the other party (if applicable)
        if (notificationRecipientId && notificationMessage && typeof Notification !== 'undefined') {
           try {
                const recipients = Array.isArray(notificationRecipientId) ? notificationRecipientId : [notificationRecipientId];
                for (const recipient of recipients) {
                   if (recipient) { // Ensure recipient ID is not null
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

        // Fetch updated order with associations for response
        const updatedOrder = await Order.findByPk(order.id, {
           include: [
             { model: User, as: 'Client', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: User, as: 'Provider', attributes: ['id', 'email', 'firstName', 'lastName', 'companyName'] },
             { model: Service, attributes: ['id', 'name', 'price', 'duration'] }, // Include duration
           ]
        });
         // Format response
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
