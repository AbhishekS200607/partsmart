const router = require('express').Router();
const {
  getDashboard,
  getClaims,
  exportCSV,
  getSettings,
  updateSettings,
  updateClaimStatus,
  deleteClaims,
} = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/dashboard', getDashboard);
router.get('/claims', getClaims);
router.get('/export', exportCSV);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.post('/claim-status', updateClaimStatus);
router.delete('/claims', deleteClaims);

module.exports = router;
