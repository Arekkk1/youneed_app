const axios = require('axios');
        const dotenv = require('dotenv');

        console.log('[EmailLabsService] Loading module...'); // Log start of module loading

        try {
            dotenv.config(); // Load environment variables
            console.log('[EmailLabsService] dotenv configured.');

            const EMAIL_LABS_API_URL = 'https://api.emaillabs.net.pl/api/new_sendmail';
            const APP_KEY = process.env.EMAIL_LABS_APP_KEY;
            const SECRET_KEY = process.env.EMAIL_LABS_SECRET_KEY;
            const SMTP_ACCOUNT = process.env.EMAIL_LABS_SMTP_ACCOUNT;
            const FROM_EMAIL = process.env.EMAIL_SENDER_ADDRESS;
            const FROM_NAME = process.env.EMAIL_SENDER_NAME || 'YouNeed App';

            console.log('[EmailLabsService] Environment variables loaded (partially):', {
                hasAppKey: !!APP_KEY,
                hasSecretKey: !!SECRET_KEY,
                hasSmtpAccount: !!SMTP_ACCOUNT,
                hasFromEmail: !!FROM_EMAIL,
                fromName: FROM_NAME
            });

            /**
             * Sends an email using the EmailLabs API.
             *
             * @param {object} options - Email options.
             * @param {string} options.toEmail - Recipient's email address.
             * @param {string} options.subject - Email subject.
             * @param {string} options.htmlContent - HTML content of the email.
             * @param {string} options.textContent - Plain text content of the email.
             * @param {string} [options.fromNameOverride] - Optional override for the sender name.
             * @returns {Promise<void>}
             */
            const sendEmail = async ({ toEmail, subject, htmlContent, textContent, fromNameOverride }) => {
              console.log('[EmailLabsService] sendEmail function called.'); // Log function call
              if (!APP_KEY || !SECRET_KEY || !SMTP_ACCOUNT || !FROM_EMAIL) {
                console.error('[EmailLabsService] Missing required EmailLabs environment variables.');
                throw new Error('Email service configuration is incomplete.');
              }

              const authString = Buffer.from(`${APP_KEY}:${SECRET_KEY}`).toString('base64');
              const senderName = fromNameOverride || FROM_NAME;

              const payload = {
                to: {
                  [toEmail]: { /* You can add recipient-specific data here if needed */ }
                },
                smtp_account: SMTP_ACCOUNT,
                subject: subject,
                html: htmlContent,
                txt: textContent,
                from: FROM_EMAIL,
                from_name: senderName,
                // Add other EmailLabs options here if needed (e.g., reply_to, headers)
              };

              try {
                console.log(`[EmailLabsService] Attempting to send email to: ${toEmail} with subject: ${subject}`);
                const response = await axios.post(EMAIL_LABS_API_URL, payload, {
                  headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json'
                  }
                });

                console.log('[EmailLabsService] Email sent successfully via API:', response.data);
                // You might want to check response.data for specific success/failure details from EmailLabs
                if (response.data && response.data.status !== 'success' && response.data.message) {
                     console.warn(`[EmailLabsService] EmailLabs API reported an issue: ${response.data.message}`);
                }

              } catch (error) {
                console.error('[EmailLabsService] Error sending email via API:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
                // Rethrow the error or handle it as needed
                throw new Error(`Failed to send email via EmailLabs: ${error.message}`);
              }
            };

            console.log('[EmailLabsService] sendEmail function defined. Type:', typeof sendEmail); // Log function definition

            // --- CRITICAL: Ensure this is the correct export ---
            module.exports = {
                sendEmail // Exporting the function within an object
            };

            console.log('[EmailLabsService] Module exported:', JSON.stringify(module.exports)); // Log what is being exported

        } catch (error) {
            console.error('[EmailLabsService] CRITICAL ERROR DURING MODULE LOAD:', error);
            // If an error occurs during load, export an empty object or rethrow
            // to make the failure obvious when requiring the module.
            module.exports = {}; // Export empty object on error
        }
