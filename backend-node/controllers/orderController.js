const { Order, User, Notification, AuditLog, OpeningHours } = require('../models');
const { body, validationResult } = require('express-validator');

// Helper to log audit actions
const logAuditAction = async (adminId, action, details) => {
  await AuditLog.create({
    adminId,
    action,
    details,
    createdAt: new Date(),
  });
};

// Validation middleware for createOrder
const validateCreateOrder = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('startAt').isISO8601().withMessage('Invalid start date'),
  body('endAt').optional().isISO8601().withMessage('Invalid end date'),
  body('providerId').isInt().withMessage('Invalid provider ID'),
];

// Validation middleware for updateOrderStatus
const validateUpdateOrderStatus = [
  body('status').isIn(['accepted', 'cancelled']).withMessage('Invalid status'),
];

// Get orders for the logged-in user
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    let orders;
    if (user.role === 'provider') {
      orders = await Order.findAll({
        where: { providerId: userId },
        include: [
          { model: User, as: 'Client', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } else if (user.role === 'client') {
      orders = await Order.findAll({
        where: { clientId: userId },
        include: [
          { model: User, as: 'Provider', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } else {
      return res.status(403).json({ message: 'Nieprawidłowa rola użytkownika' });
    }

    const total = await Order.count({
      where: user.role === 'provider' ? { providerId: userId } : { clientId: userId },
    });

    await logAuditAction(user.role === 'admin' ? user.id : null, 'get_orders', {
      userId,
      role: user.role,
      page,
      limit,
      ip: req.ip,
    });

    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Błąd pobierania zleceń:', err);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania zleceń' });
  }
};

// Get orders for a specific provider
exports.getProviderOrders = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const provider = await User.findOne({ where: { id: providerId, role: 'provider' } });
    if (!provider) {
      return res.status(404).json({ message: 'Usługodawca nie znaleziony' });
    }

    const orders = await Order.findAll({
      where: {
        providerId,
        status: 'accepted',
      },
      attributes: ['id', 'title', 'startAt', 'endAt', 'status'],
      order: [['startAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await Order.count({
      where: { providerId, status: 'accepted' },
    });

    await logAuditAction(null, 'get_provider_orders', {
      providerId,
      page,
      limit,
      ip: req.ip,
    });

    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(`Błąd pobierania zleceń dla usługodawcy ${req.params.providerId}:`, err);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania zleceń usługodawcy' });
  }
};

// Create a new order
exports.createOrder = [
  ...validateCreateOrder,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, startAt, endAt, providerId } = req.body;
    const clientId = req.user.id;

    try {
      const user = await User.findByPk(clientId);
      if (!user || user.role !== 'client') {
        return res.status(403).json({ message: 'Tylko klienci mogą tworzyć zlecenia' });
      }

      const provider = await User.findByPk(providerId);
      if (!provider || provider.role !== 'provider') {
        return res.status(404).json({ message: 'Usługodawca nie znaleziony' });
      }

      const startDate = new Date(startAt);
      const endDate = endAt ? new Date(endAt) : null;

      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: 'Nieprawidłowy format daty początkowej' });
      }
      if (endDate && isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Nieprawidłowy format daty końcowej' });
      }
      if (endDate && endDate <= startDate) {
        return res.status(400).json({ message: 'Data końcowa musi być późniejsza niż data początkowa' });
      }

      // Check provider availability
      const dayOfWeek = startDate.toLocaleString('en-US', { weekday: 'long' });
      const openingHour = await OpeningHours.findOne({
        where: { providerId, dayOfWeek, isOpen: 1 },
      });
      if (openingHour) {
        const [openHour, openMinute] = openingHour.openTime.split(':').map(Number);
        const [closeHour, closeMinute] = openingHour.closeTime.split(':').map(Number);
        const startHour = startDate.getHours();
        const startMinute = startDate.getMinutes();
        if (
          startHour < openHour ||
          (startHour === openHour && startMinute < openMinute) ||
          startHour > closeHour ||
          (startHour === closeHour && startMinute > closeMinute)
        ) {
          return res.status(400).json({ message: 'Wybrany termin poza godzinami otwarcia usługodawcy' });
        }
      }

      const conflictingOrders = await Order.findAll({
        where: {
          providerId,
          status: 'accepted',
          startAt: { [Sequelize.Op.lte]: endDate || startDate },
          endAt: { [Sequelize.Op.gte]: startDate },
        },
      });
      if (conflictingOrders.length > 0) {
        return res.status(400).json({ message: 'Usługodawca jest zajęty w wybranym terminie' });
      }

      const order = await Order.create({
        clientId,
        providerId,
        title,
        description: description || '',
        startAt: startDate,
        endAt: endDate,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await logAuditAction(null, 'create_order', {
        clientId,
        providerId,
        orderId: order.id,
        title,
        ip: req.ip,
      });

      await Notification.create({
        userId: providerId,
        message: `Nowe zlecenie: "${title}" od ${user.firstName} ${user.lastName}`,
        type: 'account',
        createdAt: new Date(),
      });

      await Notification.create({
        userId: clientId,
        message: `Zlecenie "${title}" zostało utworzone.`,
        type: 'account',
        createdAt: new Date(),
      });

      res.status(201).json(order);
    } catch (err) {
      console.error('Błąd tworzenia zlecenia:', err);
      res.status(500).json({ message: 'Błąd serwera podczas tworzenia zlecenia' });
    }
  },
];

// Update order status
exports.updateOrderStatus = [
  ...validateUpdateOrderStatus,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    try {
      const order = await Order.findByPk(id, {
        include: [
          { model: User, as: 'Client', attributes: ['id', 'firstName', 'lastName'] },
          { model: User, as: 'Provider', attributes: ['id', 'firstName', 'lastName'] },
        ],
      });
      if (!order) {
        return res.status(404).json({ message: 'Zlecenie nie znalezione' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
      }

      if (user.role === 'provider' && order.providerId === userId) {
        if (status === 'accepted' && order.status !== 'pending') {
          return res.status(400).json({ message: 'Tylko oczekujące zlecenia mogą być zaakceptowane' });
        }
        if (status === 'cancelled' && order.status !== 'pending') {
          return res.status(400).json({ message: 'Tylko oczekujące zlecenia mogą być anulowane' });
        }
      } else if (user.role === 'client' && order.clientId === userId) {
        if (status !== 'cancelled' || order.status !== 'pending') {
          return res.status(403).json({ message: 'Klient może tylko anulować oczekujące zlecenia' });
        }
      } else {
        return res.status(403).json({ message: 'Brak uprawnień do zmiany statusu tego zlecenia' });
      }

      order.status = status;
      order.updatedAt = new Date();
      await order.save();

      await logAuditAction(user.role === 'admin' ? user.id : null, 'update_order_status', {
        userId,
        orderId: id,
        status,
        ip: req.ip,
      });

      await Notification.create({
        userId: order.clientId,
        message: `Status zlecenia "${order.title}" zmieniono na: ${status}`,
        type: 'account',
        createdAt: new Date(),
      });

      await Notification.create({
        userId: order.providerId,
        message: `Status zlecenia "${order.title}" zmieniono na: ${status}`,
        type: 'account',
        createdAt: new Date(),
      });

      res.json({ message: 'Status zlecenia zaktualizowany', order });
    } catch (err) {
      console.error(`Błąd aktualizacji statusu zlecenia ${id}:`, err);
      res.status(500).json({ message: 'Błąd serwera podczas aktualizacji statusu zlecenia' });
    }
  },
];

module.exports = exports;
