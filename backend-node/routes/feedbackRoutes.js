// Assuming feedbackRoutes.js exists, add/modify the GET route
const express = require('express');
const router = express.Router();
const { Feedback, User, Order } = require('../models'); // Adjust models as needed
const authenticate = require('../middleware/authenticate');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { logAuditAction } = require('../utils/audit');

// Helper to get user display name
const getUserName = (user) => {
  if (!user) return 'N/A';
  if (user.companyName) return user.companyName;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
};

// GET /api/feedback?providerId=...
router.get('/', authenticate, async (req, res) => {
    const { providerId } = req.query;
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    if (!providerId) {
        return sendErrorResponse(res, 400, 'Missing required query parameter: providerId');
    }

    const targetProviderId = parseInt(providerId, 10);
    if (isNaN(targetProviderId)) {
        return sendErrorResponse(res, 400, 'Invalid providerId parameter.');
    }

    // Authorization: Allow clients and admins to view feedback for a provider
    // Providers might view their own feedback via a different route or this one if needed
    // if (requestingUserRole !== 'client' && requestingUserRole !== 'admin') {
    //     // Or adjust logic if providers should use this too
    //     return sendErrorResponse(res, 403, 'Access denied.');
    // }

    try {
        const feedbacks = await Feedback.findAll({
            where: { providerId: targetProviderId },
            include: [
                // Include Client info (User model aliased as Client)
                {
                    model: User,
                    as: 'Client', // Ensure this alias matches your Feedback model definition
                    attributes: ['id', 'firstName', 'lastName', 'companyName', 'email', 'profilePicture']
                },
                // Optionally include Order info if Feedback is linked to Order
                {
                    model: Order,
                    attributes: ['id', 'title'] // Select specific order attributes
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const formattedFeedbacks = feedbacks.map(fb => ({
            id: fb.id,
            rating: fb.rating,
            comment: fb.comment,
            createdAt: fb.createdAt,
            clientName: fb.Client ? getUserName(fb.Client) : 'Anonimowy', // Use helper
            clientProfilePicture: fb.Client?.profilePicture,
            orderTitle: fb.Order?.title
        }));

        if (typeof logAuditAction === 'function') {
            await logAuditAction(requestingUserId, 'fetch_feedback_success', { role: requestingUserRole, targetProviderId, count: formattedFeedbacks.length }, req.ip);
        }
        sendSuccessResponse(res, formattedFeedbacks, 'Feedback fetched successfully');

    } catch (err) {
        console.error(`Error fetching feedback for provider ${targetProviderId} by user ${requestingUserId}:`, err);
        if (typeof logAuditAction === 'function') {
            await logAuditAction(requestingUserId, 'fetch_feedback_failed', { role: requestingUserRole, targetProviderId, error: err.message }, req.ip);
        }
        sendErrorResponse(res, 500, 'Failed to fetch feedback', err);
    }
});

// Add other feedback routes (POST, PUT, DELETE) if needed

module.exports = router;
