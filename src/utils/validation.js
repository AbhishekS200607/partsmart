const { body, validationResult } = require('express-validator');

const invoiceRegex = /^[A-Za-z0-9\-\/]{4,50}$/;

const validateInvoice = [
  body('invoice_number').trim().notEmpty().withMessage('Invoice number is required')
    .matches(invoiceRegex).withMessage('Invalid invoice format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    next();
  }
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    next();
  }
];

const validateReward = [
  body('title').trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('probability').isFloat({ min: 0.01, max: 100 }),
  body('inventory').isInt({ min: 0 }),
  body('active').optional().isBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    next();
  }
];

module.exports = { validateInvoice, validateLogin, validateReward };
