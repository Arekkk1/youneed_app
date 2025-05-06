const crypto = require('crypto');
        const { User, EmailCode, Notification } = require('../models');

        // --- Corrected Import ---
        const emailLabsService = require('../services/emailLabsService');
        console.log('[emailVerificationController] Imported emailLabsService:', typeof emailLabsService, emailLabsService);
        const { sendEmail } = emailLabsService; // Destructure AFTER logging the import
        console.log('[emailVerificationController] sendEmail function type:', typeof sendEmail);
        // --- End Corrected Import ---

        const { getEmailTemplate } = require('../emailTemplates'); // Import template helper
        const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
        const { logAuditAction } = require('../utils/audit');
        const { Op } = require('sequelize');

        const CODE_EXPIRY_MINUTES = 10; // Code expiry time

        // Function to generate a 6-digit code
        const generateCode = () => {
          return crypto.randomInt(100000, 999999).toString();
        };

        // Send Verification Code Email Controller Function
        const sendVerificationCode = async (req, res) => {
          const userId = req.user.id; // Get user ID from authenticated request

          try {
            const user = await User.findByPk(userId);
            if (!user || !user.email) {
              // Log before sending response
              await logAuditAction(userId, 'email_verify_send_failed_no_user_or_email', {}, req.ip).catch(console.error);
              return sendErrorResponse(res, 404, 'Nie znaleziono użytkownika lub adresu email.');
            }

            const email = user.email;
            const code = generateCode();
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

            // Store the code in the database
            await EmailCode.create({
              userId,
              email,
              code, // Storing plaintext for now, consider hashing later
              expiresAt,
              verified: false,
            });

            // --- Use Email Template ---
            const emailContent = getEmailTemplate('emailVerification', { firstName: user.firstName, code });
            if (!emailContent) {
                console.error('[emailVerificationController] Email verification template not found.');
                // Log audit before sending response
                await logAuditAction(userId, 'email_verify_send_failed_template_missing', { email }, req.ip).catch(console.error);
                return sendErrorResponse(res, 500, 'Błąd wewnętrzny serwera podczas przygotowywania emaila.');
            }
            // --- End Use Email Template ---

            // --- Check if sendEmail is a function before calling ---
            if (typeof sendEmail !== 'function') {
                console.error('[emailVerificationController] CRITICAL: sendEmail is not a function!', typeof sendEmail);
                await logAuditAction(userId, 'email_verify_send_failed_internal_type_error', { email, type: typeof sendEmail }, req.ip).catch(console.error);
                return sendErrorResponse(res, 500, 'Błąd wewnętrzny serwera podczas wysyłania emaila (Service Error).');
            }
            // --- End Check ---

            // Send the email using EmailLabs service
            console.log(`[emailVerificationController] Attempting to call sendEmail for user ${userId} to ${email}`);
            await sendEmail({ // This should now be line ~65 due to added logs/checks
              toEmail: email,
              subject: emailContent.subject,
              htmlContent: emailContent.htmlContent,
              textContent: emailContent.textContent,
              // fromNameOverride: 'YouNeed Support' // Optional: Override default sender name
            });
            console.log(`[emailVerificationController] sendEmail call completed for user ${userId}`);


            await logAuditAction(userId, 'email_verify_code_sent', { email }, req.ip).catch(console.error);
            sendSuccessResponse(res, null, 'Kod weryfikacyjny został wysłany na Twój adres email.');

          } catch (err) {
            // Log the specific error from sendEmail or other operations
            console.error("[emailVerificationController] Send Email Verification Code Error:", err);
            // Log audit action, catching potential errors during logging itself
            await logAuditAction(userId, 'email_verify_send_failed_server_error', { error: err.message, stack: err.stack }, req.ip).catch(console.error);
            // Avoid sending detailed error in production
            sendErrorResponse(res, 500, 'Błąd podczas wysyłania kodu weryfikacyjnego email.', process.env.NODE_ENV !== 'production' ? err.message : undefined);
          }
        };

        // Verify Email Code Controller Function
        const verifyEmailCode = async (req, res) => {
          const userId = req.user.id;
          const { code } = req.body;

          // Trim spaces and validate format before further processing
          const trimmedCode = code ? code.toString().replace(/\s+/g, '') : '';
          if (!trimmedCode || !/^\d{6}$/.test(trimmedCode)) {
            return sendErrorResponse(res, 400, 'Kod weryfikacyjny musi składać się z 6 cyfr.');
          }

          try {
            const emailCodeRecord = await EmailCode.findOne({
              where: {
                userId,
                code: trimmedCode, // Compare with trimmed, validated code
                verified: false,
                expiresAt: { [Op.gt]: new Date() }, // Check if not expired
              },
              order: [['createdAt', 'DESC']], // Get the latest code if multiple exist
            });

            if (!emailCodeRecord) {
              await logAuditAction(userId, 'email_verify_failed_invalid_or_expired', { codeAttempt: trimmedCode }, req.ip).catch(console.error);
              return sendErrorResponse(res, 400, 'Nieprawidłowy kod weryfikacyjny lub kod wygasł.');
            }

            // Mark the code as verified
            emailCodeRecord.verified = true;
            await emailCodeRecord.save();

            // Optionally, mark the user's email as verified if not already
            const user = await User.findByPk(userId);
            if (user /* && !user.emailVerified */) { // Check if user exists before potentially updating
              // Assuming you add an 'emailVerified' column to User model later
              // user.emailVerified = true;
              // await user.save();
              // console.log(`[emailVerificationController] User email marked as verified (User ID: ${userId})`); // Add log if you implement this

              // Send in-app notification instead of modifying user model directly here
              await Notification.create({
                userId: user.id,
                message: 'Twój adres email został pomyślnie zweryfikowany.',
                type: 'account',
                isRead: false, // Ensure new notifications are marked as unread
                createdAt: new Date(),
              });
            } else if (!user) {
                 console.warn(`[emailVerificationController] User not found (ID: ${userId}) during email verification success step.`);
                 // Log audit for this unexpected situation
                 await logAuditAction(userId, 'email_verify_success_user_not_found', { email: emailCodeRecord.email }, req.ip).catch(console.error);
            }


            await logAuditAction(userId, 'email_verify_success', { email: emailCodeRecord.email }, req.ip).catch(console.error);
            sendSuccessResponse(res, null, 'Adres email został pomyślnie zweryfikowany.');

          } catch (err) {
            console.error("[emailVerificationController] Verify Email Code Error:", err);
            await logAuditAction(userId, 'email_verify_failed_server_error', { error: err.message, stack: err.stack }, req.ip).catch(console.error);
            sendErrorResponse(res, 500, 'Błąd podczas weryfikacji kodu email.', process.env.NODE_ENV !== 'production' ? err.message : undefined);
          }
        };

        // Export the functions within an object
        module.exports = {
          sendVerificationCode,
          verifyEmailCode,
        };
