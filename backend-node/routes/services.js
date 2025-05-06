require('dotenv').config();
        const express = require('express');
        const cors = require('cors');
        const passport = require('passport');
        const path = require('path');
        const db = require('./models'); // Import Sequelize instance and models
        const { logAuditAction } = require('./utils/audit'); // Import audit logger

        // Import Routes
        const authRoutes = require('./routes/auth');
        const profileRoutes = require('./routes/profileRoutes');
        const providerRoutes = require('./routes/providerRoutes');
        const clientRoutes = require('./routes/clientRoutes');
        const adminRoutes = require('./routes/adminRoutes');
        const commonRoutes = require('./routes/commonRoutes');
        const orderRoutes = require('./routes/orderRoutes');
        const serviceRoutes = require('./routes/serviceRoutes');
        const feedbackRoutes = require('./routes/feedbackRoutes');
        const notificationRoutes = require('./routes/notificationRoutes'); // <<<--- ADDED IMPORT
        const analyticsRoutes = require('./routes/analyticsRoutes'); // Added
        const searchRoutes = require('./routes/searchRoutes'); // Added
        const smsRoutes = require('./routes/sms'); // Added
        const emailVerificationRoutes = require('./routes/emailVerification'); // Added
        const eventRoutes = require('./routes/eventRoutes');

        const app = express();

        // Passport Config (Ensure this function call is correct)
        require('./config/passport')(passport); // Pass passport instance to config

        // CORS Configuration
        const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
        const corsOptions = {
          origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
              const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
              console.warn(`CORS blocked for origin: ${origin}`); // Log blocked origins
              return callback(new Error(msg), false);
            }
            return callback(null, true);
          },
          credentials: true, // Allow cookies/authorization headers
        };
        // --- TEMPORARY HARDCODED CORS FOR DEVELOPMENT ---
        // app.use(cors({
        //     origin: 'http://localhost:5173', // Allow only your frontend origin
        //     credentials: true
        // }));
        // --- END TEMPORARY ---
        // Use the dynamic CORS options
        app.use(cors(corsOptions));


        // Middlewares
        app.use(express.json()); // For parsing application/json
        app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
        app.use(passport.initialize()); // Initialize Passport

        // Serve static files from the 'uploads' directory
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

        // API Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/profile', profileRoutes);
        app.use('/api/provider', providerRoutes);
        app.use('/api/client', clientRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/common', commonRoutes);
        app.use('/api/orders', orderRoutes);
        app.use('/api/services', serviceRoutes);
        app.use('/api/feedback', feedbackRoutes);
        app.use('/api/notifications', notificationRoutes); // <<<--- ADDED ROUTE MOUNTING
        app.use('/api/analytics', analyticsRoutes); // Added
        app.use('/api/search', searchRoutes); // Added
        app.use('/api/sms', smsRoutes); // Added
        app.use('/api/email', emailVerificationRoutes); // Added
        app.use('/api/events', eventRoutes);

        // Basic Route
        app.get('/', (req, res) => {
          res.send('YouNeed Backend is running!');
        });

        // Global Error Handler (Basic)
        app.use((err, req, res, next) => {
          console.error("Global Error Handler:", err.stack);
          // Log error using audit logger if appropriate
          logAuditAction(req.user?.id || null, 'server_error', { path: req.path, error: err.message, ip: req.ip }).catch(console.error);
          res.status(err.status || 500).json({
            status: 'error',
            message: err.message || 'Wystąpił błąd serwera.',
            // Optionally include stack trace in development
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
          });
        });


        // Database Synchronization and Server Start
        const PORT = process.env.PORT || 5000;

        db.sequelize.sync({ alter: process.env.NODE_ENV !== 'production' }) // Use alter cautiously in dev, avoid in prod
          .then(() => {
            console.log('Database synchronized successfully.');
            app.listen(PORT, () => {
              console.log(`Server is running on port ${PORT}`);
              console.log(`Frontend URL allowed by CORS: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            });
          })
          .catch((err) => {
            console.error('Unable to synchronize database:', err);
            // Log sync error using audit logger
            logAuditAction(null, 'db_sync_error', { error: err.message }).catch(console.error);
            process.exit(1); // Exit if DB sync fails
          });

        module.exports = app; // Export app for testing or other purposes if needed
