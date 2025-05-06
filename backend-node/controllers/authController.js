const jwt = require('jsonwebtoken');
const { User, Notification, AuditLog } = require('../models');

// Helper to log audit actions
const logAuditAction = async (adminId, action, details) => {
  await AuditLog.create({
    adminId,
    action,
    details,
    createdAt: new Date(),
  });
};

exports.googleCallback = async (profile, done, state) => {
  try {
    let user = await User.findOne({ where: { email: profile.emails[0].value } });
    const role = state || 'client'; // Use state (from query) or default to client

    if (!user) {
      if (!['client', 'provider'].includes(role)) {
        return done(new Error('Invalid role specified'), null);
      }
      user = await User.create({
        firstName: profile.displayName.split(' ')[0],
        lastName: profile.displayName.split(' ').slice(1).join(' ') || 'User',
        email: profile.emails[0].value,
        password: '',
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await Notification.create({
        userId: user.id,
        message: `Witamy w YouNeed! Twoje konto zostało utworzone przez logowanie Google.`,
        type: 'account',
        createdAt: new Date(),
      });
    }

    if (user.restrictions?.banned) {
      return done(new Error('Account is banned'), null);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAuditAction(null, 'google_login', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return done(null, { token, role: user.role });
  } catch (err) {
    return done(err, null);
  }
};

exports.facebookCallback = async (profile, done, state) => {
  try {
    let user = await User.findOne({ where: { email: profile.emails[0].value } });
    const role = state || 'client'; // Use state (from query) or default to client

    if (!user) {
      if (!['client', 'provider'].includes(role)) {
        return done(new Error('Invalid role specified'), null);
      }
      user = await User.create({
        firstName: profile.displayName.split(' ')[0],
        lastName: profile.displayName.split(' ').slice(1).join(' ') || 'User',
        email: profile.emails[0].value,
        password: '',
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await Notification.create({
        userId: user.id,
        message: `Witamy w YouNeed! Twoje konto zostało utworzone przez logowanie Facebook.`,
        type: 'account',
        createdAt: new Date(),
      });
    }

    if (user.restrictions?.banned) {
      return done(new Error('Account is banned'), null);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAuditAction(null, 'facebook_login', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return done(null, { token, role: user.role });
  } catch (err) {
    return done(err, null);
  }
};

module.exports = exports;
