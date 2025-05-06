const express = require('express');
    const router = express.Router();
    const { Op } = require('sequelize');
    const { User, Service, Order, Feedback, Favorite, Notification } = require('../models'); // Add necessary models
    const authenticate = require('../middleware/authenticate');
    const authMiddleware = require('../middleware/auth');
    const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
    const { logAuditAction } = require('../utils/audit');
    
    // Middleware to ensure only clients access these routes
    router.use(authenticate, authMiddleware('client'));
    
    // Helper to get user display name
    const getUserName = (user) => {
      if (!user) return 'N/A';
      if (user.companyName) return user.companyName;
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    };
    
    // --- Favorite Providers Management ---
    
    // GET: List client's favorite providers
    router.get('/favorites', async (req, res) => {
      const clientId = req.user.id;
      try {
        const favorites = await Favorite.findAll({
          where: { clientId },
          include: [{
             model: User,
             as: 'Provider',
             attributes: ['id', 'firstName', 'lastName', 'companyName', 'profilePicture', 'industry'] // Select needed provider fields
             // Add average rating calculation here if needed
          }],
          order: [['createdAt', 'DESC']]
        });
    
        // TODO: Calculate average rating for each provider if needed
    
        const formattedFavorites = favorites.map(fav => ({
          favoriteId: fav.id, // ID of the favorite record itself
          provider: fav.Provider ? {
             ...fav.Provider.toJSON(),
             name: getUserName(fav.Provider),
             // averageRating: calculatedRating // Add calculated rating
          } : null,
          createdAt: fav.createdAt
        }));
    
        await logAuditAction(clientId, 'client_fetch_favorites_success', { count: formattedFavorites.length }, req.ip);
        sendSuccessResponse(res, formattedFavorites, 'Favorite providers fetched successfully');
      } catch (err) {
        await logAuditAction(clientId, 'client_fetch_favorites_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to fetch favorite providers', err);
      }
    });
    
    // POST: Add a provider to favorites
    router.post('/favorites', async (req, res) => {
      const clientId = req.user.id;
      const { providerId } = req.body;
    
      if (!providerId || isNaN(parseInt(providerId, 10))) {
        return sendErrorResponse(res, 400, 'Valid providerId is required');
      }
      const providerIdInt = parseInt(providerId, 10);
    
      try {
        // Check if provider exists and is actually a provider
        const provider = await User.findOne({ where: { id: providerIdInt, role: 'provider' } });
        if (!provider) {
          await logAuditAction(clientId, 'client_add_favorite_failed_not_found', { providerId: providerIdInt }, req.ip);
          return sendErrorResponse(res, 404, 'Provider not found');
        }
    
        // Check if already favorited
        const existingFavorite = await Favorite.findOne({ where: { clientId, providerId: providerIdInt } });
        if (existingFavorite) {
          await logAuditAction(clientId, 'client_add_favorite_already_exists', { providerId: providerIdInt }, req.ip);
          // Return the existing favorite info? Or just a message?
           const formattedFavorite = {
              favoriteId: existingFavorite.id,
              provider: { id: provider.id, name: getUserName(provider) }, // Basic info
              createdAt: existingFavorite.createdAt
           };
          return sendSuccessResponse(res, formattedFavorite, 'Provider is already in favorites');
        }
    
        // Create favorite record
        const newFavorite = await Favorite.create({ clientId, providerId: providerIdInt });
    
        await logAuditAction(clientId, 'client_add_favorite_success', { providerId: providerIdInt, favoriteId: newFavorite.id }, req.ip);
    
        // Return the newly created favorite info
        const formattedNewFavorite = {
           favoriteId: newFavorite.id,
           provider: { id: provider.id, name: getUserName(provider) },
           createdAt: newFavorite.createdAt
        };
        sendSuccessResponse(res, formattedNewFavorite, 'Provider added to favorites', 201);
    
      } catch (err) {
        // Handle potential unique constraint errors if DB constraint exists
        if (err.name === 'SequelizeUniqueConstraintError') {
           await logAuditAction(clientId, 'client_add_favorite_already_exists_db', { providerId: providerIdInt }, req.ip);
           return sendErrorResponse(res, 409, 'Provider is already in favorites (conflict).');
        }
        await logAuditAction(clientId, 'client_add_favorite_failed', { providerId: providerIdInt, error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to add provider to favorites', err);
      }
    });
    
    // DELETE: Remove a provider from favorites
    router.delete('/favorites/:providerId', async (req, res) => {
      const clientId = req.user.id;
      const providerId = parseInt(req.params.providerId, 10);
    
      if (isNaN(providerId)) {
        return sendErrorResponse(res, 400, 'Invalid providerId parameter');
      }
    
      try {
        const favorite = await Favorite.findOne({ where: { clientId, providerId } });
    
        if (!favorite) {
          await logAuditAction(clientId, 'client_delete_favorite_failed_not_found', { providerId }, req.ip);
          return sendErrorResponse(res, 404, 'Favorite record not found');
        }
    
        await favorite.destroy();
    
        await logAuditAction(clientId, 'client_delete_favorite_success', { providerId, favoriteId: favorite.id }, req.ip);
        sendSuccessResponse(res, null, 'Provider removed from favorites');
      } catch (err) {
        await logAuditAction(clientId, 'client_delete_favorite_failed', { providerId, error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to remove provider from favorites', err);
      }
    });
    
    // --- Feedback Submission ---
    
    // POST: Submit feedback for a completed order
    router.post('/feedback', async (req, res) => {
      const clientId = req.user.id;
      const { orderId, rating, comment } = req.body;
    
      if (!orderId || rating === undefined || rating === null) {
        return sendErrorResponse(res, 400, 'Missing required fields: orderId, rating');
      }
      if (isNaN(parseInt(orderId, 10)) || isNaN(parseInt(rating, 10)) || rating < 1 || rating > 5) {
         return sendErrorResponse(res, 400, 'Invalid orderId or rating (must be 1-5)');
      }
      const orderIdInt = parseInt(orderId, 10);
      const ratingInt = parseInt(rating, 10);
    
      try {
        // Find the order
        const order = await Order.findOne({
          where: {
            id: orderIdInt,
            clientId: clientId, // Ensure client owns the order
            status: 'completed' // Only allow feedback for completed orders
          }
        });
    
        if (!order) {
          await logAuditAction(clientId, 'client_submit_feedback_failed_order_invalid', { orderId: orderIdInt }, req.ip);
          return sendErrorResponse(res, 404, 'Completed order not found or feedback not allowed for this order status.');
        }
    
        // Check if feedback already exists for this order
        const existingFeedback = await Feedback.findOne({ where: { orderId: orderIdInt } });
        if (existingFeedback) {
          await logAuditAction(clientId, 'client_submit_feedback_failed_already_exists', { orderId: orderIdInt, feedbackId: existingFeedback.id }, req.ip);
          return sendErrorResponse(res, 409, 'Feedback has already been submitted for this order.');
        }
    
        // Create feedback
        const feedback = await Feedback.create({
          rating: ratingInt,
          comment,
          clientId,
          providerId: order.providerId, // Get providerId from the order
          orderId: orderIdInt,
        });
    
        await logAuditAction(clientId, 'client_submit_feedback_success', { orderId: orderIdInt, feedbackId: feedback.id, rating: ratingInt }, req.ip);
    
        // Notify provider about new feedback?
        await Notification.create({
           userId: order.providerId,
           message: `Otrzymano nową opinię (Ocena: ${ratingInt}) od ${getUserName(req.user)} dla zlecenia #${orderIdInt}.`,
           type: 'feedback',
           relatedId: feedback.id,
           relatedType: 'feedback'
        });
    
        sendSuccessResponse(res, feedback, 'Feedback submitted successfully', 201);
      } catch (err) {
         // Handle potential unique constraint errors if DB constraint exists on orderId
         if (err.name === 'SequelizeUniqueConstraintError') {
            await logAuditAction(clientId, 'client_submit_feedback_failed_already_exists_db', { orderId: orderIdInt }, req.ip);
            return sendErrorResponse(res, 409, 'Feedback has already been submitted for this order (conflict).');
         }
        await logAuditAction(clientId, 'client_submit_feedback_failed', { orderId: orderIdInt, error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to submit feedback', err);
      }
    });
    
    // --- Get Orders Placed by Provider (for Client's Calendar View) ---
    // This fetches ACCEPTED orders for a SPECIFIC provider, useful when viewing that provider's calendar
    router.get('/orders/provider/:providerId', async (req, res) => {
      const clientId = req.user.id; // Client making the request
      const providerId = parseInt(req.params.providerId, 10);
    
      if (isNaN(providerId)) {
        return sendErrorResponse(res, 400, 'Invalid provider ID');
      }
    
      try {
        // Find ACCEPTED orders associated with the specified provider
        // Optionally filter by orders where the current client is involved? Or show all accepted?
        // Showing all accepted orders for the provider might be better for calendar availability view.
        const orders = await Order.findAll({
          where: {
            providerId: providerId,
            status: 'accepted' // Only show confirmed/accepted orders
          },
          attributes: ['id', 'title', 'startAt', 'endAt', 'serviceId', 'clientId'], // Select only needed fields for calendar
          include: [
             // Optionally include minimal client info if needed to show who booked
             // { model: User, as: 'Client', attributes: ['id', 'firstName', 'lastName', 'companyName'] }
          ],
          order: [['startAt', 'ASC']],
        });
    
        // Format for calendar (e.g., FullCalendar event object structure)
        const calendarEvents = orders.map(order => ({
          id: order.id,
          title: order.clientId === clientId ? order.title : 'Zajęty', // Show title only if it's the current client's order
          start: order.startAt,
          end: order.endAt,
          // Add other properties like color, etc.
          // backgroundColor: order.clientId === clientId ? '#3788d8' : '#cccccc',
          // borderColor: order.clientId === clientId ? '#3788d8' : '#cccccc',
          // editable: false // Usually provider's calendar events aren't editable by client
        }));
    
        await logAuditAction(clientId, 'client_fetch_provider_orders_success', { providerId, count: calendarEvents.length }, req.ip);
        sendSuccessResponse(res, calendarEvents, "Provider's accepted orders fetched successfully");
      } catch (err) {
        await logAuditAction(clientId, 'client_fetch_provider_orders_failed', { providerId, error: err.message }, req.ip);
        sendErrorResponse(res, 500, "Failed to fetch provider's orders", err);
      }
    });
    
    
    module.exports = router;
