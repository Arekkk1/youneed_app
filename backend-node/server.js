require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const db = require('./models');
const { logAuditAction } = require('./utils/audit');

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
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const smsRoutes = require('./routes/sms');
const emailVerificationRoutes = require('./routes/emailVerification');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Passport Config
require('./config/passport')(passport);

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://localhost:5173',
  'https://49.13.68.62:5173',
  'https://youneed.com.pl',
  'https://api.youneed.com.pl',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production' && !origin) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/email', emailVerificationRoutes);
app.use('/api/events', eventRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'success', message: 'YouNeed Backend API is running!' });
});

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
const publicPath = path.join(__dirname, 'public');
console.log(`Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

// Catch-all Route for SPA (React Router)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    console.warn(`[Server Catch-All] Unhandled API route attempt: ${req.path}`);
    logAuditAction(req.user?.id || null, 'unhandled_api_route', { path: req.path, ip: req.ip }).catch(console.error);
    return res.status(404).json({ status: 'error', message: 'API endpoint not found' });
  }

  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`Serving index.html for route: ${req.path} from ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      logAuditAction(req.user?.id || null, 'server_error', { path: req.path, error: `Failed to send index.html: ${err.message}`, ip: req.ip }).catch(console.error);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  logAuditAction(req.user?.id || null, 'server_error', { path: req.path, error: err.message, ip: req.ip }).catch(console.error);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Wystąpił błąd serwera.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

db.sequelize.sync()
  .then(() => {
    console.log('Database synchronized successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
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
