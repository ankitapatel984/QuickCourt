const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/multer');

const {
  createVenue,
  updateVenue,
  addCourt,
  updateCourt,
  deleteCourt,
  getOwnerBookings,
} = require('../controllers/ownerController');

router.use(protect);
router.use(authorizeRoles('FacilityOwner'));

router.post('/venues', upload.array('photos', 10), createVenue);
router.put('/venues/:id', upload.array('photos', 10), updateVenue);

router.post('/venues/:venueId/courts', upload.single('photo'), addCourt);
router.put('/courts/:id', upload.single('photo'), updateCourt);
router.delete('/courts/:id', deleteCourt);

router.get('/bookings', getOwnerBookings);

module.exports = router;