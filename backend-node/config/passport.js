const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { User, Notification } = require('../models'); // Adjust path as needed
const { logAuditAction } = require('../utils/audit'); // Adjust path as needed

// Wrap the entire configuration logic in a function that accepts the passport object
module.exports = function(passport) {

  // --- Google Strategy ---
  // passport.use(new GoogleStrategy({
  //     clientID: process.env.GOOGLE_CLIENT_ID,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  //     callbackURL: process.env.GOOGLE_CALLBACK_URL, // Match the callback route
  //     passReqToCallback: true // Pass request object to access query params like 'role'
  //   },
  //   async (req, accessToken, refreshToken, profile, done) => {
  //     try {
  //       const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
  //       if (!email) {
  //         return done(new Error('Google profile did not return an email address.'), null);
  //       }

  //       let user = await User.findOne({ where: { email } });
  //       const requestedRole = req.query.state || 'client'; // Get role from state query param

  //       if (!user) {
  //         // Create new user if doesn't exist
  //         if (!['client', 'provider'].includes(requestedRole)) {
  //           return done(new Error('Invalid role specified during Google signup.'), null);
  //         }
  //         user = await User.create({
  //           googleId: profile.id,
  //           email: email,
  //           firstName: profile.name.givenName || profile.displayName.split(' ')[0],
  //           lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || 'User',
  //           role: requestedRole, // Assign role from state
  //           profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
  //           // Password can be null/empty for OAuth users
  //           // Set default terms acceptance? Or require later?
  //           // Assuming separate columns based on previous fixes:
  //           acceptTerms: true,
  //           marketingConsent: false,
  //           partnerConsent: false,
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //         });
  //         await logAuditAction(null, 'google_signup', { userId: user.id, email: user.email, role: user.role }, req.ip);
  //         await Notification.create({
  //           userId: user.id,
  //           message: `Witamy w YouNeed! Twoje konto (${user.role}) zostało utworzone przez logowanie Google.`,
  //           type: 'account',
  //           createdAt: new Date(),
  //         });
  //       } else {
  //         // User exists, check if Google ID needs linking or if role matches
  //         if (!user.googleId) {
  //           user.googleId = profile.id; // Link Google ID
  //         }
  //         // Optionally update profile picture or names if changed
  //         if (!user.profilePicture && profile.photos && profile.photos[0]) {
  //           user.profilePicture = profile.photos[0].value;
  //         }
  //         await user.save();
  //         await logAuditAction(null, 'google_login', { userId: user.id, email: user.email, role: user.role }, req.ip);
  //       }

  //       // Check for restrictions
  //       if (user.restrictions?.banned) {
  //         await logAuditAction(null, 'google_login_banned', { userId: user.id, email: user.email }, req.ip);
  //         return done(new Error('Account is banned'), null);
  //       }

  //       // Pass the user object to the callback handler in auth route
  //       return done(null, user);

  //     } catch (err) {
  //       console.error("Google Strategy Error:", err);
  //       await logAuditAction(null, 'google_strategy_error', { error: err.message }, req?.ip);
  //       return done(err, null);
  //     }
  //   }
  // ));

  // --- Facebook Strategy ---
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: '/api/auth/facebook/callback', // Match the callback route
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'], // Request necessary fields
      passReqToCallback: true // Pass request object to access query params like 'role'
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          // Facebook sometimes doesn't return email if user hasn't verified it or denies permission
          // Handle this case - maybe redirect to a page asking for email?
          return done(new Error('Facebook profile did not return an email address. Please ensure your email is verified and accessible on Facebook.'), null);
        }

        let user = await User.findOne({ where: { email } });
        const requestedRole = req.query.state || 'client'; // Get role from state query param

        if (!user) {
          // Create new user
          if (!['client', 'provider'].includes(requestedRole)) {
            return done(new Error('Invalid role specified during Facebook signup.'), null);
          }
          user = await User.create({
            facebookId: profile.id,
            email: email,
            firstName: profile.name.givenName || profile.displayName.split(' ')[0],
            lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || 'User',
            role: requestedRole,
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            // Assuming separate columns:
            acceptTerms: true,
            marketingConsent: false,
            partnerConsent: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await logAuditAction(null, 'facebook_signup', { userId: user.id, email: user.email, role: user.role }, req.ip);
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
          await user.save();
          await logAuditAction(null, 'facebook_login', { userId: user.id, email: user.email, role: user.role }, req.ip);
        }

        // Check for restrictions
        if (user.restrictions?.banned) {
          await logAuditAction(null, 'facebook_login_banned', { userId: user.id, email: user.email }, req.ip);
          return done(new Error('Account is banned'), null);
        }

        return done(null, user);

      } catch (err) {
        console.error("Facebook Strategy Error:", err);
        await logAuditAction(null, 'facebook_strategy_error', { error: err.message }, req?.ip);
        return done(err, null);
      }
    }
  ));

  // --- Serialize and Deserialize User ---
  // Used by express-session to manage user state across requests

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
