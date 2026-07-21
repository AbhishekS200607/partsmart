const router = require('express').Router();
const { listRewards, addReward, updateReward, deleteReward } = require('../controllers/rewardController');
const auth = require('../middleware/auth');
const { validateReward } = require('../utils/validation');

router.get('/', listRewards);
router.post('/', auth, validateReward, addReward);
router.put('/:id', auth, updateReward);
router.delete('/:id', auth, deleteReward);

module.exports = router;
