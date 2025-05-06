const express = require('express');
        const { body, validationResult } = require('express-validator');
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const passport = require('passport');
        const crypto = require('crypto');
        const { Op } = require('sequelize');
        const { User, Notification, SmsCode } = require('../models'); // Use updated User model
        const router = express.Router();
        // --- Corrected Import ---
        const emailLabsService = require('../services/emailLabsService');
        console.log('[AuthRoute] Imported emailLabsService:', typeof emailLabsService, emailLabsService);
        const { sendEmail } = emailLabsService; // Destructure AFTER logging the import
        console.log('[AuthRoute] sendEmail function type:', typeof sendEmail);
        // --- End Corrected Import ---
        const { getEmailTemplate } = require('../emailTemplates'); // Import template helper
        const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
        const { logAuditAction } = require('../utils/audit');
        const authenticate = require('../middleware/authenticate'); // Poprawny import

// Endpoint to get current user data
router.get('/me', authenticate, async (req, res) => {
  console.log('[AuthRoutes DEBUG] GET /auth/me: Processing request for user ID:', req.user.id);
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id',
        'email',
        'role',
        'firstName',
        'lastName',
        'companyName',
        'phoneNumber',
        'profilePicture',
        'industry',
        'addressStreet',
        'addressCity',
        'addressPostalCode',
        'addressCountry',
        'website',
        'profileVisibility',
      ],
    });
    if (!user) {
      console.log('[AuthRoutes DEBUG] GET /auth/me: User not found for ID:', req.user.id);
      return sendErrorResponse(res, 404, 'User not found');
    }
    console.log('[AuthRoutes DEBUG] GET /auth/me: User found:', user.id);
    sendSuccessResponse(res, user, 'User data retrieved successfully');
  } catch (error) {
    console.error('[AuthRoutes DEBUG] GET /auth/me: Error:', error.message);
    sendErrorResponse(res, 500, 'Failed to retrieve user data', error);
  }
});

        // --- Registration ---
        router.post(
          '/register',
          [
            // Basic user info
            body('email').isEmail().withMessage('Nieprawidłowy format email').normalizeEmail(),
            body('password').isLength({ min: 8 }).withMessage('Hasło musi mieć co najmniej 8 znaków')
                // Add password complexity validation matching frontend
                .matches(/[A-Z]/).withMessage('Hasło musi zawierać co najmniej jedną wielką literę')
                .matches(/[a-z]/).withMessage('Hasło musi zawierać co najmniej jedną małą literę')
                .matches(/[0-9]/).withMessage('Hasło musi zawierać co najmniej jedną cyfrę')
                .matches(/[\W_]/).withMessage('Hasło musi zawierać co najmniej jeden znak specjalny'),
            body('role').isIn(['client', 'provider']).withMessage('Nieprawidłowa rola. Musi być "client" lub "provider"'),
            body('firstName').trim().notEmpty().withMessage('Imię jest wymagane'),
            body('lastName').trim().notEmpty().withMessage('Nazwisko jest wymagane'),
            body('phone').optional({ checkFalsy: true }).isMobilePhone('pl-PL').withMessage('Nieprawidłowy numer telefonu (oczekiwany format polski 9 cyfr)'), // Validate phone if provided

            // Provider specific (conditionally required)
            body('industry').if(body('role').equals('provider')).trim().notEmpty().withMessage('Branża jest wymagana dla usługodawcy'),
            body('companyName').if(body('role').equals('provider')).optional({ checkFalsy: true }).trim(),

            // Address validation (optional for client registration)
            body('address').optional({ checkFalsy: true }).isObject().withMessage('Adres musi być obiektem'),
            body('address.street').optional({ checkFalsy: true }).isString().trim().withMessage('Ulica musi być tekstem'),
            body('address.city').optional({ checkFalsy: true }).isString().trim().withMessage('Miasto musi być tekstem'),
            body('address.zipCode').optional({ checkFalsy: true }).isPostalCode('PL').withMessage('Nieprawidłowy format kodu pocztowego (PL)'),
            body('address.country').optional({ checkFalsy: true }).isString().trim().withMessage('Kraj musi być tekstem'),


            // Validate the incoming 'terms' object and its nested properties
            body('terms').isObject().withMessage('Obiekt terms jest wymagany'),
            body('terms.acceptTerms')
              .exists({ checkNull: true, checkFalsy: false }).withMessage('Pole terms.acceptTerms jest wymagane') // Ensure it exists
              .isBoolean().withMessage('terms.acceptTerms musi być wartością logiczną')
              .toBoolean() // Convert "true", "false", 1, 0 etc. to boolean
              .custom(value => {
                if (value !== true) {
                  throw new Error('Akceptacja regulaminu jest wymagana');
                }
                return true; // Indicate validation passed
              }),
            body('terms.marketingConsent')
              .exists({ checkNull: true, checkFalsy: false }).withMessage('Pole terms.marketingConsent jest wymagane')
              .isBoolean().withMessage('terms.marketingConsent musi być wartością logiczną')
              .toBoolean(),
            body('terms.partnerConsent')
              .exists({ checkNull: true, checkFalsy: false }).withMessage('Pole terms.partnerConsent jest wymagane')
              .isBoolean().withMessage('terms.partnerConsent musi być wartością logiczną')
              .toBoolean(),

            // Other optional fields
            body('tutorial').optional().isBoolean().toBoolean(),
          ],
          async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              console.error("Validation Errors:", JSON.stringify(errors.array(), null, 2));
              // Find the specific error for terms.acceptTerms if it exists
              const acceptTermsError = errors.array().find(e => e.path === 'terms.acceptTerms');
              const errorMessage = acceptTermsError ? acceptTermsError.msg : 'Błąd walidacji';
              // Return all validation errors
              return sendErrorResponse(res, 400, errorMessage, errors.array());
            }

            const {
              email,
              password,
              role,
              firstName,
              lastName,
              phone, // Get phone number
              industry,
              companyName,
              address, // Get address object { street, city, zipCode, country }
              terms, // Contains acceptTerms, marketingConsent, partnerConsent from frontend
              companyDetails, // Assuming frontend sends JSON string or object (mainly for provider)
              tutorial,
            } = req.body;

            console.log("Received registration data:", req.body); // Log received data
            console.log("Received terms object from frontend:", terms);
            console.log("Received address object from frontend:", address);

            try {
              let user = await User.findOne({ where: { email } });
              if (user) {
                await logAuditAction(null, 'register_failed_email_exists', { email, role }, req.ip);
                return sendErrorResponse(res, 400, 'Użytkownik o podanym emailu już istnieje');
              }

              // Phone number verification happens later (Step 3 for provider)
              const phoneNumberVerified = false;
              // Store phone number if provided
              const initialPhoneNumber = phone || null;

              const hashedPassword = await bcrypt.hash(password, 10);

              // Parse JSON fields if they are sent as strings (less likely now with frontend object)
              const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
              const parsedCompanyDetails = typeof companyDetails === 'string' ? JSON.parse(companyDetails) : companyDetails;

              // --- Corrected User Creation based on DB Schema ---
              user = await User.create({
                email,
                password: hashedPassword,
                role, // Role from request ('client' or 'provider')
                firstName,
                lastName,
                industry: role === 'provider' ? industry : null,
                companyName: role === 'provider' ? companyName : null,
                phoneNumber: initialPhoneNumber, // Save phone number
                phoneNumberVerified, // Set to false initially
                address: parsedAddress, // Save address object to JSON column
                companyDetails: role === 'provider' ? parsedCompanyDetails : null, // Save only for provider
                tutorial: tutorial || false,

                // Map values from the 'terms' object in req.body to the correct DB columns
                acceptTerms: terms.acceptTerms,
                marketingConsent: terms.marketingConsent,
                partnerConsent: terms.partnerConsent,

                // Set the separate 'terms' JSON column to null (or {} if preferred) as it's not used for consents
                terms: null,

                createdAt: new Date(),
                updatedAt: new Date(),
              });
              // --- End of Corrected User Creation ---

              // Generate JWT token
              const tokenPayload = { id: user.id, role: user.role };
              const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
              });

              await logAuditAction(null, 'user_registered', { userId: user.id, email, role }, req.ip);

              // Send welcome notification (in-app)
              await Notification.create({
                userId: user.id,
                message: 'Witamy w YouNeed! Twoje konto zostało utworzone.',
                type: 'account',
                createdAt: new Date(),
              });

              // --- Send Welcome Email ---
              try {
                const templateData = { firstName: user.firstName, role: user.role };
                const emailContent = getEmailTemplate('welcome', templateData);
                if (emailContent) {
                  // --- Check if sendEmail is a function before calling ---
                  if (typeof sendEmail !== 'function') {
                      console.error('[AuthRoute] CRITICAL: sendEmail is not a function for welcome email!', typeof sendEmail);
                      // Optionally log an audit event here
                      await logAuditAction(user.id, 'welcome_email_failed_internal_type_error', { email: user.email, type: typeof sendEmail }, req.ip);
                      // Decide if you want to throw an error or just log and continue
                      // throw new Error('Internal server error: Email service unavailable.');
                  } else {
                      console.log(`[AuthRoute] Attempting to call sendEmail for welcome email to ${user.email}`);
                      await sendEmail({ // This is line ~165
                        toEmail: user.email,
                        subject: emailContent.subject,
                        htmlContent: emailContent.htmlContent,
                        textContent: emailContent.textContent,
                      });
                      console.log(`[AuthRoute] sendEmail call completed for welcome email to ${user.email}`);
                      await logAuditAction(user.id, 'welcome_email_sent', { email: user.email }, req.ip);
                  }
                } else {
                    console.error('[AuthRoute] Welcome email template not found.');
                    await logAuditAction(user.id, 'welcome_email_failed_template_missing', { email: user.email }, req.ip);
                }
              } catch (mailError) {
                console.error("Welcome Email Error (EmailLabs):", mailError);
                await logAuditAction(user.id, 'welcome_email_failed', { email: user.email, error: mailError.message }, req.ip);
                // Continue even if welcome email fails
              }
              // --- End Send Welcome Email ---

              // Send user object without sensitive data
              const userResponse = {
                  id: user.id, // CRITICAL: Ensure ID is included
                  email: user.email,
                  role: user.role,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  acceptTerms: user.acceptTerms,
                  marketingConsent: user.marketingConsent,
                  partnerConsent: user.partnerConsent,
                  // Include address if needed in response
                  // address: user.address
              };

              console.log("Sending success response:", { user: userResponse, token }); // Log success response
              // Send nested response structure as expected by ProviderRegistration.jsx (and potentially other places)
              sendSuccessResponse(res, { user: userResponse, token }, 'Rejestracja zakończona sukcesem', 201);
            } catch (err) {
              console.error("Registration Server Error:", err);
              await logAuditAction(null, 'register_failed_server_error', { email, error: err.message }, req.ip);
              // Send detailed error including validation errors if available
              sendErrorResponse(res, 500, 'Błąd podczas rejestracji', process.env.NODE_ENV !== 'production' ? err : { message: err.message });
            }
          }
        );

        // --- Login ---
        router.post(
          '/login',
          [
            body('email').isEmail().withMessage('Nieprawidłowy format email').normalizeEmail(),
            body('password').notEmpty().withMessage('Hasło jest wymagane'),
          ],
          async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return sendErrorResponse(res, 400, 'Błąd walidacji', errors.array());
            }

            const { email, password } = req.body;

            try {
              const user = await User.findOne({ where: { email } });

              if (!user) {
                await logAuditAction(null, 'login_failed_user_not_found', { email }, req.ip);
                return sendErrorResponse(res, 401, 'Nieprawidłowy email lub hasło');
              }

              if (user.restrictions?.banned) {
                 await logAuditAction(user.id, 'login_failed_banned', { email }, req.ip);
                 return sendErrorResponse(res, 403, 'Konto użytkownika jest zablokowane');
              }

              if (!user.password) {
                await logAuditAction(user.id, 'login_failed_oauth_user', { email }, req.ip);
                return sendErrorResponse(res, 401, 'Logowanie hasłem nie jest dostępne dla tego konta. Spróbuj zalogować się przez Google lub Facebook.');
              }

              const isMatch = await bcrypt.compare(password, user.password);
              if (!isMatch) {
                await logAuditAction(user.id, 'login_failed_invalid_password', { email }, req.ip);
                return sendErrorResponse(res, 401, 'Nieprawidłowy email lub hasło');
              }

              const tokenPayload = { id: user.id, role: user.role };
              const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
              });

              // Update last login time
              user.lastLogin = new Date();
              await user.save();

              await logAuditAction(user.id, 'login_success', { email, role: user.role }, req.ip);

              const userInfo = {
                 id: user.id,
                 firstName: user.firstName,
                 lastName: user.lastName,
                 email: user.email,
                 role: user.role,
                 profilePicture: user.profilePicture,
                 acceptTerms: user.acceptTerms,
                 marketingConsent: user.marketingConsent,
                 partnerConsent: user.partnerConsent,
                 // Include address if needed
                 // address: user.address
              };

              // Send nested response structure
              sendSuccessResponse(res, { user: userInfo, token }, 'Logowanie zakończone sukcesem');
            } catch (err) {
              await logAuditAction(null, 'login_failed_server_error', { email, error: err.message }, req.ip);
              sendErrorResponse(res, 500, 'Błąd podczas logowania', err);
            }
          }
        );

        // --- Google OAuth ---
        router.get('/google', (req, res, next) => {
          const role = req.query.role || 'client';
          passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: role // Pass role via state
          })(req, res, next);
        });

        router.get(
          '/google/callback',
          (req, res, next) => {
              // Extract state (role) before passport processing
              const role = req.query.state;
              passport.authenticate('google', {
                  session: false,
                  failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`
              }, async (err, user, info) => { // Make callback async
                  // Custom callback to handle user and role
                  if (err) { return next(err); }
                  if (!user) {
                      // Await logAuditAction here
                      await logAuditAction(null, 'google_callback_failed_no_user', {}, req.ip);
                      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
                  }
                  req.user = user; // Attach user to request
                  req.authInfo = { role: role || 'client' }; // Attach role info
                  next();
              })(req, res, next);
          },
          async (req, res) => {
              // Now req.user and req.authInfo are available
              try {
                  const user = req.user; // User object from passport strategy
                  // Role should ideally be determined/updated within the passport strategy based on state
                  // If not, use req.authInfo.role as fallback
                  const userRole = user.role || req.authInfo.role;

                  const tokenPayload = { id: user.id, role: userRole };
                  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                  });

                  // Ensure user role is updated if it was newly assigned in strategy
                  if (user.role !== userRole) {
                      user.role = userRole;
                      await user.save(); // Save the updated role if necessary
                  }

                  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&userId=${user.id}&role=${userRole}&provider=google`);
              } catch (err) {
                  await logAuditAction(req.user?.id, 'google_callback_failed_server_error', { email: req.user?.email, error: err.message }, req.ip);
                  res.redirect(`${process.env.FRONTEND_URL}/login?error=google_processing_failed`);
              }
          }
        );


        // --- Facebook OAuth ---
        router.get('/facebook', (req, res, next) => {
          const role = req.query.role || 'client';
          passport.authenticate('facebook', {
            scope: ['email', 'public_profile'],
            state: role // Pass role via state
          })(req, res, next);
        });

        router.get(
          '/facebook/callback',
           (req, res, next) => {
              // Extract state (role) before passport processing
              const role = req.query.state;
              passport.authenticate('facebook', {
                  session: false,
                  failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_failed`
              }, async (err, user, info) => { // Make callback async
                  // Custom callback to handle user and role
                  if (err) { return next(err); }
                  if (!user) {
                      // Await logAuditAction here
                      await logAuditAction(null, 'facebook_callback_failed_no_user', {}, req.ip);
                      return res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`);
                  }
                  req.user = user; // Attach user to request
                  req.authInfo = { role: role || 'client' }; // Attach role info
                  next();
              })(req, res, next);
          },
          async (req, res) => {
             // Now req.user and req.authInfo are available
              try {
                  const user = req.user; // User object from passport strategy
                  // Role should ideally be determined/updated within the passport strategy based on state
                  const userRole = user.role || req.authInfo.role;

                  const tokenPayload = { id: user.id, role: userRole };
                  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                  });

                   // Ensure user role is updated if it was newly assigned in strategy
                  if (user.role !== userRole) {
                      user.role = userRole;
                      await user.save(); // Save the updated role if necessary
                  }

                  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&userId=${user.id}&role=${userRole}&provider=facebook`);
              } catch (err) {
                  await logAuditAction(req.user?.id, 'facebook_callback_failed_server_error', { email: req.user?.email, error: err.message }, req.ip);
                  res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_processing_failed`);
              }
          }
        );

        // --- Forgot Password ---
        router.post(
          '/forgot-password',
          [
            body('email').isEmail().withMessage('Nieprawidłowy format email').normalizeEmail(),
          ],
          async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return sendErrorResponse(res, 400, 'Błąd walidacji', errors.array());
            }
            const { email } = req.body;
            try {
              const user = await User.findOne({ where: { email } });
              if (!user) {
                await logAuditAction(null, 'forgot_password_user_not_found', { email }, req.ip);
                // Send success even if user not found to prevent email enumeration
                return sendSuccessResponse(res, null, 'Jeśli konto istnieje, link do resetowania hasła został wysłany.');
              }
              if (!user.password) {
                 await logAuditAction(user.id, 'forgot_password_oauth_user', { email }, req.ip);
                 // Send success even for OAuth users
                 return sendSuccessResponse(res, null, 'Resetowanie hasła nie jest dostępne dla kont połączonych przez Google/Facebook.');
              }
              const resetToken = crypto.randomBytes(32).toString('hex');
              const resetTokenHash = await bcrypt.hash(resetToken, 10);
              user.resetPasswordToken = resetTokenHash;
              user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiry
              await user.save();
              const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

              // --- Use Email Template ---
              const emailContent = getEmailTemplate('forgotPassword', { email, resetUrl });
              if (!emailContent) {
                  throw new Error('Forgot password email template not found.');
              }
              // --- End Use Email Template ---

              try {
                // Send email using EmailLabs service
                // --- Check if sendEmail is a function before calling ---
                 if (typeof sendEmail !== 'function') {
                     console.error('[AuthRoute] CRITICAL: sendEmail is not a function for forgot password!', typeof sendEmail);
                     await logAuditAction(user.id, 'forgot_password_email_failed_internal_type_error', { email: user.email, type: typeof sendEmail }, req.ip);
                     // Still send success to avoid revealing existing emails
                     sendSuccessResponse(res, null, 'Jeśli konto istnieje, link do resetowania hasła został wysłany.');
                 } else {
                     console.log(`[AuthRoute] Attempting to call sendEmail for forgot password to ${email}`);
                     await sendEmail({
                       toEmail: email,
                       subject: emailContent.subject,
                       htmlContent: emailContent.htmlContent,
                       textContent: emailContent.textContent
                     });
                     console.log(`[AuthRoute] sendEmail call completed for forgot password to ${email}`);
                     await logAuditAction(user.id, 'forgot_password_email_sent', { email }, req.ip);
                     sendSuccessResponse(res, null, 'Jeśli konto istnieje, link do resetowania hasła został wysłany.');
                 }
              } catch (mailError) {
                 console.error("Forgot Password Mail Error (EmailLabs):", mailError);
                 await logAuditAction(user.id, 'forgot_password_email_failed', { email, error: mailError.message }, req.ip);
                 // Still send success to avoid revealing existing emails
                 sendSuccessResponse(res, null, 'Jeśli konto istnieje, link do resetowania hasła został wysłany.');
              }
            } catch (err) {
              await logAuditAction(null, 'forgot_password_server_error', { email, error: err.message }, req.ip);
              // Avoid sending detailed error in production for security
              sendErrorResponse(res, 500, 'Błąd podczas przetwarzania żądania resetowania hasła', process.env.NODE_ENV !== 'production' ? err : undefined);
            }
          }
        );

        // --- Reset Password ---
        router.post(
          '/reset-password',
          [
            body('email').isEmail().withMessage('Nieprawidłowy format email').normalizeEmail(),
            body('token').notEmpty().withMessage('Token resetujący jest wymagany'),
            body('newPassword').isLength({ min: 8 }).withMessage('Nowe hasło musi mieć co najmniej 8 znaków')
                // Add complexity validation matching registration
                .matches(/[A-Z]/).withMessage('Hasło musi zawierać co najmniej jedną wielką literę')
                .matches(/[a-z]/).withMessage('Hasło musi zawierać co najmniej jedną małą literę')
                .matches(/[0-9]/).withMessage('Hasło musi zawierać co najmniej jedną cyfrę')
                .matches(/[\W_]/).withMessage('Hasło musi zawierać co najmniej jeden znak specjalny'),
          ],
          async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return sendErrorResponse(res, 400, 'Błąd walidacji', errors.array());
            }
            const { email, token, newPassword } = req.body;
            try {
              const user = await User.findOne({
                where: {
                  email,
                  resetPasswordToken: { [Op.ne]: null },
                  resetPasswordExpires: { [Op.gt]: new Date() },
                },
              });
              if (!user) {
                await logAuditAction(null, 'reset_password_failed_invalid_or_expired', { email }, req.ip);
                return sendErrorResponse(res, 400, 'Link do resetowania hasła jest nieprawidłowy lub wygasł.');
              }
              // Ensure token comparison happens only if user is found
              const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
              if (!isTokenValid) {
                await logAuditAction(user.id, 'reset_password_failed_invalid_token', { email }, req.ip);
                return sendErrorResponse(res, 400, 'Link do resetowania hasła jest nieprawidłowy lub wygasł.');
              }
              const hashedPassword = await bcrypt.hash(newPassword, 10);
              user.password = hashedPassword;
              user.resetPasswordToken = null;
              user.resetPasswordExpires = null;
              await user.save();
              await logAuditAction(user.id, 'reset_password_success', { email }, req.ip);

              // --- Use Email Template ---
              const emailContent = getEmailTemplate('passwordResetConfirmation', { email });
              if (!emailContent) {
                  console.error('Password reset confirmation email template not found.');
                  // Continue without sending email if template is missing, but log it
              }
              // --- End Use Email Template ---

              try {
                 // Send confirmation email using EmailLabs service (only if template exists)
                 if (emailContent) {
                     // --- Check if sendEmail is a function before calling ---
                     if (typeof sendEmail !== 'function') {
                         console.error('[AuthRoute] CRITICAL: sendEmail is not a function for reset password confirmation!', typeof sendEmail);
                         await logAuditAction(user.id, 'reset_password_confirm_email_failed_internal_type_error', { email: user.email, type: typeof sendEmail }, req.ip);
                     } else {
                         console.log(`[AuthRoute] Attempting to call sendEmail for reset password confirmation to ${email}`);
                         await sendEmail({
                           toEmail: email,
                           subject: emailContent.subject,
                           htmlContent: emailContent.htmlContent,
                           textContent: emailContent.textContent
                         });
                         console.log(`[AuthRoute] sendEmail call completed for reset password confirmation to ${email}`);
                         await logAuditAction(user.id, 'reset_password_confirm_email_sent', { email }, req.ip);
                     }
                 }
              } catch (mailError) {
                 console.error("Reset Password Confirmation Mail Error (EmailLabs):", mailError);
                 await logAuditAction(user.id, 'reset_password_confirm_email_failed', { email, error: mailError.message }, req.ip);
                 // Continue even if confirmation email fails
              }

              await Notification.create({
                userId: user.id,
                message: 'Twoje hasło zostało pomyślnie zresetowane.',
                type: 'account',
                createdAt: new Date(),
              });
              sendSuccessResponse(res, null, 'Hasło zostało pomyślnie zresetowane.');
            } catch (err) {
              await logAuditAction(null, 'reset_password_server_error', { email, error: err.message }, req.ip);
              sendErrorResponse(res, 500, 'Błąd podczas resetowania hasła', process.env.NODE_ENV !== 'production' ? err : undefined);
            }
          }
        );

        // --- Logout ---
        router.post('/logout', async (req, res) => {
          try {
            // For JWT, logout is typically handled client-side by removing the token.
            // Server-side logout might involve token blacklisting if implemented.
            const userId = req.user?.id; // Get user ID if token was validated by middleware
            if (userId) {
              await logAuditAction(userId, 'logout_success', {}, req.ip);
            } else {
              // Log attempt even if no valid token was present
              await logAuditAction(null, 'logout_attempt_no_user', {}, req.ip);
            }
            sendSuccessResponse(res, null, 'Wylogowano pomyślnie');
          } catch (err) {
            await logAuditAction(req.user?.id, 'logout_failed_server_error', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Błąd podczas wylogowywania', err);
          }
        });

        module.exports = router;
