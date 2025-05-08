const { Op } = require('sequelize');
const db = require('../models');
const { Order, User, Service } = db;
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { logAuditAction } = require('../utils/audit');

// Helper to get user display name
const getUserName = (user) => {
  if (!user) return 'N/A';
  if (user.companyName) return user.companyName;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
};

exports.getEventsForCalendar = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    // Get providerId from query, ensure it's parsed correctly or null
    const queryProviderId = req.query.providerId ? parseInt(req.query.providerId, 10) : null;
    const { date } = req.query;

    // --- DEBUG LOGGING START ---
    console.log(`[EventsController DEBUG] User ID: ${userId}, Role: ${userRole}, Date: ${date}, Query Provider ID: ${queryProviderId}`);
    // --- DEBUG LOGGING END ---

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return sendErrorResponse(res, 400, 'Invalid or missing date parameter. Use YYYY-MM-DD format.');
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
        return sendErrorResponse(res, 400, 'Invalid date value.');
    }
    targetDate.setHours(0, 0, 0, 0);
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let targetProviderId = null;
    let isGlobalClientView = false; // Flag for the new client view

    try {
        // Determine whose calendar to fetch OR if it's the global client view
        if (userRole === 'provider') {
            targetProviderId = userId;
            console.log(`[EventsController DEBUG] Provider View. Target Provider ID: ${targetProviderId}`);
        } else if (userRole === 'client') {
            if (queryProviderId && !isNaN(queryProviderId)) {
                // Client viewing specific provider's calendar
                targetProviderId = queryProviderId;
                console.log(`[EventsController DEBUG] Client View (Specific Provider). Target Provider ID: ${targetProviderId}`);
            } else {
                // Client viewing their own global calendar (NO providerId specified)
                isGlobalClientView = true;
                console.log(`[EventsController DEBUG] Client View (Global 'My Orders'). Fetching for Client ID: ${userId}`);
            }
        } else if (userRole === 'admin' && queryProviderId && !isNaN(queryProviderId)) {
            // Admin viewing specific provider's calendar
            targetProviderId = queryProviderId;
            console.log(`[EventsController DEBUG] Admin View. Target Provider ID: ${targetProviderId}`);
        } else {
            // Invalid combination (e.g., admin without providerId, client with invalid providerId)
            console.warn(`[EventsController] Invalid role/parameter combination for user ${userId}. Role: ${userRole}, queryProviderId: ${queryProviderId}`);
            return sendErrorResponse(res, 403, 'Access denied or invalid parameters for your role.');
        }

        // --- Build Query ---
        let whereClause = {};
        const includeAssociations = [
            // Always include Client, Provider, and Service details
            { model: User, as: 'Client', attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'] },
            { model: User, as: 'Provider', attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'] },
            { model: Service, as: 'Service', attributes: ['id', 'name', 'price', 'duration'] }, // Dodano as: 'Service'
        ];

        // Define date range condition (common for all views)
        const dateCondition = {
            startAt: { [Op.lt]: endOfDay },
            [Op.or]: [
                { endAt: { [Op.gt]: startOfDay } },
                { endAt: null }
            ]
        };

        let orders = [];

        if (isGlobalClientView) {
            // GLOBAL CLIENT VIEW: Fetch all orders for the logged-in client on the target date
            whereClause = {
                clientId: userId,
                ...dateCondition,
                // Optionally filter out cancelled orders from the global view?
                // status: { [Op.ne]: 'cancelled' }
            };
            console.log('[EventsController DEBUG] Global Client View - Sequelize Where Clause:', JSON.stringify(whereClause, null, 2));
            orders = await Order.findAll({
                where: whereClause,
                include: includeAssociations,
                order: [['startAt', 'ASC']],
            });
            console.log(`[EventsController DEBUG] Global Client View - Found ${orders.length} raw orders for client ${userId} on ${date}`);

        } else if (targetProviderId) {
            // PROVIDER-SPECIFIC VIEW (Client/Admin) or PROVIDER'S OWN VIEW
            whereClause = {
                providerId: targetProviderId,
                ...dateCondition
            };
            console.log('[EventsController DEBUG] Provider/Admin View - Sequelize Where Clause:', JSON.stringify(whereClause, null, 2));

            if (userRole === 'client') {
                // Client viewing specific provider: Fetch provider's accepted orders AND client's own orders with this provider
                const providerAcceptedOrders = await Order.findAll({
                    where: { ...whereClause, status: 'accepted' },
                    include: includeAssociations,
                    order: [['startAt', 'ASC']],
                });
                const clientOwnOrdersWithProvider = await Order.findAll({
                    where: { ...whereClause, clientId: userId }, // Only client's own orders with THIS provider
                    include: includeAssociations,
                    order: [['startAt', 'ASC']],
                });

                // Combine and remove duplicates
                const combinedOrders = [...providerAcceptedOrders, ...clientOwnOrdersWithProvider];
                const uniqueOrdersMap = new Map();
                combinedOrders.forEach(order => uniqueOrdersMap.set(order.id, order));
                orders = Array.from(uniqueOrdersMap.values());
                orders.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
                console.log(`[EventsController DEBUG] Client View (Specific Provider) - Found ${orders.length} combined orders for provider ${targetProviderId} / client ${userId} on ${date}`);

            } else {
                // Provider or Admin viewing provider's calendar: Fetch all relevant orders for the provider
                orders = await Order.findAll({
                    where: whereClause, // Fetches all statuses implicitly
                    include: includeAssociations,
                    order: [['startAt', 'ASC']],
                });
                console.log(`[EventsController DEBUG] Provider/Admin View - Found ${orders.length} raw orders for provider ${targetProviderId} on ${date}`);
            }
        } else {
            // Should not happen due to initial checks, but handle defensively
            console.warn(`[EventsController] Could not determine fetch logic. Role: ${userRole}, isGlobalClientView: ${isGlobalClientView}, targetProviderId: ${targetProviderId}`);
            return sendErrorResponse(res, 400, 'Could not determine the calendar context.');
        }


        // --- Format response ---
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
            rating: order.rating, // Include rating
            client: order.Client ? { id: order.Client.id, name: getUserName(order.Client), email: order.Client.email } : null,
            provider: order.Provider ? { id: order.Provider.id, name: getUserName(order.Provider), email: order.Provider.email } : null,
            service: order.Service ? { id: order.Service.id, name: order.Service.name, duration: order.Service.duration, price: order.Service.price } : null,
            duration: order.Service?.duration || (order.endAt ? (new Date(order.endAt).getTime() - new Date(order.startAt).getTime()) / (60 * 1000) : 30)
        }));

        console.log(`[EventsController DEBUG] Sending ${formattedOrders.length} formatted events.`);

        const auditDetails = { role: userRole, date, count: formattedOrders.length };
        if (isGlobalClientView) auditDetails.view = 'global_client';
        if (targetProviderId) auditDetails.targetProviderId = targetProviderId;

        if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_calendar_events_success', auditDetails, req.ip);
        }
        sendSuccessResponse(res, formattedOrders, 'Events fetched successfully');

    } catch (err) {
        console.error(`[EventsController] Error fetching events for user ${userId} (role: ${userRole}), date: ${date}, provider: ${queryProviderId || targetProviderId}:`, err);
        const auditDetails = { role: userRole, date, error: err.message };
         if (isGlobalClientView) auditDetails.view = 'global_client';
         if (targetProviderId) auditDetails.targetProviderId = targetProviderId;
         if (queryProviderId) auditDetails.queryProviderId = queryProviderId; // Log original query param on error

        if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_calendar_events_failed', auditDetails, req.ip);
        }
        sendErrorResponse(res, 500, 'Failed to fetch events', err);
    }
};
