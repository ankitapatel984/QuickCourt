const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const { getPendingVenues, approveVenue, getStats } = require('../controllers/adminController');

router.use(protect);
router.use(authorizeRoles('Admin'));

router.get('/venues/pending', getPendingVenues);
router.patch('/venues/:id/approve', approveVenue);
router.get('/stats', getStats);

module.exports = router;