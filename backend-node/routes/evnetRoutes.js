const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/authenticate');

// GET /api/events?date=YYYY-MM-DD[&providerId=...]
router.get('/', authenticate, eventController.getEventsForCalendar);

module.exports = router;
