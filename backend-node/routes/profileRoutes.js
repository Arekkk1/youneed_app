const express = require('express');
    const router = express.Router();
    const bcrypt = require('bcryptjs');
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    const { User, OpeningHour, Service, ProviderGoal, Notification, AuditLog, sequelize } = require('../models');
    const { body, validationResult } = require('express-validator');
    const authenticate = require('../middleware/authenticate');
    const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
    const { logAuditAction } = require('../utils/audit'); // Ensure this path is correct

    // --- Multer Configuration ---
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'Uploads', 'profile-pictures');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Not an image! Please upload an image file.'), false);
      }
    };

    const upload = multer({
       storage: storage,
       fileFilter: fileFilter,
       limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
    });

    // Helper to get user display name
    const getUserName = (user) => {
      if (!user) return 'N/A';
      if (user.companyName) return user.companyName;
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    };

    // --- GET User Profile ---
    router.get('/', authenticate, async (req, res) => {
      const userId = req.user.id;
      const userRole = req.user.role;
      console.log(`[ProfileRoutes GET /] START for user ${userId}, role ${userRole}`);
      try {
        let profileData = null;
        let includes = [];

        if (userRole === 'provider') {
          includes = [
            { model: OpeningHour, as: 'OpeningHours', order: [['dayOfWeek', 'ASC']] },
            { model: Service, as: 'Services', order: [['name', 'ASC']] },
          ];
        }

        console.log(`[ProfileRoutes GET /] Fetching user ${userId} with includes: ${JSON.stringify(includes)}`);
        let user;
        try {
            user = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'googleId', 'facebookId'] },
                include: includes
            });
            console.log(`[ProfileRoutes GET /] User.findByPk result for ${userId}:`, user ? user.toJSON() : 'Not Found');
        } catch (dbError) {
            console.error(`[ProfileRoutes GET /] Database Error during User.findByPk for ${userId}:`, dbError);
            return sendErrorResponse(res, 500, 'Database error fetching profile', dbError);
        }


        if (!user) {
            console.warn(`[ProfileRoutes GET /] User not found for ID: ${userId}`);
            // await logAuditAction(userId, 'fetch_profile_failed_not_found', { role: userRole }, req.ip);
            return sendErrorResponse(res, 404, 'User profile not found');
        }

        profileData = { ...user.toJSON(), name: getUserName(user) };

        // Clean up response data
        if (userRole === 'provider') {
            profileData.openingHours = profileData.OpeningHours || []; // Use the included data
            profileData.services = profileData.Services || []; // Use the included data
        }
        // Remove sensitive or redundant fields
        delete profileData.password;
        delete profileData.resetPasswordToken;
        delete profileData.resetPasswordExpires;
        delete profileData.googleId;
        delete profileData.facebookId;
        delete profileData.OpeningHours; // Remove the raw association data
        delete profileData.Services; // Remove the raw association data

        console.log(`[ProfileRoutes GET /] Successfully fetched profile for user ${userId}. Sending response.`);
        // await logAuditAction(userId, 'fetch_profile_success', { role: userRole }, req.ip);
        sendSuccessResponse(res, profileData, 'Profile fetched successfully');

      } catch (err) {
        console.error(`[ProfileRoutes GET /] General Error for user ${userId}:`, err); // Log full error
        // await logAuditAction(req.user?.id, 'fetch_profile_failed', { role: req.user?.role, error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to fetch profile', err);
      }
      console.log(`[ProfileRoutes GET /] END for user ${userId}`);
    });


    // --- Validation Middleware for Profile Update ---
    const validateUpdateProfile = [
      body('email').optional().isEmail().withMessage('Invalid email format'),
      body('phoneNumber').optional({ checkFalsy: true }).isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number format'),
      body('address').optional().isObject().withMessage('Address must be an object'),
      body('address.street').optional({ checkFalsy: true }).isString().trim().notEmpty().withMessage('Street cannot be empty'),
      body('address.apartment').optional({ checkFalsy: true }).isString().trim(),
      body('address.city').optional({ checkFalsy: true }).isString().trim().notEmpty().withMessage('City cannot be empty'),
      body('address.postalCode').optional({ checkFalsy: true }).isString().trim().matches(/^\d{2}-\d{3}$/).withMessage('Postal code must be in xx-xxx format'),
      body('address.country').optional({ checkFalsy: true }).isString().trim(),
      body('firstName').optional({ checkFalsy: true }).trim().notEmpty().withMessage('First name cannot be empty'),
      body('lastName').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Last name cannot be empty'),
      body('companyName').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Company name cannot be empty'),
      body('industry').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Industry cannot be empty'),
      body('website').optional({ checkFalsy: true }).isURL().withMessage('Invalid website URL format'),
      body('marketingConsent').optional().isBoolean().withMessage('Marketing consent must be a boolean'),
      body('partnerConsent').optional().isBoolean().withMessage('Partner consent must be a boolean'),
      body('tutorialNeeded').optional().isBoolean().withMessage('Tutorial needed must be a boolean'),
      body('visibilityStartDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format for visibility start date'),
      body('employees').optional({ checkFalsy: true }).isString().trim().notEmpty().withMessage('Employees information cannot be empty'),
      // profileVisibility and receiveNotifications are handled by /preferences endpoint now
      // body('profileVisibility').optional().isBoolean().withMessage('Profile visibility must be a boolean'),
      // body('receiveNotifications').optional().isBoolean().withMessage('Receive notifications must be a boolean'),
    ];


    // --- Common Profile Update Logic ---
    const handleProfileUpdate = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.error("[ProfileRoutes Update] Validation Errors:", errors.array());
          return sendErrorResponse(res, 400, 'Błąd walidacji danych.', { errors: errors.mapped() });
        }

        const userId = req.user.id;
        const updateData = req.body;
        console.log(`[ProfileRoutes Update] START for user ${userId}. Received data:`, updateData);

        try {
          console.log(`[ProfileRoutes Update] Finding user ${userId}...`);
          let user;
           try {
               user = await User.findByPk(userId);
               console.log(`[ProfileRoutes Update] User.findByPk result for ${userId}:`, user ? 'Found' : 'Not Found');
           } catch (dbError) {
               console.error(`[ProfileRoutes Update] Database Error during User.findByPk for ${userId}:`, dbError);
               return sendErrorResponse(res, 500, 'Database error finding user', dbError);
           }

          if (!user) {
            console.warn(`[ProfileRoutes Update] User ${userId} not found.`);
            return sendErrorResponse(res, 404, 'Użytkownik nie znaleziony');
          }
          console.log(`[ProfileRoutes Update] User ${userId} found.`);

          if (updateData.email && updateData.email !== user.email) {
            console.log(`[ProfileRoutes Update] Checking if email ${updateData.email} is already taken...`);
            let existingUser;
            try {
                existingUser = await User.findOne({ where: { email: updateData.email } });
                console.log(`[ProfileRoutes Update] User.findOne result for email ${updateData.email}:`, existingUser ? 'Found' : 'Not Found');
            } catch (dbError) {
                console.error(`[ProfileRoutes Update] Database Error during User.findOne for email ${updateData.email}:`, dbError);
                return sendErrorResponse(res, 500, 'Database error checking email', dbError);
            }
            if (existingUser) {
              console.warn(`[ProfileRoutes Update] Email ${updateData.email} is already taken.`);
              return sendErrorResponse(res, 400, 'Podany adres email jest już zajęty.');
            }
            console.log(`[ProfileRoutes Update] Email ${updateData.email} is available.`);
          }

          // Build update object carefully
          const userFieldsToUpdate = {};
          // Removed profileVisibility, receiveNotifications as they are handled by /preferences
          const allowedFields = ['email', 'firstName', 'lastName', 'marketingConsent', 'partnerConsent', 'website', 'phoneNumber', 'industry', 'companyName', 'tutorial', 'visibilityStartDate', 'employees', 'addressStreet', 'addressApartment', 'addressCity', 'addressPostalCode', 'addressCountry'];

          for (const key in updateData) {
              if (key === 'address' && typeof updateData.address === 'object' && updateData.address !== null) {
                  if (updateData.address.street !== undefined) userFieldsToUpdate.addressStreet = updateData.address.street;
                  if (updateData.address.apartment !== undefined) userFieldsToUpdate.addressApartment = updateData.address.apartment;
                  if (updateData.address.city !== undefined) userFieldsToUpdate.addressCity = updateData.address.city;
                  if (updateData.address.postalCode !== undefined) userFieldsToUpdate.addressPostalCode = updateData.address.postalCode;
                  if (updateData.address.country !== undefined) userFieldsToUpdate.addressCountry = updateData.address.country;
              } else if (key === 'tutorialNeeded') { // Map frontend name to DB name
                  if (updateData.tutorialNeeded !== undefined) userFieldsToUpdate.tutorial = updateData.tutorialNeeded;
              } else if (allowedFields.includes(key) && updateData[key] !== undefined) {
                  // Only update fields relevant to the user's role or common fields
                  if (user.role === 'provider' || !['industry', 'companyName', 'tutorial', 'visibilityStartDate', 'employees'].includes(key)) {
                     userFieldsToUpdate[key] = updateData[key];
                  }
              }
          }


          let updatedUser;
          console.log(`[ProfileRoutes Update] Fields to update for user ${userId}:`, userFieldsToUpdate);

          if (Object.keys(userFieldsToUpdate).length > 0) {
              console.log(`[ProfileRoutes Update] Updating user ${userId} in database...`);
              try {
                  await User.update(userFieldsToUpdate, { where: { id: userId } });
                  console.log(`[ProfileRoutes Update] User.update successful for ${userId}.`);
              } catch (dbError) {
                  console.error(`[ProfileRoutes Update] Database Error during User.update for ${userId}:`, dbError);
                  return sendErrorResponse(res, 500, 'Database error updating user', dbError);
              }
          } else {
              console.log(`[ProfileRoutes Update] No direct User fields to update for ${userId}.`);
          }

          console.log(`[ProfileRoutes Update] Fetching updated user data for ${userId}...`);
          try {
              updatedUser = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'googleId', 'facebookId'] },
              });
              console.log(`[ProfileRoutes Update] User.findByPk (after update) result for ${userId}:`, updatedUser ? updatedUser.toJSON() : 'Not Found');
          } catch (dbError) {
               console.error(`[ProfileRoutes Update] Database Error during User.findByPk (after update) for ${userId}:`, dbError);
               // Don't necessarily fail here, maybe just log and proceed without fresh data
               updatedUser = user; // Use the old user data as fallback
          }


          // await logAuditAction(userId, 'update_profile_success', { userId: userId, role: user.role, updates: { ...userFieldsToUpdate } }, req.ip);

          console.log(`[ProfileRoutes Update] Creating success notification for user ${userId}...`);
          try {
              await Notification.create({
                userId,
                message: 'Twój profil został pomyślnie zaktualizowany.',
                type: 'account',
                isRead: false,
              });
              console.log(`[ProfileRoutes Update] Notification created successfully.`);
          } catch(notifError) {
              console.error("[ProfileRoutes Update] Failed to create notification:", notifError);
          }


          const responseData = { ...(updatedUser?.toJSON() || {}), name: getUserName(updatedUser) };
          delete responseData.OpeningHours; // Ensure these are deleted if somehow present

          console.log(`[ProfileRoutes Update] Successfully updated profile for user ${userId}. Sending response.`);
          sendSuccessResponse(res, responseData, 'Profil został pomyślnie zaktualizowany.');

        } catch (err) {
          console.error(`[ProfileRoutes Update] General Error for user ${userId}:`, err); // Log full error
          // await logAuditAction(userId, 'update_profile_failed_general', { error: err.message }, req.ip);
          sendErrorResponse(res, 500, 'Wystąpił błąd serwera podczas aktualizacji profilu.');
        }
        console.log(`[ProfileRoutes Update] END for user ${userId}.`);
    };

    // --- PUT Update User Profile ---
    router.put('/', authenticate, validateUpdateProfile, handleProfileUpdate);

    // --- PATCH Update User Profile ---
    router.patch('/', authenticate, validateUpdateProfile, handleProfileUpdate);


    // --- POST Upload Profile Picture ---
    router.post('/picture', authenticate, upload.single('profilePicture'), async (req, res) => {
      const userId = req.user.id;
      console.log(`[ProfileRoutes POST /picture] START for user ${userId}`);
      if (!req.file) {
          console.warn(`[ProfileRoutes POST /picture] No file uploaded.`);
          return sendErrorResponse(res, 400, 'No image file uploaded');
      }
      console.log(`[ProfileRoutes POST /picture] File received: ${req.file.filename}`);
      try {
        console.log(`[ProfileRoutes POST /picture] Finding user ${userId}...`);
        let user;
        try {
            user = await User.findByPk(userId);
            console.log(`[ProfileRoutes POST /picture] User.findByPk result for ${userId}:`, user ? 'Found' : 'Not Found');
        } catch (dbError) {
            console.error(`[ProfileRoutes POST /picture] Database Error during User.findByPk for ${userId}:`, dbError);
            // Attempt to delete uploaded file on DB error
            try { fs.unlinkSync(req.file.path); } catch (e) { console.error('Failed to delete uploaded file on DB error', e); }
            return sendErrorResponse(res, 500, 'Database error finding user', dbError);
        }

        if (!user) {
          console.warn(`[ProfileRoutes POST /picture] User ${userId} not found. Deleting uploaded file.`);
          fs.unlinkSync(req.file.path);
          return sendErrorResponse(res, 404, 'User not found');
        }
        console.log(`[ProfileRoutes POST /picture] User ${userId} found.`);
        const fileUrlPath = `/Uploads/profile-pictures/${req.file.filename}`;

        // Delete old picture if exists
        if (user.profilePicture) {
           console.log(`[ProfileRoutes POST /picture] User has old picture: ${user.profilePicture}. Attempting deletion...`);
           try {
              const oldFilePath = path.join(__dirname, '..', user.profilePicture);
              if (fs.existsSync(oldFilePath)) {
                  fs.unlinkSync(oldFilePath);
                  console.log(`[ProfileRoutes POST /picture] Deleted old picture: ${oldFilePath}`);
              } else {
                   console.warn(`[ProfileRoutes POST /picture] Old picture file not found at: ${oldFilePath}`);
              }
           } catch (unlinkErr) {
              console.error("[ProfileRoutes POST /picture] Failed to delete old profile picture:", unlinkErr);
              // await logAuditAction(userId, 'update_profile_picture_delete_old_failed', { oldPath: user.profilePicture, error: unlinkErr.message }, req.ip);
           }
        }

        console.log(`[ProfileRoutes POST /picture] Updating user profile picture path to ${fileUrlPath}...`);
        user.profilePicture = fileUrlPath;
        try {
            await user.save();
            console.log(`[ProfileRoutes POST /picture] User profile picture updated in DB.`);
        } catch (dbError) {
             console.error(`[ProfileRoutes POST /picture] Database Error during user.save for ${userId}:`, dbError);
             // Attempt to delete newly uploaded file on save error
             try { fs.unlinkSync(req.file.path); } catch (e) { console.error('Failed to delete uploaded file on save error', e); }
             return sendErrorResponse(res, 500, 'Database error saving profile picture', dbError);
        }

        // await logAuditAction(userId, 'update_profile_picture_success', { path: fileUrlPath }, req.ip);
        console.log(`[ProfileRoutes POST /picture] Successfully updated picture for user ${userId}. Sending response.`);
        sendSuccessResponse(res, { profilePicture: fileUrlPath }, 'Profile picture updated successfully');
      } catch (err) {
        console.error(`[ProfileRoutes POST /picture] General Error for user ${userId}:`, err);
        try {
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
                console.log(`[ProfileRoutes POST /picture] Deleted uploaded file due to error: ${req.file.path}`);
            }
        } catch (cleanupErr) {
             console.error("[ProfileRoutes POST /picture] Failed to cleanup uploaded profile picture on error:", cleanupErr);
        }
        // await logAuditAction(userId, 'update_profile_picture_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to update profile picture', err);
      }
       console.log(`[ProfileRoutes POST /picture] END for user ${userId}`);
    }, (error, req, res, next) => { // Multer error handler
       console.error("[ProfileRoutes Multer Error]:", error);
       if (error instanceof multer.MulterError) return sendErrorResponse(res, 400, `File upload error: ${error.message}`);
       if (error) return sendErrorResponse(res, 400, error.message || 'Invalid file uploaded');
       next();
    });

    // --- DELETE Profile Picture ---
    router.delete('/picture', authenticate, async (req, res) => {
      const userId = req.user.id;
      console.log(`[ProfileRoutes DELETE /picture] START for user ${userId}`);
      try {
        console.log(`[ProfileRoutes DELETE /picture] Finding user ${userId}...`);
        let user;
         try {
             user = await User.findByPk(userId);
             console.log(`[ProfileRoutes DELETE /picture] User.findByPk result for ${userId}:`, user ? 'Found' : 'Not Found');
         } catch (dbError) {
             console.error(`[ProfileRoutes DELETE /picture] Database Error during User.findByPk for ${userId}:`, dbError);
             return sendErrorResponse(res, 500, 'Database error finding user', dbError);
         }

        if (!user) {
            console.warn(`[ProfileRoutes DELETE /picture] User ${userId} not found.`);
            return sendErrorResponse(res, 404, 'User not found');
        }
        if (!user.profilePicture) {
           console.log(`[ProfileRoutes DELETE /picture] No profile picture to delete for user ${userId}.`);
           // await logAuditAction(userId, 'delete_profile_picture_none_exist', {}, req.ip);
           return sendSuccessResponse(res, null, 'No profile picture to delete');
        }
        const picturePath = user.profilePicture;
        console.log(`[ProfileRoutes DELETE /picture] User has picture: ${picturePath}. Attempting deletion...`);
         try {
            const filePath = path.join(__dirname, '..', picturePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[ProfileRoutes DELETE /picture] Deleted picture file: ${filePath}`);
            } else {
                 console.warn(`[ProfileRoutes DELETE /picture] Picture file not found for deletion: ${filePath}`);
            }
         } catch (unlinkErr) {
            console.error("[ProfileRoutes DELETE /picture] Failed to delete profile picture file:", unlinkErr);
            // await logAuditAction(userId, 'delete_profile_picture_file_failed', { path: picturePath, error: unlinkErr.message }, req.ip);
            // Continue even if file deletion fails, to remove DB reference
         }
        console.log(`[ProfileRoutes DELETE /picture] Setting user profile picture path to null...`);
        user.profilePicture = null;
        try {
            await user.save();
            console.log(`[ProfileRoutes DELETE /picture] User profile picture path set to null in DB.`);
        } catch (dbError) {
             console.error(`[ProfileRoutes DELETE /picture] Database Error during user.save for ${userId}:`, dbError);
             return sendErrorResponse(res, 500, 'Database error removing profile picture reference', dbError);
        }
        // await logAuditAction(userId, 'delete_profile_picture_success', { path: picturePath }, req.ip);
        console.log(`[ProfileRoutes DELETE /picture] Successfully deleted picture for user ${userId}. Sending response.`);
        sendSuccessResponse(res, null, 'Profile picture deleted successfully');
      } catch (err) {
        console.error(`[ProfileRoutes DELETE /picture] General Error for user ${userId}:`, err);
        // await logAuditAction(userId, 'delete_profile_picture_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to delete profile picture', err);
      }
      console.log(`[ProfileRoutes DELETE /picture] END for user ${userId}`);
    });

    // --- Change Password ---
    router.post('/change-password', authenticate, async (req, res) => {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      console.log(`[ProfileRoutes POST /change-password] START for user ${userId}`);
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        console.warn(`[ProfileRoutes POST /change-password] Validation failed: Missing passwords or new password too short.`);
        return sendErrorResponse(res, 400, 'Current password and a new password (min 8 chars) are required');
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
          console.warn(`[ProfileRoutes POST /change-password] Validation failed: New password complexity.`);
          return sendErrorResponse(res, 400, 'New password does not meet complexity requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character).');
      }

      try {
        console.log(`[ProfileRoutes POST /change-password] Finding user ${userId}...`);
        let user;
        try {
            user = await User.findByPk(userId);
            console.log(`[ProfileRoutes POST /change-password] User.findByPk result for ${userId}:`, user ? 'Found' : 'Not Found');
        } catch (dbError) {
            console.error(`[ProfileRoutes POST /change-password] Database Error during User.findByPk for ${userId}:`, dbError);
            return sendErrorResponse(res, 500, 'Database error finding user', dbError);
        }

        if (!user) {
            console.warn(`[ProfileRoutes POST /change-password] User ${userId} not found.`);
            return sendErrorResponse(res, 404, 'User not found');
        }
        if (!user.password) {
           console.warn(`[ProfileRoutes POST /change-password] User ${userId} uses OAuth. Password change unavailable.`);
           // await logAuditAction(userId, 'change_password_failed_oauth', {}, req.ip);
           return sendErrorResponse(res, 400, 'Password change is not available for accounts linked via Google/Facebook.');
        }
        console.log(`[ProfileRoutes POST /change-password] Comparing current password...`);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          console.warn(`[ProfileRoutes POST /change-password] Invalid current password for user ${userId}.`);
          // await logAuditAction(userId, 'change_password_failed_invalid_current', {}, req.ip);
          return sendErrorResponse(res, 400, 'Bieżące hasło jest nieprawidłowe');
        }
        console.log(`[ProfileRoutes POST /change-password] Current password matches. Hashing new password...`);
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        console.log(`[ProfileRoutes POST /change-password] Saving new password...`);
        try {
            await user.save();
            console.log(`[ProfileRoutes POST /change-password] New password saved in DB.`);
        } catch (dbError) {
             console.error(`[ProfileRoutes POST /change-password] Database Error during user.save for ${userId}:`, dbError);
             return sendErrorResponse(res, 500, 'Database error saving new password', dbError);
        }

        // await logAuditAction(userId, 'change_password_success', {}, req.ip);
        console.log(`[ProfileRoutes POST /change-password] Creating notification...`);
        try {
            await Notification.create({
               userId: userId,
               message: 'Twoje hasło zostało zmienione.',
               type: 'account',
               isRead: false
            });
            console.log(`[ProfileRoutes POST /change-password] Notification created.`);
        } catch(notifError) {
            console.error("[ProfileRoutes POST /change-password] Failed to create notification:", notifError);
        }
        console.log(`[ProfileRoutes POST /change-password] Successfully changed password for user ${userId}. Sending response.`);
        sendSuccessResponse(res, null, 'Hasło zostało pomyślnie zmienione');
      } catch (err) {
        console.error(`[ProfileRoutes POST /change-password] General Error for user ${userId}:`, err);
        // await logAuditAction(userId, 'change_password_failed', { error: err.message }, req.ip);
        sendErrorResponse(res, 500, 'Failed to change password', err);
      }
      console.log(`[ProfileRoutes POST /change-password] END for user ${userId}`);
    });

    // --- GET User Preferences ---
    router.get('/preferences', authenticate, async (req, res) => {
        const userId = req.user.id;
        console.log(`[ProfileRoutes GET /preferences] START for user ${userId}`);
        try {
            const preferenceAttributes = [
                'prefEmailMarketing', 'prefEmailPlatformUpdates',
                'prefEmailOrderUpdatesClient', 'prefEmailPromotions',
                'prefEmailNewOrder', 'prefEmailOrderUpdatesProvider', 'prefSmsAlerts'
            ];
            console.log(`[ProfileRoutes GET /preferences] Fetching user ${userId} with attributes: ${preferenceAttributes.join(', ')}`);
            let user;
            try {
                user = await User.findByPk(userId, { attributes: preferenceAttributes });
                console.log(`[ProfileRoutes GET /preferences] User.findByPk result for ${userId}:`, user ? user.toJSON() : 'Not Found');
            } catch (dbError) {
                 console.error(`[ProfileRoutes GET /preferences] Database Error during User.findByPk for ${userId}:`, dbError);
                 return sendErrorResponse(res, 500, 'Database error fetching preferences', dbError);
            }


            if (!user) {
                console.warn(`[ProfileRoutes GET /preferences] User not found for ID: ${userId}`);
                // await logAuditAction(userId, 'fetch_preferences_failed_not_found', {}, req.ip);
                return sendErrorResponse(res, 404, 'User not found');
            }

            console.log(`[ProfileRoutes GET /preferences] Successfully fetched preferences for user ${userId}. Sending response.`);
            // await logAuditAction(userId, 'fetch_preferences_success', {}, req.ip);
            sendSuccessResponse(res, user.toJSON(), 'Preferences fetched successfully');

        } catch (err) {
            console.error(`[ProfileRoutes GET /preferences] General Error for user ${userId}:`, err); // Log full error
            // await logAuditAction(userId, 'fetch_preferences_failed', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Failed to fetch preferences', err);
        }
         console.log(`[ProfileRoutes GET /preferences] END for user ${userId}`);
    });

    // --- PUT Update User Preferences ---
    const validateUpdatePreferences = [
        body('prefEmailMarketing').optional().isBoolean().withMessage('Invalid value for Email Marketing preference'),
        body('prefEmailPlatformUpdates').optional().isBoolean().withMessage('Invalid value for Platform Updates preference'),
        body('prefEmailOrderUpdatesClient').optional().isBoolean().withMessage('Invalid value for Client Order Updates preference'),
        body('prefEmailPromotions').optional().isBoolean().withMessage('Invalid value for Promotions preference'),
        body('prefEmailNewOrder').optional().isBoolean().withMessage('Invalid value for New Order preference'),
        body('prefEmailOrderUpdatesProvider').optional().isBoolean().withMessage('Invalid value for Provider Order Updates preference'),
        body('prefSmsAlerts').optional().isBoolean().withMessage('Invalid value for SMS Alerts preference'),
    ];

    router.put('/preferences', authenticate, validateUpdatePreferences, async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error("[ProfileRoutes PUT /preferences] Validation errors:", errors.array());
            return sendErrorResponse(res, 400, 'Validation error', { errors: errors.mapped() });
        }

        const userId = req.user.id;
        const preferencesToUpdate = req.body;
        console.log(`[ProfileRoutes PUT /preferences] START for user ${userId} with data:`, preferencesToUpdate);

        const allowedPreferenceKeys = [
            'prefEmailMarketing', 'prefEmailPlatformUpdates',
            'prefEmailOrderUpdatesClient', 'prefEmailPromotions',
            'prefEmailNewOrder', 'prefEmailOrderUpdatesProvider', 'prefSmsAlerts'
        ];
        const filteredPreferences = Object.keys(preferencesToUpdate)
            .filter(key => allowedPreferenceKeys.includes(key))
            .reduce((obj, key) => {
                // Ensure value is strictly boolean
                obj[key] = typeof preferencesToUpdate[key] === 'boolean' ? preferencesToUpdate[key] : false;
                return obj;
            }, {});

        if (Object.keys(filteredPreferences).length === 0) {
            console.warn(`[ProfileRoutes PUT /preferences] for user ${userId}: No valid preference fields provided.`);
            // Fetch current preferences to return them
            let currentUser;
             try {
                 currentUser = await User.findByPk(userId, { attributes: allowedPreferenceKeys });
                 console.log(`[ProfileRoutes PUT /preferences] No update needed. Fetched current prefs for ${userId}:`, currentUser ? currentUser.toJSON() : 'Not Found');
             } catch (dbError) {
                  console.error(`[ProfileRoutes PUT /preferences] Database Error fetching current prefs for ${userId} (no update needed):`, dbError);
                  return sendErrorResponse(res, 500, 'Database error fetching current preferences', dbError);
             }
            return sendSuccessResponse(res, currentUser?.toJSON() || {}, 'No valid preference fields provided to update.');
        }

        console.log(`[ProfileRoutes PUT /preferences] Filtered preferences to update for user ${userId}:`, filteredPreferences);

        try {
            console.log(`[ProfileRoutes PUT /preferences] Updating preferences for user ${userId}...`);
            let updateResult;
            try {
                updateResult = await User.update(filteredPreferences, { where: { id: userId }, returning: false }); // returning: false might be needed depending on dialect/version
                console.log(`[ProfileRoutes PUT /preferences] User.update result for ${userId}:`, updateResult);
            } catch (dbError) {
                 console.error(`[ProfileRoutes PUT /preferences] Database Error during User.update for ${userId}:`, dbError);
                 return sendErrorResponse(res, 500, 'Database error updating preferences', dbError);
            }

            const [updateCount] = updateResult || [0]; // Handle potential undefined result
            console.log(`[ProfileRoutes PUT /preferences] Update count: ${updateCount}`);

            if (updateCount === 0) {
                console.warn(`[ProfileRoutes PUT /preferences] for user ${userId}: User not found or no changes made.`);
                let userExists;
                try {
                    userExists = await User.findByPk(userId, { attributes: ['id'] });
                     console.log(`[ProfileRoutes PUT /preferences] User.findByPk (check existence) result for ${userId}:`, userExists ? 'Found' : 'Not Found');
                } catch (dbError) {
                     console.error(`[ProfileRoutes PUT /preferences] Database Error checking user existence for ${userId}:`, dbError);
                     return sendErrorResponse(res, 500, 'Database error checking user existence', dbError);
                }

                if (!userExists) {
                     // await logAuditAction(userId, 'update_preferences_failed_not_found', { preferences: filteredPreferences }, req.ip);
                    return sendErrorResponse(res, 404, 'User not found');
                } else {
                     // await logAuditAction(userId, 'update_preferences_no_change', { preferences: filteredPreferences }, req.ip);
                     let currentUser;
                     try {
                         currentUser = await User.findByPk(userId, { attributes: allowedPreferenceKeys });
                         console.log(`[ProfileRoutes PUT /preferences] No change detected. Fetched current prefs for ${userId}:`, currentUser ? currentUser.toJSON() : 'Not Found');
                     } catch (dbError) {
                          console.error(`[ProfileRoutes PUT /preferences] Database Error fetching current prefs for ${userId} (no change):`, dbError);
                          return sendErrorResponse(res, 500, 'Database error fetching current preferences', dbError);
                     }
                    return sendSuccessResponse(res, currentUser.toJSON(), 'No changes detected in preferences.');
                }
            }

            console.log(`[ProfileRoutes PUT /preferences] Successfully updated preferences for user ${userId}. Fetching updated data...`);
            // await logAuditAction(userId, 'update_preferences_success', { preferences: filteredPreferences }, req.ip);

            let updatedUser;
            try {
                updatedUser = await User.findByPk(userId, { attributes: allowedPreferenceKeys });
                console.log(`[ProfileRoutes PUT /preferences] User.findByPk (after update) result for ${userId}:`, updatedUser ? updatedUser.toJSON() : 'Not Found');
            } catch (dbError) {
                 console.error(`[ProfileRoutes PUT /preferences] Database Error fetching updated prefs for ${userId}:`, dbError);
                 return sendErrorResponse(res, 500, 'Database error fetching updated preferences', dbError);
            }


            console.log(`[ProfileRoutes PUT /preferences] Creating notification...`);
             try {
                 await Notification.create({
                     userId,
                     message: 'Twoje preferencje zostały zaktualizowane.',
                     type: 'account',
                     isRead: false,
                 });
                 console.log(`[ProfileRoutes PUT /preferences] Notification created.`);
             } catch(notifError) {
                 console.error("[ProfileRoutes PUT /preferences] Failed to create notification:", notifError);
             }

            console.log(`[ProfileRoutes PUT /preferences] Sending success response for user ${userId}.`);
            sendSuccessResponse(res, updatedUser.toJSON(), 'Preferences updated successfully');

        } catch (err) {
            console.error(`[ProfileRoutes PUT /preferences] General Error for user ${userId}:`, err); // Log full error
            // await logAuditAction(userId, 'update_preferences_failed', { error: err.message, preferences: filteredPreferences }, req.ip);
            sendErrorResponse(res, 500, 'Failed to update preferences', err);
        }
         console.log(`[ProfileRoutes PUT /preferences] END for user ${userId}`);
    });


    module.exports = router;
