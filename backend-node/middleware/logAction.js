const { AuditLog } = require('../models');

const logAction = (action, details) => async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      await AuditLog.create({
        adminId: null,
        action: 'log_action_failed',
        details: { message: 'No user provided', action, ip: req.ip, path: req.path, method: req.method },
        createdAt: new Date(),
      });
      return next();
    }

    const detailsData = typeof details === 'function' ? details(req) : details;
    if (!detailsData || typeof detailsData !== 'object') {
      await AuditLog.create({
        adminId: user.role === 'admin' ? user.id : null,
        action: 'log_action_failed',
        details: {
          message: 'Invalid details provided',
          action,
          userId: user.id,
          role: user.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
        },
        createdAt: new Date(),
      });
      return next();
    }

    await AuditLog.create({
      adminId: user.role === 'admin' ? user.id : null,
      action,
      details: {
        userId: user.id,
        role: user.role,
        ip: req.ip,
        path: req.path,
        method: req.method,
        ...detailsData,
      },
      createdAt: new Date(),
    });
    next();
  } catch (err) {
    await AuditLog.create({
      adminId: null,
      action: 'log_action_error',
      details: {
        message: 'Error logging action',
        action,
        error: err.message,
        ip: req.ip,
        path: req.path,
        method: req.method,
      },
      createdAt: new Date(),
    });
    console.error('Błąd zapisywania logu:', err);
    next();
  }
};

module.exports = logAction;
