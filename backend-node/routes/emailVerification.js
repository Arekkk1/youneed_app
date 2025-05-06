const express = require('express');
        const { body } = require('express-validator');
        // Import the controller object
        const emailVerificationController = require('../controllers/emailVerificationController');
        const authenticate = require('../middleware/authenticate'); // Use the correct auth middleware

        const router = express.Router();

        // POST /api/email/send-code - Send verification code via email
        router.post(
          '/send-code',
          authenticate, // Protect route - user must be logged in (registered)
          // Access the function from the imported object
          emailVerificationController.sendVerificationCode
        );

        // POST /api/email/verify-code - Verify the email code
        router.post(
          '/verify-code',
          authenticate, // Protect route
          [
            // Validate the 'code' field from the request body
            body('code')
              .trim() // Remove leading/trailing whitespace
              .isLength({ min: 6, max: 6 }).withMessage('Kod musi mieć 6 cyfr.')
              .isNumeric().withMessage('Kod musi składać się z cyfr.'),
          ],
          // Access the function from the imported object
          emailVerificationController.verifyEmailCode
        );

        module.exports = router;
