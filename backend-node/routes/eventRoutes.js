const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/authenticate');

// GET /api/events?date=YYYY-MM-DD[&providerId=...]
router.get('/', authenticate, eventController.getEventsForCalendar);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { Op } = require('sequelize');
// const db = require('../models');
// const { Order, User, Service } = db; // Include necessary models
// const authenticate = require('../middleware/authenticate');
// const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
// const { logAuditAction } = require('../utils/audit');
// const moment = require('moment'); // Use moment for date handling

// // Helper to get user display name
// const getUserName = (user) => {
//   if (!user) return 'N/A';
//   if (user.companyName) return user.companyName;
//   return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
// };

// // --- GET /api/events - Fetch events for calendar view ---
// router.get('/', authenticate, async (req, res) => {
//     const loggedInUserId = req.user.id;
//     const loggedInUserRole = req.user.role;
//     const { date, providerId } = req.query; // Get date and optional providerId from query

//     // Validate date
//     if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
//         return sendErrorResponse(res, 400, 'Invalid or missing date parameter. Use YYYY-MM-DD format.');
//     }

//     const targetDate = moment(date).startOf('day');
//     const startOfDay = targetDate.toISOString();
//     const endOfDay = targetDate.endOf('day').toISOString();

//     let targetProviderId = null;

//     // Determine which provider's events to fetch
//     if (loggedInUserRole === 'provider') {
//         // Provider views their own calendar unless providerId query param is somehow set (ignore it for providers)
//         targetProviderId = loggedInUserId;
//         console.log(`[EventsRoute] Provider ${loggedInUserId} fetching own events for ${date}`);
//     } else if (loggedInUserRole === 'client' || loggedInUserRole === 'admin') {
//         // Client or Admin MUST specify a providerId to view a calendar
//         if (!providerId) {
//             return sendErrorResponse(res, 400, 'Missing providerId parameter for client/admin view.');
//         }
//         targetProviderId = parseInt(providerId, 10);
//         if (isNaN(targetProviderId)) {
//             return sendErrorResponse(res, 400, 'Invalid providerId parameter.');
//         }
//         console.log(`[EventsRoute] User ${loggedInUserId} (role: ${loggedInUserRole}) fetching events for provider ${targetProviderId} on ${date}`);
//     } else {
//         // Should not happen due to authentication middleware
//         return sendErrorResponse(res, 403, 'Invalid user role.');
//     }

//     try {
//         // Fetch orders/blocks for the target provider on the specified date
//         const events = await Order.findAll({
//             where: {
//                 providerId: targetProviderId,
//                 // Fetch events that are active on this day (start or end within the day, or span across it)
//                 // Fetching only by startAt might miss long events or blocks
//                  [Op.or]: [
//                     { startAt: { [Op.between]: [startOfDay, endOfDay] } }, // Starts today
//                     { endAt: { [Op.between]: [startOfDay, endOfDay] } },   // Ends today
//                     {
//                         [Op.and]: [ // Spans across today
//                             { startAt: { [Op.lt]: startOfDay } },
//                             { endAt: { [Op.gt]: endOfDay } }
//                         ]
//                     }
//                  ],
//                 // Filter out rejected/cancelled unless admin wants to see them?
//                 // For now, show pending, accepted, completed
//                  status: { [Op.in]: ['pending', 'accepted', 'completed'] } // Adjust statuses as needed
//             },
//             include: [
//                 // Include Client info (needed for display and client-specific logic)
//                 {
//                     model: User,
//                     as: 'Client',
//                     attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'] // Select necessary fields
//                 },
//                 // Include Service info (needed for title/details)
//                 {
//                     model: Service,
//                     attributes: ['id', 'name', 'price', 'duration'] // Select necessary fields
//                 }
//                 // Provider info is known (targetProviderId)
//             ],
//             order: [['startAt', 'ASC']] // Order by start time
//         });

//         // Format data for the frontend
//         const formattedEvents = events.map(event => {
//              // Basic structure, can be expanded
//              return {
//                  id: event.id,
//                  title: event.title,
//                  startAt: event.startAt,
//                  endAt: event.endAt,
//                  status: event.status,
//                  description: event.description,
//                  clientId: event.clientId,
//                  providerId: event.providerId,
//                  serviceId: event.serviceId,
//                  client: event.Client ? {
//                      id: event.Client.id,
//                      firstName: event.Client.firstName,
//                      lastName: event.Client.lastName,
//                      // name: getUserName(event.Client) // Calculate name if needed
//                  } : null,
//                  service: event.Service ? {
//                      id: event.Service.id,
//                      name: event.Service.name,
//                      price: event.Service.price,
//                      duration: event.Service.duration
//                  } : null,
//              };
//         });

//         if (typeof logAuditAction === 'function') {
//             await logAuditAction(loggedInUserId, 'fetch_events_success', { role: loggedInUserRole, date, providerId: targetProviderId, count: formattedEvents.length }, req.ip);
//         }
//         sendSuccessResponse(res, formattedEvents, 'Events fetched successfully');

//     } catch (err) {
//         console.error(`[EventsRoute] Error fetching events for date ${date}, provider ${targetProviderId}:`, err);
//         if (typeof logAuditAction === 'function') {
//             await logAuditAction(loggedInUserId, 'fetch_events_failed', { role: loggedInUserRole, date, providerId: targetProviderId, error: err.message }, req.ip);
//         }
//         sendErrorResponse(res, 500, 'Failed to fetch events', err);
//     }
// });

// module.exports = router;
