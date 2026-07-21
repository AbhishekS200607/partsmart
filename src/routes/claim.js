const router = require('express').Router();
const { submitClaim, getClaim } = require('../controllers/claimController');
const { validateInvoice } = require('../utils/validation');
const { claimLimiter } = require('../middleware/rateLimiter');

router.post('/', submitClaim);
router.post('/direct', submitClaim);
router.get('/:invoice', getClaim);

module.exports = router;
