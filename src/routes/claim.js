const router = require('express').Router();
const { submitClaim, getClaim } = require('../controllers/claimController');

router.post('/', submitClaim);
router.get('/:invoice', getClaim);

module.exports = router;
