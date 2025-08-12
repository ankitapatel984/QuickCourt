const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const {
  createBooking,
  getUserBookings,
  cancelBooking,
  getAvailableSlots,
} = require('../controllers/bookingController');

router.post('/', protect, authorizeRoles('User', 'FacilityOwner', 'Admin'), createBooking);
router.get('/user', protect, authorizeRoles('User', 'FacilityOwner', 'Admin'), getUserBookings);
router.put('/:id/cancel', protect, authorizeRoles('User', 'FacilityOwner', 'Admin'), cancelBooking);
router.get('/available-slots', getAvailableSlots);

module.exports = router;