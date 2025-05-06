const axios = require('axios');
        const dotenv = require('dotenv');
        const { URLSearchParams } = require('url'); // To correctly encode form data

        dotenv.config(); // Load environment variables

        const APP_KEY = process.env.EMAIL_LABS_APP_KEY;
        const SECRET_KEY = process.env.EMAIL_LABS_SECRET_KEY;
        const SMTP_ACCOUNT = process.env.EMAIL_LABS_SMTP_ACCOUNT;
        const SENDER_ADDRESS = process.env.EMAIL_SENDER_ADDRESS;
        const SENDER_NAME = process.env.EMAIL_SENDER_NAME || 'YouNeed';
        const API_URL = 'https://api.emaillabs.net.pl/api/new_sendmail'; // Using new_sendmail endpoint

        if (!APP_KEY || !SECRET_KEY || !SMTP_ACCOUNT || !SENDER_ADDRESS) {
          console.error("EmailLabs configuration missing in .env file (APP_KEY, SECRET_KEY, SMTP_ACCOUNT, SENDER_ADDRESS)");
          // Optionally throw an error to prevent startup if config is critical
          // throw new Error("EmailLabs configuration missing.");
        }

        // Generate Basic Auth token
        const AUTH_TOKEN = 'Basic ' + Buffer.from(`${APP_KEY}:${SECRET_KEY}`).toString('base64');

        /**
         * Sends an email using the EmailLabs API.
         * @param {object} options - Email options.
         * @param {string} options.toEmail - Recipient's email address.
         * @param {string} options.subject - Email subject.
         * @param {string} options.htmlContent - HTML content of the email.
         * @param {string} [options.textContent] - Plain text content of the email (recommended).
         * @param {string} [options.fromNameOverride] - Optional sender name override.
         * @param {string} [options.replyTo] - Optional reply-to address.
         * @returns {Promise<object>} - The response data from EmailLabs API.
         * @throws {Error} - If the request fails or configuration is missing.
         */
        const sendEmail = async ({ toEmail, subject, htmlContent, textContent, fromNameOverride, replyTo }) => {
          if (!APP_KEY || !SECRET_KEY || !SMTP_ACCOUNT || !SENDER_ADDRESS) {
            throw new Error("EmailLabs configuration is incomplete.");
          }

          const payload = new URLSearchParams();
          payload.append('to[0]', toEmail); // Simple structure for single recipient
          payload.append('smtp_account', SMTP_ACCOUNT);
          payload.append('subject', subject);
          payload.append('html', htmlContent);
          if (textContent) {
            payload.append('text', textContent);
          }
          payload.append('from', SENDER_ADDRESS);
          payload.append('from_name', fromNameOverride || SENDER_NAME);
          if (replyTo) {
            payload.append('reply_to', replyTo);
          }

          // EmailLabs expects the 'to' field formatted differently for the API
          // We need to send it as 'to[email@example.com]' or similar if using URLSearchParams directly.
          // Let's adjust the payload construction for URLSearchParams:
          const params = new URLSearchParams();
          params.append(`to[${toEmail}]`, ''); // Key is the email, value can be empty for simple send
          params.append('smtp_account', SMTP_ACCOUNT);
          params.append('subject', subject);
          params.append('html', htmlContent);
          if (textContent) {
            params.append('text', textContent);
          }
          params.append('from', SENDER_ADDRESS);
          params.append('from_name', fromNameOverride || SENDER_NAME);
           if (replyTo) {
             params.append('reply_to', replyTo);
           }


          console.log(`[EmailLabs] Sending email to: ${toEmail}, Subject: ${subject}`);

          try {
            const response = await axios.post(API_URL, params, { // Send params object
              headers: {
                'Authorization': AUTH_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded' // Important!
              }
            });

            console.log('[EmailLabs] API Response Status:', response.status);
            console.log('[EmailLabs] API Response Data:', response.data);

            if (response.data && response.data.code === 200 && response.data.status === 'success') {
              console.log(`[EmailLabs] Successfully sent email to ${toEmail}. Message ID(s):`, response.data.data);
              return response.data;
            } else {
              // Handle cases where EmailLabs returns 200 OK but indicates an issue in the body
              const errorMsg = response.data?.message || 'Unknown EmailLabs API success response issue';
              console.error(`[EmailLabs] API Error (Success Status Code, but error in body): ${errorMsg}`, response.data);
              throw new Error(`EmailLabs API Error: ${errorMsg}`);
            }
          } catch (error) {
            let errorMsg = 'Failed to send email via EmailLabs.';
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error('[EmailLabs] API Error Status:', error.response.status);
              console.error('[EmailLabs] API Error Data:', error.response.data);
              errorMsg = `EmailLabs API Error (${error.response.status}): ${error.response.data?.message || error.message}`;
            } else if (error.request) {
              // The request was made but no response was received
              console.error('[EmailLabs] No response received:', error.request);
              errorMsg = 'EmailLabs API Error: No response received from server.';
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('[EmailLabs] Request Setup Error:', error.message);
              errorMsg = `EmailLabs API Error: ${error.message}`;
            }
            throw new Error(errorMsg);
          }
        };

        module.exports = { sendEmail };
