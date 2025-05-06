const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { User, Service } = db; // Add other models to search as needed
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const authenticate = require('../middleware/authenticate'); // Optional: Add if search requires login

// Helper to get user display name (consider moving to a shared util)
const getUserName = (user) => {
  if (!user) return 'N/A';
  if (user.companyName) return user.companyName;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
};

// GET /api/search?q=...&industry=...&location=...
// router.use(authenticate); // Uncomment if search should be protected

router.get('/', async (req, res) => {
    const query = req.query.q?.trim();
    const industryQuery = req.query.industry?.trim();
    // const locationQuery = req.query.location?.trim(); // Location search not implemented yet
    const userId = req.user?.id; // Get user ID if authenticated

    console.log(`[searchRoutes] Received search request: q='${query}', industry='${industryQuery}'`);


    // If no query and no industry, return empty or featured items? Return empty for now.
    if (!query && !industryQuery) {
        console.log('[searchRoutes] No search query or industry provided. Returning empty results.');
        return sendSuccessResponse(res, [], 'Please provide search criteria.');
    }

    // Build where clauses
    let providerWhere = { role: 'provider' };
    let serviceWhere = {}; // Add conditions like status if needed { status: 'active' }
    let serviceIncludeWhere = {}; // For filtering based on provider attributes (like industry)

    if (query) {
        const searchTerm = `%${query}%`;
        providerWhere[Op.or] = [
            { companyName: { [Op.like]: searchTerm } },
            { firstName: { [Op.like]: searchTerm } },
            { lastName: { [Op.like]: searchTerm } },
            { email: { [Op.like]: searchTerm } },
            // Add other searchable provider fields if needed
        ];
        serviceWhere[Op.or] = [
             { name: { [Op.like]: searchTerm } },
             { description: { [Op.like]: searchTerm } },
             { category: { [Op.like]: searchTerm } },
        ];
    }

    if (industryQuery) {
        const industryTerm = `%${industryQuery}%`;
        // Filter providers directly by industry
        providerWhere.industry = { [Op.like]: industryTerm };
        // Filter services based on their provider's industry
        serviceIncludeWhere.industry = { [Op.like]: industryTerm };
    }

    // Location filtering logic would go here if implemented

    try {
        const [providers, services] = await Promise.all([
            // Search Providers
            User.findAll({
                where: providerWhere,
                attributes: ['id', 'companyName', 'firstName', 'lastName', 'profilePicture', 'industry'], // Select relevant fields
                limit: 15, // Limit results
            }),
            // Search Services
            Service.findAll({
                where: serviceWhere,
                attributes: ['id', 'name', 'price', 'duration', 'category', 'description', 'providerId'], // Select relevant fields
                include: [{
                    model: User,
                    as: 'Provider',
                    attributes: ['id', 'companyName', 'firstName', 'lastName', 'profilePicture', 'industry'], // Include provider info
                    where: serviceIncludeWhere, // Apply provider-based filters here
                    required: true // Use inner join if filtering by provider attributes
                }],
                limit: 15, // Limit results
            }),
        ]);

        console.log(`[searchRoutes] Found ${providers.length} providers and ${services.length} services.`);


        // Format results
        const formattedProviders = providers.map(p => ({
            id: p.id,
            name: getUserName(p),
            type: 'Dostawca', // 'provider'
            profilePicture: p.profilePicture, // Include profile picture
            industry: p.industry, // Include industry
            // Add rating/feedback count if available later
            url: `/provider/${p.id}` // Example URL - frontend might need to adjust this
        }));

        const formattedServices = services.map(s => ({
            id: s.id,
            name: s.name,
            type: 'Usługa', // 'service'
            price: s.price,
            duration: s.duration,
            category: s.category,
            description: s.description, // Include description
            providerId: s.providerId, // Include providerId
            providerName: s.Provider ? getUserName(s.Provider) : 'N/A',
            providerProfilePicture: s.Provider?.profilePicture, // Include provider picture
            url: `/service/${s.id}` // Example URL - frontend might need to adjust this
        }));

        // Combine and potentially sort results (e.g., relevance, name)
        const results = [...formattedProviders, ...formattedServices];
        // Simple sort by name for now
        results.sort((a, b) => a.name.localeCompare(b.name));

        // Log search action if needed
        if (userId && typeof logAuditAction === 'function') {
           // await logAuditAction(userId, 'api_search_success', { query, industryQuery, resultCount: results.length }, req.ip);
        }

        sendSuccessResponse(res, results, 'Search results fetched');

    } catch (err) {
        console.error(`Search failed for query "${query}", industry "${industryQuery}":`, err);
        // Log search error if needed
         if (userId && typeof logAuditAction === 'function') {
           // await logAuditAction(userId, 'api_search_failed', { query, industryQuery, error: err.message }, req.ip);
        }
        sendErrorResponse(res, 500, 'Search failed', err);
    }
});

module.exports = router;
