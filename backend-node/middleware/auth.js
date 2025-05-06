const { sendErrorResponse } = require('../utils/response'); // Adjust path as needed
    
    /**
     * Middleware factory to check if the authenticated user has one of the required roles.
     * @param {string|string[]} requiredRoles - A single role or an array of allowed roles.
     */
    const authMiddleware = (requiredRoles) => {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
      return (req, res, next) => {
        // This middleware assumes 'authenticate' middleware has run before it
        // and attached the user object to req.user
        if (!req.user || !req.user.role) {
          // This should technically not happen if 'authenticate' runs first, but good to check
          return sendErrorResponse(res, 401, 'Authentication required');
        }
    
        const userRole = req.user.role;
    
        if (!roles.includes(userRole)) {
          return sendErrorResponse(res, 403, `Access denied. Required role(s): ${roles.join(', ')}`);
        }
    
        // User has one of the required roles, proceed
        next();
      };
    };
    
    module.exports = authMiddleware;
