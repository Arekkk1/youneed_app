const jwt = require('jsonwebtoken');
    const { User } = require('../models'); // Adjust path as needed
    const { sendErrorResponse } = require('../utils/response'); // Adjust path as needed

    const authenticate = async (req, res, next) => {
      console.log('[Auth Middleware] Triggered for:', req.method, req.originalUrl); // Log entry
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[Auth Middleware] Failed: No Bearer token found in Authorization header.');
        return sendErrorResponse(res, 401, 'Authentication token required');
      }

      const token = authHeader.split(' ')[1];
      console.log('[Auth Middleware] Token received:', token ? 'Yes' : 'No'); // Log token presence

      try {
        console.log('[Auth Middleware] Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] Token decoded successfully. Payload:', decoded); // Log decoded payload

        if (!decoded.id) {
            console.error('[Auth Middleware] Failed: Decoded token missing user ID.');
            return sendErrorResponse(res, 401, 'Invalid token: Missing user ID');
        }

        // Find user by ID from token payload
        console.log(`[Auth Middleware] Finding user by ID: ${decoded.id}`);
        const user = await User.findByPk(decoded.id, {
          // Exclude password and other sensitive fields if not needed downstream
          attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'googleId', 'facebookId'] }
        });

        if (!user) {
          console.error(`[Auth Middleware] Failed: User not found for ID: ${decoded.id}`);
          return sendErrorResponse(res, 401, 'Invalid token: User not found');
        }
        console.log('[Auth Middleware] User found:', user.toJSON ? user.toJSON() : user); // Log found user data

        // Check for restrictions (e.g., banned)
        if (user.restrictions?.banned) {
           console.warn(`[Auth Middleware] Denied: User account is banned. User ID: ${user.id}`);
           return sendErrorResponse(res, 403, 'User account is banned');
        }

        // **CRITICAL CHECK:** Verify user object has role
        if (!user.role) {
            console.error(`[Auth Middleware] Failed: User object found but missing 'role' property. User ID: ${user.id}`);
            // This scenario shouldn't happen if DB schema is correct, but good to check.
            // We let it proceed for now, the route handler will catch it, but log the error.
        } else {
            console.log(`[Auth Middleware] User role verified: ${user.role}`);
        }

        // Attach user object (without sensitive data) and token payload to request
        req.user = user; // The Sequelize user instance
        req.auth = decoded; // The raw JWT payload (id, role, etc.)
        console.log('[Auth Middleware] Attaching user and auth to request. Proceeding...');

        next(); // Proceed to the next middleware or route handler
      } catch (err) {
        console.error('[Auth Middleware] Error during token verification or user lookup:', err); // Log the specific error
        if (err instanceof jwt.TokenExpiredError) {
          return sendErrorResponse(res, 401, 'Token expired');
        }
        if (err instanceof jwt.JsonWebTokenError) {
          return sendErrorResponse(res, 401, 'Invalid token');
        }
        // Log unexpected errors
        return sendErrorResponse(res, 500, 'Authentication failed', err);
      }
    };

    module.exports = authenticate;
