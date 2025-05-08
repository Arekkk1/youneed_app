const jwt = require('jsonwebtoken');
    const { User } = require('../models'); // Adjust path as needed
    const { sendErrorResponse } = require('../utils/response'); // Adjust path as needed

    const authenticate = async (req, res, next) => {
      console.log('[Auth Middleware] Triggered for:', req.method, req.originalUrl);
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[Auth Middleware] Failed: No Bearer token found in Authorization header.');
        return sendErrorResponse(res, 401, 'Authentication token required');
      }

      const token = authHeader.split(' ')[1];
      console.log('[Auth Middleware] Token received:', token ? 'Yes' : 'No');

      try {
        console.log('[Auth Middleware] Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] Token decoded successfully. Payload:', decoded);

        if (!decoded.id) {
            console.error('[Auth Middleware] Failed: Decoded token missing user ID.');
            return sendErrorResponse(res, 401, 'Invalid token: Missing user ID');
        }

        console.log(`[Auth Middleware] Finding user by ID: ${decoded.id}`);
        // Fetch the user instance first to ensure it exists and to get all necessary fields
        const userInstance = await User.findByPk(decoded.id, {
          attributes: [
            'id',
            'email',
            'role',
            'firstName',
            'lastName',
            'companyName',
            'restrictions',
            'phoneNumber',
            'profilePicture',
            'industry',
            'subscriptionStatus',
            'phoneNumberVerified',
            'profileVisibility',
            'createdAt',
            'updatedAt'
          ]
        });

        if (!userInstance) {
          console.error(`[Auth Middleware] Failed: User not found for ID: ${decoded.id}`);
          return sendErrorResponse(res, 401, 'Invalid token: User not found');
        }
        
        // Convert Sequelize instance to a plain JSON object
        const userJson = userInstance.toJSON(); // This creates a plain object
        console.log('[Auth Middleware] User found (plain object from DB):', JSON.stringify(userJson, null, 2));

        if (userJson.restrictions && userJson.restrictions.banned) {
           console.warn(`[Auth Middleware] Denied: User account is banned. User ID: ${userJson.id}`);
           return sendErrorResponse(res, 403, 'User account is banned');
        }

        const userRoleValue = userJson.role;
        const userRoleType = typeof userRoleValue;
        console.log(`[Auth Middleware] Checking role. Value: '${userRoleValue}', Type: '${userRoleType}'`);

        if (userRoleType === 'undefined' || userRoleValue === null || userRoleValue === '') {
            console.error(`[Auth Middleware] Failed: User object role is missing, undefined, null, or empty. User ID: ${userJson.id}. Role value: '${userRoleValue}'. Full user data: ${JSON.stringify(userJson, null, 2)}`);
        } else {
            console.log(`[Auth Middleware] User role from plain object verified: ${userRoleValue}`);
        }

        // Attach the PLAIN JSON user object to the request
        req.user = userJson; 
        req.auth = decoded; // This contains { id, role, iat, exp } from the token
        
        console.log('[Auth Middleware] Attaching PLAIN USER OBJECT and auth to request. Proceeding...');
        // Add this log to be absolutely sure what's being attached:
        console.log('[Auth Middleware] req.user being attached:', JSON.stringify(req.user, null, 2));


        next();
      } catch (err) {
        console.error('[Auth Middleware] Error during token verification or user lookup:', err);
        if (err instanceof jwt.TokenExpiredError) {
          return sendErrorResponse(res, 401, 'Token expired');
        }
        if (err instanceof jwt.JsonWebTokenError) {
          return sendErrorResponse(res, 401, 'Invalid token');
        }
        return sendErrorResponse(res, 500, 'Authentication failed', err);
      }
    };

    module.exports = authenticate;

