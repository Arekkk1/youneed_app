const { SmsCode, User, Notification, AuditLog } = require('../models');
const { Sequelize } = require('sequelize');
const axios = require('axios');
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

// Validation middleware for generateSmsCode
const validateGenerateSmsCode = [
  body('userId').isInt().withMessage('Invalid user ID'),
  body('phoneNumber').isMobilePhone('pl-PL').withMessage('Invalid phone number'),
];

// Validation middleware for verifySmsCode
const validateVerifySmsCode = [
  body('userId').isInt().withMessage('Invalid user ID'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code must be a 6-digit number'),
];

// Generate SMS code
exports.generateCode = [
  body('phoneNumber').isMobilePhone('pl-PL').withMessage('Invalid phone number'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber } = req.body;

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await SmsCode.destroy({ where: { phoneNumber } });
      await SmsCode.create({
        phoneNumber,
        code,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await axios.get('https://api.smsapi.pl/sms.do', {
        params: {
          access_token: process.env.SMSAPI_TOKEN,
          to: phoneNumber,
          from: 'YouNeed',
          message: `Twój kod weryfikacyjny YouNeed: ${code}`,
          format: 'json',
        },
      });

      if (response.data.error) {
        throw new Error(`SMSAPI error: ${response.data.message}`);
      }

      await logAuditAction(null, 'generate_sms_code', {
        phoneNumber,
        ip: req.ip,
      });

      res.json({ message: 'Kod weryfikacyjny wysłany' });
    } catch (err) {
      console.error('Błąd wysyłania SMS:', err);
      await logAuditAction(null, 'generate_sms_code_failed', {
        phoneNumber,
        error: err.message,
        ip: req.ip,
      });
      res.status(500).json({ message: 'Błąd wysyłania SMS', error: err.message });
    }
  }
];


// Verify SMS code
exports.verifySmsCode = [
  ...validateVerifySmsCode,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, code } = req.body;

    try {
      const smsCode = await SmsCode.findOne({
        where: {
          userId,
          code,
          expiresAt: { [Sequelize.Op.gt]: new Date() },
        },
      });

      if (!smsCode) {
        await logAuditAction(null, 'verify_sms_code_failed', {
          userId,
          code,
          message: 'Invalid or expired code',
          ip: req.ip,
        });
        return res.status(400).json({ message: 'Nieprawidłowy lub wygasły kod' });
      }

      await smsCode.destroy();

      await logAuditAction(null, 'verify_sms_code', {
        userId,
        ip: req.ip,
      });

      await Notification.create({
        userId,
        message: 'Twój numer telefonu został zweryfikowany.',
        type: 'account',
        createdAt: new Date(),
      });

      res.json({ message: 'Kod zweryfikowany' });
    } catch (err) {
      console.error('Błąd weryfikacji kodu:', err);
      await logAuditAction(null, 'verify_sms_code_error', {
        userId,
        error: err.message,
        ip: req.ip,
      });
      res.status(500).json({ message: 'Błąd weryfikacji kodu', error: err.message });
    }
  },
];

module.exports = exports;
