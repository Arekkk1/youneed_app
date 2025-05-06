const express = require('express');
    const router = express.Router();
    const { Op } = require('sequelize');
    const { User, Service, Order, Feedback, OpeningHour, Address, Employee, Equipment } = require('../models'); // Ensure Employee, Equipment are imported
    const authenticate = require('../middleware/authenticate');
    const authMiddleware = require('../middleware/auth');
    const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
    const { logAuditAction } = require('../utils/audit'); // Ensure this path is correct
    const { body, validationResult, param } = require('express-validator');
    const sequelize = require('../config/database');
    const generateCsv = require('../utils/generateCsv');
    const generatePdf = require('../utils/generatePdf');
    const db = require('../models'); // Import db for sequelize functions

    // Helper to get user display name
    const getUserName = (user) => {
      if (!user) return 'N/A';
      if (user.companyName) return user.companyName;
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    };

    // --- GET Provider Dashboard Summary ---
    router.get('/dashboard/summary', authenticate, authMiddleware('provider'), async (req, res) => {
        const providerId = req.user.id;
        console.log(`[ProviderRoutes GET /dashboard/summary] START for provider ${providerId}`);
        try {
            const now = new Date();
            const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)); // Ensure new Date object
            const endOfDay = new Date(new Date(now).setHours(23, 59, 59, 999)); // Ensure new Date object

            // 1. Upcoming Orders Count
            console.log(`[ProviderRoutes GET /dashboard/summary] Fetching upcoming orders count...`);
            let upcomingOrdersCount;
            try {
                upcomingOrdersCount = await Order.count({
                    where: { providerId, startAt: { [Op.gte]: new Date() }, status: 'accepted' }
                });
                console.log(`[ProviderRoutes GET /dashboard/summary] Order.count result: ${upcomingOrdersCount}`);
            } catch (dbError) {
                console.error(`[ProviderRoutes GET /dashboard/summary] Database Error during Order.count:`, dbError);
                return sendErrorResponse(res, 500, 'Database error counting upcoming orders', dbError);
            }

            // 2. Today's Revenue
            console.log(`[ProviderRoutes GET /dashboard/summary] Fetching today's revenue...`);
            let todaysRevenue;
            try {
                todaysRevenue = await Order.sum('totalAmount', {
                    where: { providerId, startAt: { [Op.between]: [startOfDay, endOfDay] }, status: 'completed' }
                });
                 console.log(`[ProviderRoutes GET /dashboard/summary] Order.sum result: ${todaysRevenue}`);
                 // Handle potential null result from SUM if no orders match
                 todaysRevenue = todaysRevenue || 0;
            } catch (dbError) {
                 console.error(`[ProviderRoutes GET /dashboard/summary] Database Error during Order.sum:`, dbError);
                 return sendErrorResponse(res, 500, 'Database error calculating revenue', dbError);
            }


            // 3. New Messages Count (Placeholder)
            const newMessagesCount = 0;
            console.log(`[ProviderRoutes GET /dashboard/summary] New messages count = ${newMessagesCount} (placeholder)`);

            // 4. Average Rating
            console.log(`[ProviderRoutes GET /dashboard/summary] Fetching average rating...`);
            let averageRatingData;
            try {
                averageRatingData = await Feedback.findOne({
                    attributes: [[db.sequelize.fn('AVG', db.sequelize.col('rating')), 'averageRating']],
                    where: { providerId }
                });
                 console.log(`[ProviderRoutes GET /dashboard/summary] Feedback.findOne (AVG) result: ${JSON.stringify(averageRatingData)}`);
            } catch (dbError) {
                 console.error(`[ProviderRoutes GET /dashboard/summary] Database Error during Feedback.findOne (AVG):`, dbError);
                 // Don't fail the whole request for rating error, just set to N/A
                 averageRatingData = null; // Set to null to indicate error
                 console.warn(`[ProviderRoutes GET /dashboard/summary] Could not fetch average rating due to DB error.`);
            }


            const averageRatingValue = averageRatingData?.get('averageRating');
            const averageRating = averageRatingValue ? parseFloat(averageRatingValue).toFixed(1) : 'N/A';
            console.log(`[ProviderRoutes GET /dashboard/summary] Calculated average rating = ${averageRating}`);

            // Temporarily comment out audit log if it's suspected to cause issues
            // console.log(`[ProviderRoutes GET /dashboard/summary] Logging success audit action...`);
            // await logAuditAction(providerId, 'fetch_dashboard_summary_success', {}, req.ip);
            // console.log(`[ProviderRoutes GET /dashboard/summary] Audit action logged.`);

            console.log(`[ProviderRoutes GET /dashboard/summary] Successfully fetched summary for provider ${providerId}. Sending response.`);
            sendSuccessResponse(res, {
                upcomingOrders: upcomingOrdersCount || 0,
                todaysRevenue: todaysRevenue || 0,
                newMessages: newMessagesCount || 0,
                averageRating: averageRating
            }, 'Dashboard summary fetched successfully');
        } catch (err) {
            console.error("[ProviderRoutes GET /dashboard/summary] General Error:", err); // Log the full error
            // Temporarily comment out audit log if it's suspected to cause issues
            // await logAuditAction(providerId, 'fetch_dashboard_summary_failed', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Failed to fetch dashboard summary', err);
        }
        console.log(`[ProviderRoutes GET /dashboard/summary] END for provider ${providerId}`);
    });

    // --- GET Provider's Clients ---
    router.get('/clients', authenticate, authMiddleware('provider'), async (req, res) => {
        const providerId = req.user.id;
        console.log(`[ProviderRoutes GET /clients] START for provider ${providerId}`);
        try {
            console.log(`[ProviderRoutes GET /clients] Fetching distinct client IDs from orders...`);
            let orders;
            try {
                orders = await Order.findAll({
                    attributes: [[sequelize.fn('DISTINCT', sequelize.col('clientId')), 'clientId']],
                    where: { providerId },
                    raw: true,
                });
                console.log(`[ProviderRoutes GET /clients] Order.findAll (DISTINCT clientId) result count: ${orders.length}`);
            } catch (dbError) {
                 console.error(`[ProviderRoutes GET /clients] Database Error during Order.findAll (DISTINCT clientId):`, dbError);
                 return sendErrorResponse(res, 500, 'Database error fetching client IDs', dbError);
            }

            const clientIds = orders.map(order => order.clientId).filter(id => id != null);
            console.log(`[ProviderRoutes GET /clients] Found client IDs: ${clientIds.join(', ')}`);

            if (clientIds.length === 0) {
                console.log(`[ProviderRoutes GET /clients] No clients found.`);
                return sendSuccessResponse(res, [], 'No clients found for this provider.');
            }

            console.log(`[ProviderRoutes GET /clients] Fetching client details...`);
            let clients;
            try {
                clients = await User.findAll({
                    where: { id: { [Op.in]: clientIds } },
                    attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture', 'createdAt'],
                });
                 console.log(`[ProviderRoutes GET /clients] User.findAll (client details) result count: ${clients.length}`);
            } catch (dbError) {
                 console.error(`[ProviderRoutes GET /clients] Database Error during User.findAll (client details):`, dbError);
                 return sendErrorResponse(res, 500, 'Database error fetching client details', dbError);
            }


            // await logAuditAction(providerId, 'fetch_provider_clients_success', { count: clients.length }, req.ip);
            console.log(`[ProviderRoutes GET /clients] Successfully fetched clients for provider ${providerId}. Sending response.`);
            sendSuccessResponse(res, clients, 'Clients fetched successfully');
        } catch (err) {
            console.error("[ProviderRoutes GET /clients] General Error:", err);
            // await logAuditAction(providerId, 'fetch_provider_clients_failed', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Failed to fetch clients', err);
        }
         console.log(`[ProviderRoutes GET /clients] END for provider ${providerId}`);
    });

    // --- GET Provider Subscription Status ---
    router.get('/subscription', authenticate, authMiddleware('provider'), async (req, res) => {
        const providerId = req.user.id;
        console.log(`[ProviderRoutes GET /subscription] START for provider ${providerId}`);
        try {
            console.log(`[ProviderRoutes GET /subscription] Fetching provider data...`);
            let provider;
            try {
                provider = await User.findByPk(providerId, {
                    attributes: ['id', 'subscriptionStatus', 'subscriptionPrice']
                });
                console.log(`[ProviderRoutes GET /subscription] User.findByPk result:`, provider ? provider.toJSON() : 'Not Found');
            } catch (dbError) {
                 console.error(`[ProviderRoutes GET /subscription] Database Error during User.findByPk:`, dbError);
                 return sendErrorResponse(res, 500, 'Database error fetching subscription data', dbError);
            }


            if (!provider) {
                console.warn(`[ProviderRoutes GET /subscription] Provider ${providerId} not found.`);
                return sendErrorResponse(res, 404, 'Provider not found');
            }

            // await logAuditAction(providerId, 'fetch_subscription_status_success', { status: provider.subscriptionStatus }, req.ip);
            console.log(`[ProviderRoutes GET /subscription] Successfully fetched subscription for provider ${providerId}. Sending response.`);
            sendSuccessResponse(res, {
                status: provider.subscriptionStatus,
                price: provider.subscriptionPrice
            }, 'Subscription status fetched successfully');
        } catch (err) {
            console.error("[ProviderRoutes GET /subscription] General Error:", err);
            // await logAuditAction(providerId, 'fetch_subscription_status_failed', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Failed to fetch subscription status', err);
        }
        console.log(`[ProviderRoutes GET /subscription] END for provider ${providerId}`);
    });


    // --- GET Services for a specific Provider ID ---
    router.get('/:providerId/services',
        [ param('providerId').isInt({ gt: 0 }).withMessage('Valid Provider ID is required') ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return sendErrorResponse(res, 400, 'Validation Error', errors.array());
            }
            const providerId = parseInt(req.params.providerId, 10);
            console.log(`[ProviderRoutes GET /:providerId/services] START for provider ${providerId}`);
            try {
                console.log(`[ProviderRoutes GET /:providerId/services] Checking if provider ${providerId} exists...`);
                let provider;
                try {
                    provider = await User.findOne({ where: { id: providerId, role: 'provider' } });
                    console.log(`[ProviderRoutes GET /:providerId/services] User.findOne result:`, provider ? 'Found' : 'Not Found');
                } catch (dbError) {
                     console.error(`[ProviderRoutes GET /:providerId/services] Database Error during User.findOne:`, dbError);
                     return sendErrorResponse(res, 500, 'Database error checking provider existence', dbError);
                }

                if (!provider) {
                    console.warn(`[ProviderRoutes GET /:providerId/services] Provider ${providerId} not found.`);
                    return sendErrorResponse(res, 404, 'Provider not found');
                }
                console.log(`[ProviderRoutes GET /:providerId/services] Provider found. Fetching services...`);
                let services;
                try {
                    services = await Service.findAll({
                        where: { providerId },
                        order: [['name', 'ASC']]
                    });
                    console.log(`[ProviderRoutes GET /:providerId/services] Service.findAll result count: ${services.length}`);
                } catch (dbError) {
                     console.error(`[ProviderRoutes GET /:providerId/services] Database Error during Service.findAll:`, dbError);
                     return sendErrorResponse(res, 500, 'Database error fetching services', dbError);
                }

                console.log(`[ProviderRoutes GET /:providerId/services] Successfully fetched services for provider ${providerId}. Sending response.`);
                sendSuccessResponse(res, services, 'Services fetched successfully');
            } catch (err) {
                console.error(`[ProviderRoutes GET /:providerId/services] General Error for provider ${providerId}:`, err);
                sendErrorResponse(res, 500, 'Failed to fetch services', err);
            }
            console.log(`[ProviderRoutes GET /:providerId/services] END for provider ${providerId}`);
        }
    );


    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // --- GET Provider Opening Hours ---
    router.get('/opening-hours', authenticate, authMiddleware('provider'), async (req, res) => {
        const providerId = req.user.id;
        console.log(`[ProviderRoutes GET /opening-hours] START for provider ${providerId}`);
        try {
            console.log(`[ProviderRoutes GET /opening-hours] Fetching hours...`);
            let hours;
            try {
                hours = await OpeningHour.findAll({
                    where: { providerId },
                    order: [['dayOfWeek', 'ASC']]
                });
                console.log(`[ProviderRoutes GET /opening-hours] OpeningHour.findAll result count: ${hours.length}`);
            } catch (dbError) {
                console.error(`[ProviderRoutes GET /opening-hours] Database Error during OpeningHour.findAll:`, dbError);
                return sendErrorResponse(res, 500, 'Database error fetching opening hours', dbError);
            }
    
            // Transform response to match frontend expectations
            const formattedHours = hours.map(hour => ({
                dayOfWeek: daysOfWeek.indexOf(hour.dayOfWeek), // Convert ENUM to integer
                isClosed: !hour.isOpen,
                startTime: hour.openTime ? hour.openTime.toString().substring(0, 5) : null, // HH:MM
                endTime: hour.closeTime ? hour.closeTime.toString().substring(0, 5) : null // HH:MM
            }));
    
            console.log(`[ProviderRoutes GET /opening-hours] Successfully fetched hours for provider ${providerId}. Sending response.`);
            sendSuccessResponse(res, formattedHours, 'Opening hours fetched successfully');
        } catch (err) {
            console.error("[ProviderRoutes GET /opening-hours] General Error:", err);
            sendErrorResponse(res, 500, 'Failed to fetch opening hours', err);
        }
        console.log(`[ProviderRoutes GET /opening-hours] END for provider ${providerId}`);
    });
    
    // --- PUT Provider Opening Hours ---
    router.put('/opening-hours',
        authenticate,
        authMiddleware('provider'),
        [
            body().isArray().withMessage('Opening hours must be an array'),
            body('*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Invalid day of week'),
            body('*.startTime').optional({ nullable: true }).matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid start time format (HH:MM)'),
            body('*.endTime').optional({ nullable: true }).matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid end time format (HH:MM)'),
            body('*.isClosed').isBoolean().withMessage('isClosed must be a boolean')
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return sendErrorResponse(res, 400, 'Validation Error', errors.array());
            }
            const providerId = req.user.id;
            const openingHoursData = req.body;
            console.log(`[ProviderRoutes PUT /opening-hours] START for provider ${providerId}`);
            const t = await sequelize.transaction();
            try {
                console.log(`[ProviderRoutes PUT /opening-hours] Deleting existing hours within transaction...`);
                await OpeningHour.destroy({ where: { providerId }, transaction: t });
                console.log(`[ProviderRoutes PUT /opening-hours] Existing hours deleted.`);
    
                const hoursToCreate = openingHoursData.map(hour => ({
                    providerId,
                    dayOfWeek: daysOfWeek[hour.dayOfWeek], // Convert integer to ENUM string
                    isOpen: !hour.isClosed, // Invert for database
                    openTime: hour.isClosed ? null : hour.startTime, // Map to database column
                    closeTime: hour.isClosed ? null : hour.endTime // Map to database column
                }));
    
                if (hoursToCreate.length > 0) {
                    console.log(`[ProviderRoutes PUT /opening-hours] Creating ${hoursToCreate.length} new records within transaction...`);
                    await OpeningHour.bulkCreate(hoursToCreate, { transaction: t });
                    console.log(`[ProviderRoutes PUT /opening-hours] New records created.`);
                }
    
                console.log(`[ProviderRoutes PUT /opening-hours] Committing transaction...`);
                await t.commit();
                console.log(`[ProviderRoutes PUT /opening-hours] Transaction committed.`);
    
                console.log(`[ProviderRoutes PUT /opening-hours] Fetching newly created hours...`);
                const newHours = await OpeningHour.findAll({ where: { providerId }, order: [['dayOfWeek', 'ASC']] });
                
                // Transform response to match frontend expectations
                const formattedNewHours = newHours.map(hour => ({
                    dayOfWeek: daysOfWeek.indexOf(hour.dayOfWeek), // Convert ENUM to integer
                    isClosed: !hour.isOpen,
                    startTime: hour.openTime ? hour.openTime.toString().substring(0, 5) : null, // HH:MM
                    endTime: hour.closeTime ? hour.closeTime.toString().substring(0, 5) : null // HH:MM
                }));
    
                console.log(`[ProviderRoutes PUT /opening-hours] Successfully updated hours for provider ${providerId}. Sending response.`);
                sendSuccessResponse(res, formattedNewHours, 'Opening hours updated successfully');
            } catch (err) {
                console.error("[ProviderRoutes PUT /opening-hours] Error during transaction:", err);
                try {
                    console.log("[ProviderRoutes PUT /opening-hours] Rolling back transaction...");
                    await t.rollback();
                    console.log("[ProviderRoutes PUT /opening-hours] Transaction rolled back.");
                } catch (rollbackError) {
                    console.error("[ProviderRoutes PUT /opening-hours] Error rolling back transaction:", rollbackError);
                }
                sendErrorResponse(res, 500, 'Failed to update opening hours', err);
            }
            console.log(`[ProviderRoutes PUT /opening-hours] END for provider ${providerId}`);
        }
    );
    

    // --- GET Provider Employees ---
    router.get('/employees', authenticate, authMiddleware('provider'), async (req, res) => {
        const providerId = req.user.id;
        console.log(`[ProviderRoutes GET /employees] START for provider ${providerId}`);
        try {
            console.log(`[ProviderRoutes GET /employees] Fetching employees...`);
            let employees;
            try {
                employees = await Employee.findAll({ where: { providerId } });
                console.log(`[ProviderRoutes GET /employees] Employee.findAll result count: ${employees.length}`);
            } catch (dbError) {
                 console.error(`[ProviderRoutes GET /employees] Database Error during Employee.findAll:`, dbError);
                 return sendErrorResponse(res, 500, 'Database error fetching employees', dbError);
            }

            // await logAuditAction(providerId, 'fetch_employees_success', { count: employees.length }, req.ip);
            console.log(`[ProviderRoutes GET /employees] Successfully fetched employees for provider ${providerId}. Sending response.`);
            sendSuccessResponse(res, employees, 'Employees fetched successfully');
        } catch (err) {
            console.error(`[ProviderRoutes GET /employees] General Error for provider ${providerId}:`, err); // Log full error
            // await logAuditAction(providerId, 'fetch_employees_failed', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Failed to fetch employees', err);
        }
        console.log(`[ProviderRoutes GET /employees] END for provider ${providerId}`);
    });

    // --- POST Add Provider Employee ---
    router.post('/employee',
        authenticate,
        authMiddleware('provider'),
        [ body('name').trim().notEmpty().withMessage('Employee name is required') ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return sendErrorResponse(res, 400, 'Validation Error', errors.array());
            }
            const providerId = req.user.id;
            const { name } = req.body;
            console.log(`[ProviderRoutes POST /employee] START for provider ${providerId} with name: ${name}`);
            try {
                console.log(`[ProviderRoutes POST /employee] Creating employee...`);
                let employee;
                try {
                    employee = await Employee.create({ name, providerId });
                    console.log(`[ProviderRoutes POST /employee] Employee.create result:`, employee.toJSON());
                } catch (dbError) {
                     console.error(`[ProviderRoutes POST /employee] Database Error during Employee.create:`, dbError);
                     return sendErrorResponse(res, 500, 'Database error adding employee', dbError);
                }

                // await logAuditAction(providerId, 'create_employee_success', { employeeId: employee.id, name }, req.ip);
                console.log(`[ProviderRoutes POST /employee] Successfully added employee for provider ${providerId}. Sending response.`);
                sendSuccessResponse(res, employee, 'Employee added successfully', 201);
            } catch (err) {
                console.error(`[ProviderRoutes POST /employee] General Error for provider ${providerId}:`, err);
                // await logAuditAction(providerId, 'create_employee_failed', { name, error: err.message }, req.ip);
                sendErrorResponse(res, 500, 'Failed to add employee', err);
            }
            console.log(`[ProviderRoutes POST /employee] END for provider ${providerId}`);
        }
    );

     // --- PUT Update Provider Employee ---
     router.put('/employee/:employeeId',
         authenticate,
         authMiddleware('provider'),
         [
             param('employeeId').isInt({ gt: 0 }).withMessage('Valid Employee ID is required'),
             body('name').trim().notEmpty().withMessage('Employee name is required'),
         ],
         async (req, res) => {
             const errors = validationResult(req);
             if (!errors.isEmpty()) {
                 return sendErrorResponse(res, 400, 'Validation Error', errors.array());
             }
             const providerId = req.user.id;
             const employeeId = parseInt(req.params.employeeId, 10);
             const { name } = req.body;
             console.log(`[ProviderRoutes PUT /employee/:employeeId] START for provider ${providerId}, employee ${employeeId} with name: ${name}`);
             try {
                 console.log(`[ProviderRoutes PUT /employee/:employeeId] Finding employee ${employeeId}...`);
                 let employee;
                 try {
                     employee = await Employee.findOne({ where: { id: employeeId, providerId } });
                     console.log(`[ProviderRoutes PUT /employee/:employeeId] Employee.findOne result:`, employee ? 'Found' : 'Not Found');
                 } catch (dbError) {
                      console.error(`[ProviderRoutes PUT /employee/:employeeId] Database Error during Employee.findOne:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error finding employee', dbError);
                 }

                 if (!employee) {
                     console.warn(`[ProviderRoutes PUT /employee/:employeeId] Employee ${employeeId} not found or access denied.`);
                     return sendErrorResponse(res, 404, 'Employee not found or access denied.');
                 }
                 console.log(`[ProviderRoutes PUT /employee/:employeeId] Employee found. Updating name...`);
                 employee.name = name;
                 try {
                     await employee.save();
                     console.log(`[ProviderRoutes PUT /employee/:employeeId] Employee.save successful.`);
                 } catch (dbError) {
                      console.error(`[ProviderRoutes PUT /employee/:employeeId] Database Error during Employee.save:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error updating employee', dbError);
                 }

                 // await logAuditAction(providerId, 'update_employee_success', { employeeId, name }, req.ip);
                 console.log(`[ProviderRoutes PUT /employee/:employeeId] Successfully updated employee ${employeeId}. Sending response.`);
                 sendSuccessResponse(res, employee, 'Employee updated successfully');
             } catch (err) {
                 console.error(`[ProviderRoutes PUT /employee/:employeeId] General Error for employee ${employeeId}:`, err);
                 // await logAuditAction(providerId, 'update_employee_failed', { employeeId, name, error: err.message }, req.ip);
                 sendErrorResponse(res, 500, 'Failed to update employee', err);
             }
             console.log(`[ProviderRoutes PUT /employee/:employeeId] END for provider ${providerId}, employee ${employeeId}`);
         }
     );

     // --- DELETE Provider Employee ---
     router.delete('/employee/:employeeId',
         authenticate,
         authMiddleware('provider'),
         [ param('employeeId').isInt({ gt: 0 }).withMessage('Valid Employee ID is required') ],
         async (req, res) => {
             const errors = validationResult(req);
             if (!errors.isEmpty()) {
                 return sendErrorResponse(res, 400, 'Validation Error', errors.array());
             }
             const providerId = req.user.id;
             const employeeId = parseInt(req.params.employeeId, 10);
             console.log(`[ProviderRoutes DELETE /employee/:employeeId] START for provider ${providerId}, employee ${employeeId}`);
             try {
                 console.log(`[ProviderRoutes DELETE /employee/:employeeId] Finding employee ${employeeId}...`);
                 let employee;
                 try {
                     employee = await Employee.findOne({ where: { id: employeeId, providerId } });
                     console.log(`[ProviderRoutes DELETE /employee/:employeeId] Employee.findOne result:`, employee ? 'Found' : 'Not Found');
                 } catch (dbError) {
                      console.error(`[ProviderRoutes DELETE /employee/:employeeId] Database Error during Employee.findOne:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error finding employee', dbError);
                 }

                 if (!employee) {
                     console.warn(`[ProviderRoutes DELETE /employee/:employeeId] Employee ${employeeId} not found or access denied.`);
                     return sendErrorResponse(res, 404, 'Employee not found or access denied.');
                 }
                 const employeeName = employee.name; // Store name for logging before destroying
                 console.log(`[ProviderRoutes DELETE /employee/:employeeId] Employee found. Deleting...`);
                 try {
                     await employee.destroy();
                     console.log(`[ProviderRoutes DELETE /employee/:employeeId] Employee.destroy successful.`);
                 } catch (dbError) {
                      console.error(`[ProviderRoutes DELETE /employee/:employeeId] Database Error during Employee.destroy:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error deleting employee', dbError);
                 }

                 // await logAuditAction(providerId, 'delete_employee_success', { employeeId, name: employeeName }, req.ip);
                 console.log(`[ProviderRoutes DELETE /employee/:employeeId] Successfully deleted employee ${employeeId}. Sending response.`);
                 sendSuccessResponse(res, null, 'Employee deleted successfully');
             } catch (err) {
                 console.error(`[ProviderRoutes DELETE /employee/:employeeId] General Error for employee ${employeeId}:`, err);
                 // await logAuditAction(providerId, 'delete_employee_failed', { employeeId, error: err.message }, req.ip);
                 sendErrorResponse(res, 500, 'Failed to delete employee', err);
             }
             console.log(`[ProviderRoutes DELETE /employee/:employeeId] END for provider ${providerId}, employee ${employeeId}`);
         }
     );


    // --- GET Provider Equipment ---
    router.get('/equipment', authenticate, authMiddleware('provider'), async (req, res) => {
        const providerId = req.user.id;
        console.log(`[ProviderRoutes GET /equipment] START for provider ${providerId}`);
        try {
            console.log(`[ProviderRoutes GET /equipment] Fetching equipment...`);
            let equipment;
            try {
                equipment = await Equipment.findAll({ where: { providerId } });
                console.log(`[ProviderRoutes GET /equipment] Equipment.findAll result count: ${equipment.length}`);
            } catch (dbError) {
                 console.error(`[ProviderRoutes GET /equipment] Database Error during Equipment.findAll:`, dbError);
                 return sendErrorResponse(res, 500, 'Database error fetching equipment', dbError);
            }

            // await logAuditAction(providerId, 'fetch_equipment_success', { count: equipment.length }, req.ip);
            console.log(`[ProviderRoutes GET /equipment] Successfully fetched equipment for provider ${providerId}. Sending response.`);
            sendSuccessResponse(res, equipment, 'Equipment fetched successfully');
        } catch (err) {
            console.error(`[ProviderRoutes GET /equipment] General Error for provider ${providerId}:`, err); // Log full error
            // await logAuditAction(providerId, 'fetch_equipment_failed', { error: err.message }, req.ip);
            sendErrorResponse(res, 500, 'Failed to fetch equipment', err);
        }
        console.log(`[ProviderRoutes GET /equipment] END for provider ${providerId}`);
    });

    // --- POST Add Provider Equipment ---
    router.post('/equipment',
        authenticate,
        authMiddleware('provider'),
        [ body('name').trim().notEmpty().withMessage('Equipment name is required') ], // Add validation for other fields if needed (e.g., quantity, description)
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return sendErrorResponse(res, 400, 'Validation Error', errors.array());
            }
            const providerId = req.user.id;
            // Include other fields from req.body if they exist (e.g., quantity, description)
            const { name, quantity, description } = req.body;
            console.log(`[ProviderRoutes POST /equipment] START for provider ${providerId} with data:`, req.body);
            try {
                console.log(`[ProviderRoutes POST /equipment] Creating equipment...`);
                let equipmentItem;
                try {
                    // Pass all relevant fields to create
                    equipmentItem = await Equipment.create({ name, providerId, quantity, description });
                    console.log(`[ProviderRoutes POST /equipment] Equipment.create result:`, equipmentItem.toJSON());
                } catch (dbError) {
                     console.error(`[ProviderRoutes POST /equipment] Database Error during Equipment.create:`, dbError);
                     return sendErrorResponse(res, 500, 'Database error adding equipment', dbError);
                }

                // await logAuditAction(providerId, 'create_equipment_success', { equipmentId: equipmentItem.id, name }, req.ip);
                console.log(`[ProviderRoutes POST /equipment] Successfully added equipment for provider ${providerId}. Sending response.`);
                sendSuccessResponse(res, equipmentItem, 'Equipment added successfully', 201);
            } catch (err) {
                console.error(`[ProviderRoutes POST /equipment] General Error for provider ${providerId}:`, err);
                // await logAuditAction(providerId, 'create_equipment_failed', { name, error: err.message }, req.ip);
                sendErrorResponse(res, 500, 'Failed to add equipment', err);
            }
            console.log(`[ProviderRoutes POST /equipment] END for provider ${providerId}`);
        }
    );

     // --- PUT Update Provider Equipment ---
     router.put('/equipment/:equipmentId',
         authenticate,
         authMiddleware('provider'),
         [
             param('equipmentId').isInt({ gt: 0 }).withMessage('Valid Equipment ID is required'),
             body('name').trim().notEmpty().withMessage('Equipment name is required'),
              // Add validation for other fields if needed
             body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
             body('description').optional().isString().withMessage('Description must be a string'),
         ],
         async (req, res) => {
             const errors = validationResult(req);
             if (!errors.isEmpty()) {
                 return sendErrorResponse(res, 400, 'Validation Error', errors.array());
             }
             const providerId = req.user.id;
             const equipmentId = parseInt(req.params.equipmentId, 10);
             const { name, quantity, description } = req.body; // Get updated fields
             console.log(`[ProviderRoutes PUT /equipment/:equipmentId] START for provider ${providerId}, equipment ${equipmentId} with data:`, req.body);
             try {
                 console.log(`[ProviderRoutes PUT /equipment/:equipmentId] Finding equipment ${equipmentId}...`);
                 let equipmentItem;
                 try {
                     equipmentItem = await Equipment.findOne({ where: { id: equipmentId, providerId } });
                     console.log(`[ProviderRoutes PUT /equipment/:equipmentId] Equipment.findOne result:`, equipmentItem ? 'Found' : 'Not Found');
                 } catch (dbError) {
                      console.error(`[ProviderRoutes PUT /equipment/:equipmentId] Database Error during Equipment.findOne:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error finding equipment', dbError);
                 }

                 if (!equipmentItem) {
                     console.warn(`[ProviderRoutes PUT /equipment/:equipmentId] Equipment ${equipmentId} not found or access denied.`);
                     return sendErrorResponse(res, 404, 'Equipment not found or access denied.');
                 }
                 console.log(`[ProviderRoutes PUT /equipment/:equipmentId] Equipment found. Updating fields...`);
                 // Update fields that were provided
                 equipmentItem.name = name;
                 if (quantity !== undefined) equipmentItem.quantity = quantity;
                 if (description !== undefined) equipmentItem.description = description;

                 try {
                     await equipmentItem.save();
                     console.log(`[ProviderRoutes PUT /equipment/:equipmentId] Equipment.save successful.`);
                 } catch (dbError) {
                      console.error(`[ProviderRoutes PUT /equipment/:equipmentId] Database Error during Equipment.save:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error updating equipment', dbError);
                 }

                 // await logAuditAction(providerId, 'update_equipment_success', { equipmentId, name }, req.ip);
                 console.log(`[ProviderRoutes PUT /equipment/:equipmentId] Successfully updated equipment ${equipmentId}. Sending response.`);
                 sendSuccessResponse(res, equipmentItem, 'Equipment updated successfully');
             } catch (err) {
                 console.error(`[ProviderRoutes PUT /equipment/:equipmentId] General Error for equipment ${equipmentId}:`, err);
                 // await logAuditAction(providerId, 'update_equipment_failed', { equipmentId, name, error: err.message }, req.ip);
                 sendErrorResponse(res, 500, 'Failed to update equipment', err);
             }
             console.log(`[ProviderRoutes PUT /equipment/:equipmentId] END for provider ${providerId}, equipment ${equipmentId}`);
         }
     );

     // --- DELETE Provider Equipment ---
     router.delete('/equipment/:equipmentId',
         authenticate,
         authMiddleware('provider'),
         [ param('equipmentId').isInt({ gt: 0 }).withMessage('Valid Equipment ID is required') ],
         async (req, res) => {
             const errors = validationResult(req);
             if (!errors.isEmpty()) {
                 return sendErrorResponse(res, 400, 'Validation Error', errors.array());
             }
             const providerId = req.user.id;
             const equipmentId = parseInt(req.params.equipmentId, 10);
             console.log(`[ProviderRoutes DELETE /equipment/:equipmentId] START for provider ${providerId}, equipment ${equipmentId}`);
             try {
                 console.log(`[ProviderRoutes DELETE /equipment/:equipmentId] Finding equipment ${equipmentId}...`);
                 let equipmentItem;
                 try {
                     equipmentItem = await Equipment.findOne({ where: { id: equipmentId, providerId } });
                     console.log(`[ProviderRoutes DELETE /equipment/:equipmentId] Equipment.findOne result:`, equipmentItem ? 'Found' : 'Not Found');
                 } catch (dbError) {
                      console.error(`[ProviderRoutes DELETE /equipment/:equipmentId] Database Error during Equipment.findOne:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error finding equipment', dbError);
                 }

                 if (!equipmentItem) {
                     console.warn(`[ProviderRoutes DELETE /equipment/:equipmentId] Equipment ${equipmentId} not found or access denied.`);
                     return sendErrorResponse(res, 404, 'Equipment not found or access denied.');
                 }
                 const equipmentName = equipmentItem.name; // Store name for logging
                 console.log(`[ProviderRoutes DELETE /equipment/:equipmentId] Equipment found. Deleting...`);
                 try {
                     await equipmentItem.destroy();
                     console.log(`[ProviderRoutes DELETE /equipment/:equipmentId] Equipment.destroy successful.`);
                 } catch (dbError) {
                      console.error(`[ProviderRoutes DELETE /equipment/:equipmentId] Database Error during Equipment.destroy:`, dbError);
                      return sendErrorResponse(res, 500, 'Database error deleting equipment', dbError);
                 }

                 // await logAuditAction(providerId, 'delete_equipment_success', { equipmentId, name: equipmentName }, req.ip);
                 console.log(`[ProviderRoutes DELETE /equipment/:equipmentId] Successfully deleted equipment ${equipmentId}. Sending response.`);
                 sendSuccessResponse(res, null, 'Equipment deleted successfully');
             } catch (err) {
                 console.error(`[ProviderRoutes DELETE /equipment/:equipmentId] General Error for equipment ${equipmentId}:`, err);
                 // await logAuditAction(providerId, 'delete_equipment_failed', { equipmentId, error: err.message }, req.ip);
                 sendErrorResponse(res, 500, 'Failed to delete equipment', err);
             }
             console.log(`[ProviderRoutes DELETE /equipment/:equipmentId] END for provider ${providerId}, equipment ${equipmentId}`);
         }
     );


    // --- POST Generate Provider Report ---
    router.post('/reports/generate',
        authenticate,
        authMiddleware('provider'),
        [
            body('format').isIn(['csv', 'pdf']).withMessage('Invalid format specified (must be csv or pdf)'),
            body('startDate').isISO8601().toDate().withMessage('Invalid start date'),
            body('endDate').isISO8601().toDate().withMessage('Invalid end date')
                .custom((endDate, { req }) => {
                    if (endDate < req.body.startDate) {
                        throw new Error('End date must be after start date');
                    }
                    return true;
                }),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return sendErrorResponse(res, 400, 'Validation Error', errors.array());
            }
            const providerId = req.user.id;
            const { format, startDate, endDate } = req.body;
            console.log(`[ProviderRoutes POST /reports/generate] START for provider ${providerId}, format: ${format}`);
            try {
                console.log(`[ProviderRoutes POST /reports/generate] Fetching completed orders between ${startDate.toISOString()} and ${endDate.toISOString()}...`);
                let orders;
                try {
                    orders = await Order.findAll({
                        where: {
                            providerId,
                            status: 'completed',
                            updatedAt: { [Op.between]: [startDate, endDate] }
                        },
                        include: [
                            { model: User, as: 'Client', attributes: ['firstName', 'lastName', 'email', 'companyName'] },
                            { model: Service, as: 'Service', attributes: ['name', 'price'] }
                        ],
                        order: [['updatedAt', 'ASC']]
                    });
                    console.log(`[ProviderRoutes POST /reports/generate] Order.findAll result count: ${orders.length}`);
                } catch (dbError) {
                     console.error(`[ProviderRoutes POST /reports/generate] Database Error during Order.findAll:`, dbError);
                     return sendErrorResponse(res, 500, 'Database error fetching orders for report', dbError);
                }


                if (orders.length === 0) {
                    console.log(`[ProviderRoutes POST /reports/generate] No data found for the selected period.`);
                    return sendSuccessResponse(res, null, 'No data found for the selected period.');
                }

                const reportData = orders.map(order => ({
                    'Order ID': order.id,
                    'Date': order.updatedAt.toLocaleDateString('pl-PL'),
                    'Client Name': getUserName(order.Client),
                    'Client Email': order.Client?.email || 'N/A',
                    'Service Name': order.Service?.name || 'N/A',
                    'Price': order.totalAmount || order.Service?.price || 'N/A',
                }));

                if (format === 'csv') {
                    const fileName = `report_${providerId}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`;
                    console.log(`[ProviderRoutes POST /reports/generate] Generating CSV: ${fileName}`);
                    const csvData = generateCsv(reportData);
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                    res.status(200).send(csvData);
                    console.log(`[ProviderRoutes POST /reports/generate] CSV sent.`);

                } else if (format === 'pdf') {
                    const fileName = `report_${providerId}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
                    console.log(`[ProviderRoutes POST /reports/generate] Generating PDF: ${fileName}`);
                    const pdfDoc = await generatePdf(reportData, {
                         providerName: getUserName(req.user),
                         startDate: startDate.toLocaleDateString('pl-PL'),
                         endDate: endDate.toLocaleDateString('pl-PL')
                    });
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                    pdfDoc.pipe(res);
                    pdfDoc.end();
                    console.log(`[ProviderRoutes POST /reports/generate] PDF sent.`);

                } else {
                    console.warn(`[ProviderRoutes POST /reports/generate] Invalid format specified: ${format}`);
                    return sendErrorResponse(res, 400, 'Invalid format specified');
                }

                // await logAuditAction(providerId, 'generate_report_success', { format, startDate, endDate, count: orders.length }, req.ip);

            } catch (err) {
                console.error("[ProviderRoutes POST /reports/generate] General Error generating report:", err);
                // await logAuditAction(providerId, 'generate_report_failed', { format, startDate, endDate, error: err.message }, req.ip);
                if (!res.headersSent) {
                    sendErrorResponse(res, 500, 'Failed to generate report', err);
                }
            }
            console.log(`[ProviderRoutes POST /reports/generate] END for provider ${providerId}`);
        }
    );


    module.exports = router;
