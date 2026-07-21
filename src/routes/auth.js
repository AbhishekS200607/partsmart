const router = require('express').Router();
const { login } = require('../controllers/authController');
const { validateLogin } = require('../utils/validation');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, validateLogin, login);

module.exports = router;
