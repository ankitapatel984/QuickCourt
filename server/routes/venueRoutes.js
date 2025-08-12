const express = require('express');
const router = express.Router();
const { getVenues, getVenueById, searchVenues } = require('../controllers/venueController');

router.get('/', getVenues);
router.get('/search', searchVenues);
router.get('/:id', getVenueById);

module.exports = router;