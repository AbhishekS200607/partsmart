const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const claimLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { claimLimiter, loginLimiter };
