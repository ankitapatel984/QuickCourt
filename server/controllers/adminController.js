const Venue = require('../models/Venue');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Court = require('../models/Court');

exports.getPendingVenues = async (req, res) => {
  const venues = await Venue.find({ approved: false }).populate('owner', 'fullName email');
  res.json({ total: venues.length, venues });
};

exports.approveVenue = async (req, res) => {
  const { id } = req.params;
  const { approve, comments } = req.body;
  const venue = await Venue.findById(id);
  if (!venue) return res.status(404).json({ message: 'Venue not found' });

  if (approve) {
    venue.approved = true;
    await venue.save();
    return res.json({ message: 'Venue approved', venue });
  } else {
    await venue.deleteOne();
    return res.json({ message: 'Venue rejected and removed', comments });
  }
};

exports.getStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalFacilityOwners = await User.countDocuments({ role: 'FacilityOwner' });
  const totalBookings = await Booking.countDocuments();
  const totalActiveCourts = await Court.countDocuments({ active: true });

  res.json({
    totalUsers,
    totalFacilityOwners,
    totalBookings,
    totalActiveCourts,
  });
};