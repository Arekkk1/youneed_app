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
                  } else {
                      console.log(`[AuthRoute] Attempting to call sendEmail for welcome email to ${user.email}`);
                      await sendEmail({
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
              }
              // --- End Send Welcome Email ---

              const userResponse = {
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  acceptTerms: user.acceptTerms,
                  marketingConsent: user.marketingConsent,
                  partnerConsent: user.partnerConsent,
              };

              console.log("Sending success response:", { user: userResponse, token });
              sendSuccessResponse(res, { user: userResponse, token }, 'Rejestracja zakończona sukcesem', 201);
            } catch (err) {
              console.error("Registration Server Error:", err);
              await logAuditAction(null, 'register_failed_server_error', { email, error: err.message }, req.ip);
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
              const user = await User.findOne({
                where: { email },
                attributes: [
                  'id',
                  'email',
                  'password',
                  'role',
                  'firstName',
                  'lastName',
                  'restrictions',
                  'profilePicture',
                  'acceptTerms',
                  'marketingConsent',
                  'partnerConsent'
                ],
                raw: true, // Fetch as plain object
              });

              if (!user) {
                await logAuditAction(null, 'login_failed_user_not_found', { email }, req.ip);
                return sendErrorResponse(res, 401, 'Nieprawidłowy email lub hasło');
              }

              // --- DETAILED LOGGING (user is now a plain object if raw:true worked) ---
              console.log('[AuthRoute DEBUG] /login - Raw user object (should be plain if raw:true):', JSON.stringify(user, null, 2));
              // user.dataValues will not exist if raw:true, so we log 'user' directly
              // console.log('[AuthRoute DEBUG] /login - user.dataValues:', JSON.stringify(user.dataValues, null, 2)); // This would error if raw:true
              console.log(`[AuthRoute DEBUG] /login - user.id directly: ${user.id} (type: ${typeof user.id})`);
              console.log(`[AuthRoute DEBUG] /login - user.firstName directly: ${user.firstName} (type: ${typeof user.firstName})`);
              console.log(`[AuthRoute DEBUG] /login - user.role directly: ${user.role} (type: ${typeof user.role})`);
              console.log(`[AuthRoute DEBUG] /login - user.profilePicture directly: ${user.profilePicture} (type: ${typeof user.profilePicture})`);
              console.log(`[AuthRoute DEBUG] /login - user.acceptTerms directly: ${user.acceptTerms} (type: ${typeof user.acceptTerms})`);
              console.log(`[AuthRoute DEBUG] /login - user.marketingConsent directly: ${user.marketingConsent} (type: ${typeof user.marketingConsent})`);
              console.log(`[AuthRoute DEBUG] /login - user.partnerConsent directly: ${user.partnerConsent} (type: ${typeof user.partnerConsent})`);
              // --- END OF DETAILED LOGGING ---


              if (user.restrictions?.banned) { // Accessing restrictions might need adjustment if it's JSON stored as string
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

              const tokenPayload = { id: user.id, role: user.role }; // user.role should now be correct if raw:true worked
              const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
              });

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
              };
              console.log('[AuthRoute DEBUG] /login - UserInfo being sent to frontend:', userInfo);
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
              const role = req.query.state;
              passport.authenticate('google', {
                  session: false,
                  failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`
              }, async (err, user, info) => {
                  if (err) { return next(err); }
                  if (!user) {
                      await logAuditAction(null, 'google_callback_failed_no_user', {}, req.ip);
                      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
                  }
                  req.user = user;
                  req.authInfo = { role: role || 'client' };
                  next();
              })(req, res, next);
          },
          async (req, res) => {
              try {
                  const user = req.user;
                  const userRole = user.role || req.authInfo.role;
                  const tokenPayload = { id: user.id, role: userRole };
                  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                  });
                  if (user.role !== userRole) {
                      user.role = userRole;
                      await user.save();
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
            state: role
          })(req, res, next);
        });

        router.get(
          '/facebook/callback',
           (req, res, next) => {
              const role = req.query.state;
              passport.authenticate('facebook', {
                  session: false,
                  failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_failed`
              }, async (err, user, info) => {
                  if (err) { return next(err); }
                  if (!user) {
                      await logAuditAction(null, 'facebook_callback_failed_no_user', {}, req.ip);
                      return res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`);
                  }
                  req.user = user;
                  req.authInfo = { role: role || 'client' };
                  next();
              })(req, res, next);
          },
          async (req, res) => {
              try {
                  const user = req.user;
                  const userRole = user.role || req.authInfo.role;
                  const tokenPayload = { id: user.id, role: userRole };
                  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                  });
                  if (user.role !== userRole) {
                      user.role = userRole;
                      await user.save();
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
                return sendSuccessResponse(res, null, 'Jeśli konto istnieje, link do resetowania hasła został wysłany.');
              }
              if (!user.password) {
                 await logAuditAction(user.id, 'forgot_password_oauth_user', { email }, req.ip);
                 return sendSuccessResponse(res, null, 'Resetowanie hasła nie jest dostępne dla kont połączonych przez Google/Facebook.');
              }
              const resetToken = crypto.randomBytes(32).toString('hex');
              const resetTokenHash = await bcrypt.hash(resetToken, 10);
              user.resetPasswordToken = resetTokenHash;
              user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiry
              await user.save();
              const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
              const emailContent = getEmailTemplate('forgotPassword', { email, resetUrl });
              if (!emailContent) {
                  throw new Error('Forgot password email template not found.');
              }
              try {
                 if (typeof sendEmail !== 'function') {
                     console.error('[AuthRoute] CRITICAL: sendEmail is not a function for forgot password!', typeof sendEmail);
                     await logAuditAction(user.id, 'forgot_password_email_failed_internal_type_error', { email: user.email, type: typeof sendEmail }, req.ip);
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
                 sendSuccessResponse(res, null, 'Jeśli konto istnieje, link do resetowania hasła został wysłany.');
              }
            } catch (err) {
              await logAuditAction(null, 'forgot_password_server_error', { email, error: err.message }, req.ip);
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
              const emailContent = getEmailTemplate('passwordResetConfirmation', { email });
              if (!emailContent) {
                  console.error('Password reset confirmation email template not found.');
              }
              try {
                 if (emailContent) {
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
            const userId = req.user?.id;
            if (userId) {
              await logAuditAction(userId, 'logout_success', {}, req.ip);
            } else {
              await logAuditAction(null, 'logout_attempt_no_user', {}, req.ip);
            }
            sendSuccessResponse(res, null, 'Wylogowano pomyślnie');
          } catch (err) {
            await logAuditAction(req.user?.id, 'logout_failed_server_error', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Błąd podczas wylogowywania', err);
          }
        });

        module.exports = router;
