const { AuditLog } = require('../models'); // Adjust path as needed
    
    const logAuditAction = async (adminId, action, details = {}, ip = null, targetUserId = null, targetResourceId = null, targetResourceType = null) => {
      try {
        await AuditLog.create({
          adminId, // ID of the user performing the action (can be null for system actions)
          action, // e.g., 'login', 'create_user', 'update_order_status'
          details, // JSON object with relevant details
          ip, // IP address of the request originator
          targetUserId, // ID of the user being affected (if applicable)
          targetResourceId, // ID of the resource being affected (if applicable)
          targetResourceType, // Type of the resource being affected (if applicable)
          createdAt: new Date(),
          updatedAt: new Date(), // Set automatically by Sequelize
        });
      } catch (err) {
        console.error('Failed to log audit action:', { action, adminId, details, error: err.message });
        // Decide how to handle logging failure - maybe log to console/file as fallback
      }
    };
    
    module.exports = {
      logAuditAction,
    };
