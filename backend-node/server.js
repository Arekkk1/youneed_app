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
// const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const smsRoutes = require('./routes/sms');
const emailVerificationRoutes = require('./routes/emailVerification');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Passport Config
require('./config/passport')(passport);

// CORS Configuration
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173']; // FRONTEND_URL może być nadal potrzebny, jeśli Coolify wystawia frontend pod innym adresem URL niż backend API
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// --- Serwowanie Plików Statycznych Frontendu ---
// Serwuj pliki statyczne z katalogu 'public' (gdzie skopiowaliśmy build frontendu)
const publicPath = path.join(__dirname, 'public');
console.log(`Serving static files from: ${publicPath}`); // Logowanie ścieżki
app.use(express.static(publicPath));
// ---------------------------------------------

// Serve static files from the 'uploads' directory (jeśli nadal potrzebne)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes (MUSZĄ być przed catch-all route)
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/feedback', feedbackRoutes);
// app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/email', emailVerificationRoutes);
app.use('/api/events', eventRoutes);

// Basic Route (może zostać nadpisany przez catch-all, ale zostawiam dla testów API)
app.get('/api/status', (req, res) => {
  res.send('YouNeed Backend API is running!');
});

// --- Catch-all Route dla SPA (React Router) ---
// Ta trasa musi być OSTATNIA, po wszystkich trasach API i serwowaniu plików statycznych
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`Serving index.html for route: ${req.path} from ${indexPath}`); // Logowanie
  res.sendFile(indexPath, (err) => {
    if (err) {
        console.error("Error sending index.html:", err);
        // Log error using audit logger if appropriate
        logAuditAction(req.user?.id || null, 'server_error', { path: req.path, error: `Failed to send index.html: ${err.message}`, ip: req.ip }).catch(console.error);
        res.status(500).send('Internal Server Error');
    }
  });
});
// ---------------------------------------------

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  logAuditAction(req.user?.id || null, 'server_error', { path: req.path, error: err.message, ip: req.ip }).catch(console.error);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Wystąpił błąd serwera.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Database Synchronization and Server Start
const PORT = process.env.PORT || 3000;

db.sequelize.sync({ alter: process.env.NODE_ENV !== 'production' })
  .then(() => {
    console.log('Database synchronized successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Frontend URL allowed by CORS: ${process.env.FRONTEND_URL || 'Not Set (Using same origin)'}`);
      console.log(`Serving static files from: ${publicPath}`);
      console.log(`Serving index.html for SPA routes from: ${path.join(publicPath, 'index.html')}`);
    });
  })
  .catch((err) => {
    console.error('Unable to synchronize database:', err);
    logAuditAction(null, 'db_sync_error', { error: err.message }).catch(console.error);
    process.exit(1);
  });

module.exports = app;
