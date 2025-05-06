const { User, Service, OpeningHours, ProviderGoal, Notification, AuditLog, sequelize } = require('../models'); // Added sequelize
const { body, validationResult } = require('express-validator');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/response'); // Assuming you have response utils

// Helper to log audit actions
const logAuditAction = async (adminId, action, details) => {
  try {
    await AuditLog.create({
      adminId, // Can be null if action is by regular user
      userId: details.userId || null, // Log the ID of the user performing the action if available
      action,
      details: JSON.stringify(details), // Ensure details are stored as JSON string
      ipAddress: details.ip || null, // Store IP address
      createdAt: new Date(),
      // updatedAt will be handled by Sequelize automatically if timestamps: true
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Decide if you want to throw the error or just log it
  }
};


// Validation middleware for updateProfile
const validateUpdateProfile = [
  // Keep existing validations...
  body('email').optional().isEmail().withMessage('Invalid email format'),
  // Make phone number validation more flexible if needed, or keep pl-PL
  body('phoneNumber').optional().isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number format'),
  // Validate the structure of the address object if sent as JSON
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional({ checkFalsy: true }).isString().trim().notEmpty().withMessage('Street cannot be empty'),
  body('address.apartment').optional({ checkFalsy: true }).isString().trim(), // Allow empty string for optional apartment
  body('address.city').optional({ checkFalsy: true }).isString().trim().notEmpty().withMessage('City cannot be empty'),
  body('address.postalCode').optional({ checkFalsy: true }).isString().trim().matches(/^\d{2}-\d{3}$/).withMessage('Postal code must be in xx-xxx format'),

  body('firstName').optional({ checkFalsy: true }).trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Last name cannot be empty'),
  body('companyName').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Company name cannot be empty'),
  body('industry').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Industry cannot be empty'),
  body('marketingConsent').optional().isBoolean().withMessage('Marketing consent must be a boolean'),
  body('partnerConsent').optional().isBoolean().withMessage('Partner consent must be a boolean'),
  body('tutorialNeeded').optional().isBoolean().withMessage('Tutorial needed must be a boolean'),
  body('visibilityStartDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format for visibility start date'),
  body('employees').optional({ checkFalsy: true }).isString().trim().notEmpty().withMessage('Employees information cannot be empty'), // Example: Treat as string
  // Add validation for openingHours if it's sent in this request
  body('openingHours').optional().isArray().withMessage('Opening hours must be an array'),
  // Add more specific validation for openingHours items if needed
];


// Get list of providers (Keep as is)
exports.getProviders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const providers = await User.findAll({
      where: { role: 'provider' },
      attributes: ['id', 'firstName', 'lastName', 'industry', 'companyName', 'addressCity', 'profilePicture'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    const total = await User.count({ where: { role: 'provider' } });
    res.json({ providers, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Błąd pobierania usługodawców:', err);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania usługodawców' });
  }
};

// Update user profile - REVISED to match frontend payload from Step 4
exports.updateProfile = [
  authenticate, // Apply authentication middleware directly here as well
  ...validateUpdateProfile,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log detailed validation errors
      console.error("Validation Errors:", errors.array());
      // Return structured errors
      return sendErrorResponse(res, 400, 'Błąd walidacji danych.', { errors: errors.mapped() });
    }

    const userId = req.user.id; // Get user ID from authenticated token
    const {
      // Fields potentially sent from Step 4 and later steps
      email, // Usually not updated here, but handle if sent
      firstName,
      lastName,
      profilePhoto, // Assuming frontend sends this key for profile picture URL
      industry,
      companyName,
      phoneNumber,
      address, // Expecting an object: { street, apartment, city, postalCode }
      marketingConsent,
      partnerConsent,
      tutorialNeeded,
      visibilityStartDate,
      employees, // Added field
      openingHours, // Added field (complex structure)
      // Add other fields as needed: services, goals etc. might be handled by separate endpoints
    } = req.body;

    console.log(`[Update Profile] Received data for user ${userId}:`, req.body); // Log received data

    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'Użytkownik nie znaleziony');
      }

      // Check for email conflict if email is being changed
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return sendErrorResponse(res, 400, 'Podany adres email jest już zajęty.');
        }
      }

      // Prepare fields to update in the User model
      const userFieldsToUpdate = {};
      if (email !== undefined && email !== user.email) userFieldsToUpdate.email = email; // Only update if changed
      if (firstName !== undefined) userFieldsToUpdate.firstName = firstName;
      if (lastName !== undefined) userFieldsToUpdate.lastName = lastName;
      if (profilePhoto !== undefined) userFieldsToUpdate.profilePicture = profilePhoto; // Ensure model field name matches
      if (marketingConsent !== undefined) userFieldsToUpdate.marketingConsent = marketingConsent;
      if (partnerConsent !== undefined) userFieldsToUpdate.partnerConsent = partnerConsent;

      // --- Address Handling ---
      // Assuming address fields are stored directly in the User model (e.g., addressStreet, addressCity)
      // Adjust if you have a separate Address model or store address as JSON
      if (address) {
          if (address.street !== undefined) userFieldsToUpdate.addressStreet = address.street;
          if (address.apartment !== undefined) userFieldsToUpdate.addressApartment = address.apartment; // Can be null/empty
          if (address.city !== undefined) userFieldsToUpdate.addressCity = address.city;
          if (address.postalCode !== undefined) userFieldsToUpdate.addressPostalCode = address.postalCode;
      }

      // --- Provider Specific Fields ---
      if (user.role === 'provider') {
        if (industry !== undefined) userFieldsToUpdate.industry = industry;
        if (companyName !== undefined) userFieldsToUpdate.companyName = companyName;
        if (phoneNumber !== undefined) userFieldsToUpdate.phoneNumber = phoneNumber;
        if (tutorialNeeded !== undefined) userFieldsToUpdate.tutorial = tutorialNeeded; // Assuming boolean/tinyint in DB
        if (visibilityStartDate !== undefined) userFieldsToUpdate.visibilityStartDate = visibilityStartDate;
        if (employees !== undefined) userFieldsToUpdate.employees = employees; // Assuming a text/varchar field
      }

      // --- Transaction for complex updates (User + OpeningHours) ---
      await sequelize.transaction(async (t) => {
        // 1. Update User fields
        if (Object.keys(userFieldsToUpdate).length > 0) {
          console.log(`[Update Profile] Updating User fields for ${userId}:`, userFieldsToUpdate);
          userFieldsToUpdate.updatedAt = new Date(); // Manually set updatedAt if needed
          await User.update(userFieldsToUpdate, { where: { id: userId }, transaction: t });
        } else {
          console.log(`[Update Profile] No direct User fields to update for ${userId}.`);
        }

        // 2. Update Opening Hours (if provided and user is provider)
        if (user.role === 'provider' && openingHours && Array.isArray(openingHours)) {
           console.log(`[Update Profile] Updating Opening Hours for provider ${userId}:`, openingHours);
           // Example: Delete existing and insert new ones (simpler logic)
           // More robust: Update existing, insert new, delete removed
           await OpeningHours.destroy({ where: { providerId: userId }, transaction: t });

           const hoursToCreate = openingHours.map((hour, index) => ({
               providerId: userId,
               // Assuming dayOfWeek is implicit by array index (0=Monday) or needs mapping
               dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index], // Adjust if structure differs
               isOpen: hour.isOpen,
               openTime: hour.isOpen ? hour.openTime : null,
               closeTime: hour.isOpen ? hour.closeTime : null,
               createdAt: new Date(),
               updatedAt: new Date(),
           }));
           await OpeningHours.bulkCreate(hoursToCreate, { transaction: t });
        }
      }); // End transaction

      // Fetch the updated user data (excluding password)
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        // Include associated data if needed (e.g., opening hours)
        // include: [{ model: OpeningHours, as: 'openingHours' }]
      });

      // Log the audit action
      await logAuditAction(null, 'update_profile', { // adminId is null for user action
        userId: userId, // ID of the user whose profile was updated
        updates: { ...userFieldsToUpdate, openingHours }, // Log what was potentially updated
        ip: req.ip,
      });

      // Send notification
      await Notification.create({
        userId,
        message: 'Twój profil został pomyślnie zaktualizowany.',
        type: 'account',
        isRead: false, // Ensure it's marked as unread
        createdAt: new Date(),
      }).catch(err => console.error("Failed to create notification:", err)); // Catch potential notification error

      // Send success response
      sendSuccessResponse(res, 200, 'Profil został pomyślnie zaktualizowany.', { user: updatedUser });

    } catch (err) {
      console.error(`[Update Profile] Error updating profile for user ${userId}:`, err);
      // Check for specific Sequelize errors if needed
      if (err.name === 'SequelizeValidationError') {
          return sendErrorResponse(res, 400, 'Błąd walidacji danych.', { errors: err.errors });
      }
      sendErrorResponse(res, 500, 'Wystąpił błąd serwera podczas aktualizacji profilu.');
    }
  },
];


// Add a service (Keep as is or move to serviceController.js)
exports.addService = [
  authenticate,
  ...validateAddService,
  async (req, res) => {
    // ... (implementation remains the same)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Błąd walidacji.', { errors: errors.mapped() });
    }

    const providerId = req.user.id;
    const { name, price } = req.body;

    try {
      const user = await User.findByPk(providerId);
      if (!user || user.role !== 'provider') {
        return sendErrorResponse(res, 403, 'Tylko usługodawcy mogą dodawać usługi');
      }

      const service = await Service.create({
        providerId,
        name,
        price: parseFloat(price),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await logAuditAction(null, 'add_service', {
        userId: providerId,
        serviceId: service.id,
        name,
        price,
        ip: req.ip,
      });

      await Notification.create({
        userId: providerId,
        message: `Nowa usługa "${name}" została dodana.`,
        type: 'account',
        isRead: false,
        createdAt: new Date(),
      }).catch(err => console.error("Failed to create notification:", err));

      sendSuccessResponse(res, 201, 'Usługa dodana pomyślnie.', { service });
    } catch (err) {
      console.error('Błąd dodawania usługi:', err);
      sendErrorResponse(res, 500, 'Błąd serwera podczas dodawania usługi.');
    }
  },
];

// Add opening hours (Keep as is or move to providerController.js/settingsController.js)
exports.addOpeningHours = [
  authenticate,
  ...validateAddOpeningHours,
  async (req, res) => {
    // ... (implementation remains the same, consider using response utils)
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Błąd walidacji.', { errors: errors.mapped() });
    }

    const providerId = req.user.id;
    const { dayOfWeek, isOpen, openTime, closeTime } = req.body;

    try {
      const user = await User.findByPk(providerId);
      if (!user || user.role !== 'provider') {
        return sendErrorResponse(res, 403, 'Tylko usługodawcy mogą zarządzać godzinami otwarcia.');
      }

      if (isOpen && (!openTime || !closeTime)) {
        return sendErrorResponse(res, 400, 'Godzina otwarcia i zamknięcia są wymagane, gdy firma jest otwarta.');
      }

      let openingHour = await OpeningHours.findOne({ where: { providerId, dayOfWeek } });
      let message = '';
      let statusCode = 200;
      let action = '';

      if (openingHour) {
        // Update existing
        await OpeningHours.update(
          {
            isOpen: isOpen, // Assuming DB stores boolean/tinyint
            openTime: isOpen ? openTime : null,
            closeTime: isOpen ? closeTime : null,
            updatedAt: new Date(),
          },
          { where: { providerId, dayOfWeek } }
        );
        openingHour = await OpeningHours.findOne({ where: { providerId, dayOfWeek } }); // Re-fetch updated data
        message = 'Godziny otwarcia zaktualizowane pomyślnie.';
        action = 'update_opening_hours';
      } else {
        // Create new
        openingHour = await OpeningHours.create({
          providerId,
          dayOfWeek,
          isOpen: isOpen,
          openTime: isOpen ? openTime : null,
          closeTime: isOpen ? closeTime : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        message = 'Godziny otwarcia dodane pomyślnie.';
        statusCode = 201;
        action = 'add_opening_hours';
      }

       await logAuditAction(null, action, {
          userId: providerId,
          dayOfWeek,
          isOpen,
          openTime,
          closeTime,
          ip: req.ip,
        });

        await Notification.create({
          userId: providerId,
          message: `Godziny otwarcia dla ${dayOfWeek} zostały ${action === 'add_opening_hours' ? 'dodane' : 'zaktualizowane'}.`,
          type: 'account',
          isRead: false,
          createdAt: new Date(),
        }).catch(err => console.error("Failed to create notification:", err));


      sendSuccessResponse(res, statusCode, message, { openingHour });

    } catch (err) {
      console.error('Błąd dodawania/aktualizacji godzin otwarcia:', err);
      sendErrorResponse(res, 500, 'Błąd serwera podczas zapisywania godzin otwarcia.');
    }
  },
];

// Add a provider goal (Keep as is or move to providerController.js/settingsController.js)
exports.addGoal = [
  authenticate,
  ...validateAddGoal,
  async (req, res) => {
    // ... (implementation remains the same, consider using response utils)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Błąd walidacji.', { errors: errors.mapped() });
    }

    const providerId = req.user.id;
    const { goal } = req.body;

    try {
      const user = await User.findByPk(providerId);
      if (!user || user.role !== 'provider') {
        return sendErrorResponse(res, 403, 'Tylko usługodawcy mogą dodawać cele.');
      }

      const providerGoal = await ProviderGoal.create({
        providerId,
        goal,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await logAuditAction(null, 'add_goal', {
        userId: providerId,
        goalId: providerGoal.id,
        goal,
        ip: req.ip,
      });

       await Notification.create({
          userId: providerId,
          message: `Nowy cel biznesowy "${goal}" został dodany.`,
          type: 'account',
          isRead: false,
          createdAt: new Date(),
        }).catch(err => console.error("Failed to create notification:", err));

      sendSuccessResponse(res, 201, 'Cel dodany pomyślnie.', { providerGoal });
    } catch (err) {
      console.error('Błąd dodawania celu:', err);
      sendErrorResponse(res, 500, 'Błąd serwera podczas dodawania celu.');
    }
  },
];

// Import services from file (Keep as is or move to serviceController.js)
exports.importServices = [
  authenticate,
  ...validateImportServices,
  async (req, res) => {
    // ... (implementation remains the same, consider using response utils)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Błąd walidacji.', { errors: errors.mapped() });
    }

    const providerId = req.user.id;
    const { services } = req.body; // Expecting an array of { name, price }

    try {
      const user = await User.findByPk(providerId);
      if (!user || user.role !== 'provider') {
        return sendErrorResponse(res, 403, 'Tylko usługodawcy mogą importować usługi.');
      }

      const createdServices = [];
      const errorsList = [];

      // Use transaction for bulk import
      await sequelize.transaction(async (t) => {
        for (const service of services) {
          // Basic validation within the loop (could be more robust)
          if (!service.name || typeof service.name !== 'string' || service.name.trim() === '') {
            errorsList.push({ service: service.name || 'N/A', error: 'Missing or invalid service name' });
            continue; // Skip this service
          }
          if (service.price === undefined || isNaN(parseFloat(service.price)) || parseFloat(service.price) < 0) {
             errorsList.push({ service: service.name, error: 'Missing or invalid price' });
             continue; // Skip this service
          }

          try {
            const created = await Service.create(
              {
                providerId,
                name: service.name.trim(),
                price: parseFloat(service.price),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              { transaction: t }
            );
            createdServices.push(created);
          } catch (err) {
            // Catch potential DB errors during creation (e.g., constraints)
            errorsList.push({ service: service.name, error: err.message });
          }
        }
      }); // End transaction

      await logAuditAction(null, 'import_services', {
        userId: providerId,
        importedCount: createdServices.length,
        errorsCount: errorsList.length,
        ip: req.ip,
      });

      if (createdServices.length > 0) {
        await Notification.create({
          userId: providerId,
          message: `${createdServices.length} usług zostało pomyślnie zaimportowanych.`,
          type: 'account',
          isRead: false,
          createdAt: new Date(),
        }).catch(err => console.error("Failed to create notification:", err));
      }

      // Send response indicating success/partial success
      const message = `${createdServices.length} usług zaimportowano pomyślnie. ${errorsList.length > 0 ? `${errorsList.length} usług nie udało się zaimportować.` : ''}`;
      sendSuccessResponse(res, 200, message, {
        services: createdServices,
        errors: errorsList,
      });

    } catch (err) {
      console.error('Błąd importowania usług:', err);
      sendErrorResponse(res, 500, 'Wystąpił błąd serwera podczas importowania usług.');
    }
  },
];

// Make sure to export the controller functions if they are defined within this file
// module.exports = exports; // This line might already exist at the end
