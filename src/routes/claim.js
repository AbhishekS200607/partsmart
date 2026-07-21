const router = require('express').Router();
const { submitClaim, getClaim } = require('../controllers/claimController');
const { validateInvoice } = require('../utils/validation');
const { claimLimiter } = require('../middleware/rateLimiter');

router.post('/', claimLimiter, validateInvoice, submitClaim);
router.get('/:invoice', getClaim);

module.exports = router;
