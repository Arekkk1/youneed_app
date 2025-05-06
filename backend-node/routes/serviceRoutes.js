const express = require('express');
    const router = express.Router();
    const { Op } = require('sequelize');
    const { User, Service, Order, Feedback, OpeningHour } = require('../models'); // Add necessary models
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
    
    // --- GET Provider's Own Services ---
    router.get('/my-services', authenticate, authMiddleware('provider'), async (req, res) => {
      const providerId = req.user.id;
      try {
        const services = await Service.findAll({
          where: { providerId },
          order: [['name', 'ASC']]
        });
        await logAuditAction(providerId, 'fetch_my_services_success', { count: services.length }, req.ip);
        sendSuccessResponse(res, services, 'Your services fetched successfully');
      } catch (err) {
        await logAuditAction(providerId, 'fetch_my_services_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to fetch your services', err);
      }
    });
    
    // --- POST Create New Service (Provider only) ---
    router.post('/', authenticate, authMiddleware('provider'), async (req, res) => {
      // Add validation using express-validator if needed
      const { name, description, price, duration, category } = req.body;
      const providerId = req.user.id;
    
      if (!name || price === undefined || price === null || duration === undefined || duration === null) {
        return sendErrorResponse(res, 400, 'Missing required fields: name, price, duration');
      }
      if (isNaN(parseFloat(price)) || isNaN(parseInt(duration, 10))) {
         return sendErrorResponse(res, 400, 'Invalid format for price or duration');
      }
    
      try {
        const service = await Service.create({
          name,
          description,
          price: parseFloat(price),
          duration: parseInt(duration, 10),
          category,
          providerId,
        });
        await logAuditAction(providerId, 'create_service_success', { serviceId: service.id, name: service.name }, req.ip);
        sendSuccessResponse(res, service, 'Service created successfully', 201);
      } catch (err) {
        await logAuditAction(providerId, 'create_service_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to create service', err);
      }
    });
    
    // --- PUT Update Service (Provider only) ---
    router.put('/:id', authenticate, authMiddleware('provider'), async (req, res) => {
      const serviceId = parseInt(req.params.id, 10);
      if (isNaN(serviceId)) {
        return sendErrorResponse(res, 400, 'Invalid service ID');
      }
      const { name, description, price, duration, category } = req.body;
      const providerId = req.user.id;
    
      // Basic validation
      if (!name && !description && price === undefined && duration === undefined && !category) {
         return sendErrorResponse(res, 400, 'No update data provided');
      }
      if (price !== undefined && isNaN(parseFloat(price))) {
         return sendErrorResponse(res, 400, 'Invalid format for price');
      }
       if (duration !== undefined && isNaN(parseInt(duration, 10))) {
          return sendErrorResponse(res, 400, 'Invalid format for duration');
       }
    
      try {
        const service = await Service.findOne({
          where: {
            id: serviceId,
            providerId: providerId // Ensure provider owns the service
          }
        });
    
        if (!service) {
          await logAuditAction(providerId, 'update_service_failed_not_found_or_unauthorized', { serviceId }, req.ip);
          return sendErrorResponse(res, 404, 'Service not found or access denied');
        }
    
        let updated = false;
        let changes = {};
        if (name && service.name !== name) { service.name = name; updated = true; changes.name = name; }
        if (description && service.description !== description) { service.description = description; updated = true; changes.description = description; }
        if (price !== undefined && service.price !== parseFloat(price)) { service.price = parseFloat(price); updated = true; changes.price = price; }
        if (duration !== undefined && service.duration !== parseInt(duration, 10)) { service.duration = parseInt(duration, 10); updated = true; changes.duration = duration; }
        if (category && service.category !== category) { service.category = category; updated = true; changes.category = category; }
    
        if (updated) {
          await service.save();
          await logAuditAction(providerId, 'update_service_success', { serviceId: service.id, changes }, req.ip);
          sendSuccessResponse(res, service, 'Service updated successfully');
        } else {
          await logAuditAction(providerId, 'update_service_no_change', { serviceId }, req.ip);
          sendSuccessResponse(res, service, 'No changes applied to service');
        }
      } catch (err) {
        await logAuditAction(providerId, 'update_service_failed', { serviceId, error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to update service', err);
      }
    });
    
    // --- DELETE Service (Provider only) ---
    router.delete('/:id', authenticate, authMiddleware('provider'), async (req, res) => {
      const serviceId = parseInt(req.params.id, 10);
      if (isNaN(serviceId)) {
        return sendErrorResponse(res, 400, 'Invalid service ID');
      }
      const providerId = req.user.id;
    
      try {
        const service = await Service.findOne({
          where: {
            id: serviceId,
            providerId: providerId
          }
        });
    
        if (!service) {
          await logAuditAction(providerId, 'delete_service_failed_not_found_or_unauthorized', { serviceId }, req.ip);
          return sendErrorResponse(res, 404, 'Service not found or access denied');
        }
    
        // Check for active orders using this service before deleting?
        const activeOrders = await Order.count({
           where: { serviceId: serviceId, status: { [Op.in]: ['pending', 'accepted'] } }
        });
        if (activeOrders > 0) {
           await logAuditAction(providerId, 'delete_service_failed_active_orders', { serviceId, activeOrders }, req.ip);
           return sendErrorResponse(res, 400, `Cannot delete service with ${activeOrders} active order(s). Please complete or cancel them first.`);
        }
    
        await service.destroy();
    
        await logAuditAction(providerId, 'delete_service_success', { serviceId: service.id, name: service.name }, req.ip);
        sendSuccessResponse(res, null, 'Service deleted successfully');
      } catch (err) {
        await logAuditAction(providerId, 'delete_service_failed', { serviceId, error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to delete service', err);
      }
    });
    
    // --- GET Public Service Search/Listing ---
    // Accessible by anyone (clients, guests)
    router.get('/search', async (req, res) => {
      try {
        const { query, category, location, minPrice, maxPrice, rating } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
    
        let whereService = {};
        let whereProvider = { role: 'provider' }; // Only search providers
        let includeProvider = {
           model: User,
           as: 'Provider',
           attributes: ['id', 'firstName', 'lastName', 'companyName', 'profilePicture', 'address'], // Include address for location filtering
           where: whereProvider,
           required: true // Inner join to filter by provider criteria
        };
    
        // Build where clauses based on query params
        if (query) {
          whereService[Op.or] = [
            { name: { [Op.like]: `%${query}%` } },
            { description: { [Op.like]: `%${query}%` } },
            // Optionally search provider name too (requires including Provider differently or separate query)
            // { '$Provider.companyName$': { [Op.like]: `%${query}%` } }, // Requires careful include setup
          ];
        }
        if (category) {
          whereService.category = category;
        }
        if (minPrice) {
          whereService.price = { ...whereService.price, [Op.gte]: parseFloat(minPrice) };
        }
        if (maxPrice) {
          whereService.price = { ...whereService.price, [Op.lte]: parseFloat(maxPrice) };
        }
        // Location filtering (basic example: city) - requires address data on Provider
        if (location) {
           // Assuming address is stored as JSON: { city: '...', ... }
           // This requires DB support for JSON queries or a separate Address table
           // Example with JSON (syntax might vary based on DB - MySQL example):
           // includeProvider.where['address.city'] = { [Op.like]: `%${location}%` }; // Simplified - needs JSON_EXTRACT or similar
           // OR if Address table exists:
           // includeProvider.include = [{ model: Address, where: { city: { [Op.like]: `%${location}%` } } }]
           // For simplicity, skipping complex location filtering for now.
        }
        // Rating filtering (requires calculating average rating for provider) - Complex, skip for now
    
        const { count, rows: services } = await Service.findAndCountAll({
          where: whereService,
          include: [includeProvider],
          limit: limit,
          offset: offset,
          order: [['name', 'ASC']], // Add more sorting options later
          distinct: true, // Needed when using includes with limits
        });
    
        const formattedServices = services.map(service => ({
          ...service.toJSON(),
          Provider: service.Provider ? {
             id: service.Provider.id,
             name: getUserName(service.Provider),
             profilePicture: service.Provider.profilePicture,
             // Add avg rating here if calculated
          } : null,
        }));
    
        const totalPages = Math.ceil(count / limit);
    
        // No audit log for public search? Or log anonymously?
        // await logAuditAction(null, 'public_service_search', { query, category, location, page, limit }, req.ip);
    
        sendSuccessResponse(res, {
          services: formattedServices,
          pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalServices: count,
            limit: limit
          }
        }, 'Services found successfully');
    
      } catch (err) {
        // await logAuditAction(null, 'public_service_search_failed', { error: err.message }, req.ip);
        console.error("Service Search Error:", err);
        sendErrorResponse(res, 500, 'Failed to search for services', err);
      }
    });
    
    // --- GET Public Service Details (including Provider Info) ---
    router.get('/:id/details', async (req, res) => {
       const serviceId = parseInt(req.params.id, 10);
       if (isNaN(serviceId)) {
         return sendErrorResponse(res, 400, 'Invalid service ID');
       }
       try {
          const service = await Service.findByPk(serviceId, {
             include: [
                {
                   model: User,
                   as: 'Provider',
                   attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'googleId', 'facebookId', 'terms', 'restrictions'] }, // Exclude sensitive provider data
                   include: [
                      { model: OpeningHour, as: 'OpeningHours', order: [['dayOfWeek', 'ASC']] },
                      // Calculate average rating - requires aggregation
                      // { model: Feedback, as: 'ProviderFeedbacks', attributes: [] } // For aggregation
                   ]
                },
                // Include recent feedback for the service/provider?
                // { model: Feedback, include: [{ model: User, as: 'Client', attributes: ['firstName'] }] } // Needs association Service->Feedback? No, Provider->Feedback
             ]
          });
    
          if (!service || !service.Provider) { // Ensure service and provider exist
             return sendErrorResponse(res, 404, 'Service or provider not found');
          }
    
          // TODO: Calculate average rating for the provider
          const feedbacks = await Feedback.findAll({ where: { providerId: service.Provider.id }, attributes: ['rating'] });
          const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
          const averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : null;
    
          const formattedService = {
             ...service.toJSON(),
             Provider: {
                ...service.Provider.toJSON(),
                name: getUserName(service.Provider),
                averageRating: averageRating ? parseFloat(averageRating) : null,
                openingHours: service.Provider.OpeningHours || [],
                // Remove nested associations if not needed
                OpeningHours: undefined,
             }
          };
    
          sendSuccessResponse(res, formattedService, 'Service details fetched successfully');
       } catch (err) {
          console.error("Get Service Details Error:", err);
          sendErrorResponse(res, 500, 'Failed to fetch service details', err);
       }
    });
    
    
    module.exports = router;
