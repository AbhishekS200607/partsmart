const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

const claimLimiter = isServerless
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: { success: false, message: 'Too many requests. Please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

const loginLimiter = isServerless
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: { success: false, message: 'Too many login attempts. Try again in 1 hour.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = { claimLimiter, loginLimiter };
