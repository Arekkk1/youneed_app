const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { User, Notification } = require('../models'); // Adjust path as needed
const { logAuditAction } = require('../utils/audit'); // Adjust path as needed

// Wrap the entire configuration logic in a function that accepts the passport object
module.exports = function(passport) {

  // --- Google Strategy ---
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Construct the full absolute callback URL for Google
      callbackURL: `${process.env.BACKEND_API_BASE_URL}${process.env.GOOGLE_CALLBACK_PATH}`,
      passReqToCallback: true // Pass request object to access query params like 'state' (which holds the role)
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          await logAuditAction(null, 'google_strategy_error_no_email', { profileId: profile.id }, req?.ip);
          return done(new Error('Google profile did not return an email address.'), null);
        }

        let user = await User.findOne({ where: { email } });
        // Role is passed via 'state' query parameter from the /auth/google route,
        // which is available in req.query.state in the strategy callback.
        const requestedRole = req.query.state || 'client';

        if (!['client', 'provider'].includes(requestedRole)) {
          await logAuditAction(null, 'google_strategy_error_invalid_role', { email, requestedRole }, req?.ip);
          return done(new Error(`Invalid role specified during Google signup: ${requestedRole}. Must be 'client' or 'provider'.`), null);
        }

        if (!user) {
          // Create new user if doesn't exist
          user = await User.create({
            googleId: profile.id,
            email: email,
            firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
            lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
            role: requestedRole, // Assign role from state
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            // Password can be null/empty for OAuth users
            // Set default terms acceptance based on your app's requirements
            acceptTerms: true, // Example: default to true, or require explicit acceptance later
            marketingConsent: false, // Example default
            partnerConsent: false,   // Example default
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await logAuditAction(null, 'google_signup_success', { userId: user.id, email: user.email, role: user.role }, req?.ip);
          await Notification.create({
            userId: user.id,
            message: `Witamy w YouNeed! Twoje konto (${user.role}) zostało utworzone przez logowanie Google.`,
            type: 'account',
            createdAt: new Date(),
          });
        } else {
          // User exists, link Google ID if not already linked
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          // Optionally update profile picture or names if changed and not set
          if (!user.profilePicture && profile.photos && profile.photos[0]) {
            user.profilePicture = profile.photos[0].value;
          }
          // DO NOT change user.role here if they already exist.
          // The /auth/google/callback route in auth.js handles potential role updates if desired.
          await user.save();
          await logAuditAction(user.id, 'google_login_success', { email: user.email, role: user.role }, req?.ip);
        }

        // Check for restrictions (e.g., banned user)
        if (user.restrictions?.banned) {
          await logAuditAction(user.id, 'google_login_failed_banned', { email: user.email }, req?.ip);
          return done(new Error('Account is banned'), null); // Pass error to passport
        }

        // Pass the user object to the callback handler in auth.js route
        return done(null, user);

      } catch (err) {
        console.error("Google Strategy Error:", err);
        await logAuditAction(null, 'google_strategy_error_exception', { error: err.message, email: profile?.emails?.[0]?.value }, req?.ip);
        return done(err, null);
      }
    }
  ));

  // --- Facebook Strategy ---
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      // Construct the full absolute callback URL for Facebook
      callbackURL: `${process.env.BACKEND_API_BASE_URL}${process.env.FACEBOOK_CALLBACK_PATH}`,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'], // Request necessary fields
      passReqToCallback: true // Pass request object to access query params like 'state'
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          await logAuditAction(null, 'facebook_strategy_error_no_email', { profileId: profile.id }, req?.ip);
          return done(new Error('Facebook profile did not return an email address. Please ensure your email is verified and accessible on Facebook.'), null);
        }

        let user = await User.findOne({ where: { email } });
        const requestedRole = req.query.state || 'client'; // Get role from state query param

        if (!['client', 'provider'].includes(requestedRole)) {
          await logAuditAction(null, 'facebook_strategy_error_invalid_role', { email, requestedRole }, req?.ip);
          return done(new Error(`Invalid role specified during Facebook signup: ${requestedRole}. Must be 'client' or 'provider'.`), null);
        }

        if (!user) {
          // Create new user
          user = await User.create({
            facebookId: profile.id,
            email: email,
            firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
            lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
            role: requestedRole,
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            acceptTerms: true, // Example default
            marketingConsent: false, // Example default
            partnerConsent: false,   // Example default
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await logAuditAction(null, 'facebook_signup_success', { userId: user.id, email: user.email, role: user.role }, req?.ip);
          await Notification.create({
            userId: user.id,
            message: `Witamy w YouNeed! Twoje konto (${user.role}) zostało utworzone przez logowanie Facebook.`,
            type: 'account',
            createdAt: new Date(),
          });
        } else {
          // User exists, link Facebook ID if needed
          if (!user.facebookId) {
            user.facebookId = profile.id;
          }
          if (!user.profilePicture && profile.photos && profile.photos[0]) {
            user.profilePicture = profile.photos[0].value;
          }
          // DO NOT change user.role here. Role update logic is in auth.js callback if needed.
          await user.save();
          await logAuditAction(user.id, 'facebook_login_success', { email: user.email, role: user.role }, req?.ip);
        }

        // Check for restrictions
        if (user.restrictions?.banned) {
          await logAuditAction(user.id, 'facebook_login_failed_banned', { email: user.email }, req?.ip);
          return done(new Error('Account is banned'), null);
        }

        return done(null, user);

      } catch (err) {
        console.error("Facebook Strategy Error:", err);
        await logAuditAction(null, 'facebook_strategy_error_exception', { error: err.message, email: profile?.emails?.[0]?.value }, req?.ip);
        return done(err, null);
      }
    }
  ));

  // --- Serialize and Deserialize User ---
  // Used by express-session to manage user state across requests (though we are using JWTs, passport might still use this internally for the flow)

  // Stores user ID in the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Retrieves user details from the database based on the ID stored in the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id, {
         // Exclude sensitive fields and OAuth IDs from the req.user object
         attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'googleId', 'facebookId'] }
      });
      done(null, user); // User object (or null if not found) is attached to req.user
    } catch (err) {
      done(err, null);
    }
  });

}; // End of the exported function
