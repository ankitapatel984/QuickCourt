const Venue = require('../models/Venue');
const Court = require('../models/Court');
const Booking = require('../models/Booking');

exports.getVenues = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filters = { approved: true };

  const total = await Venue.countDocuments(filters);
  const venues = await Venue.find(filters)
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ total, page: Number(page), limit: Number(limit), data: venues });
};

exports.getVenueById = async (req, res) => {
  const { id } = req.params;
  const venue = await Venue.findById(id).populate('owner', 'fullName email');
  if (!venue) return res.status(404).json({ message: 'Venue not found' });
  const courts = await Court.find({ venue: venue._id });
  res.json({ venue, courts });
};

exports.searchVenues = async (req, res) => {
  const { sport, location, date, page = 1, limit = 20 } = req.query;
  const filters = { approved: true };

  if (sport) filters.sports = sport;
  if (location) {
    filters.$or = [
      { city: { $regex: location, $options: 'i' } },
      { address: { $regex: location, $options: 'i' } },
      { name: { $regex: location, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  let venues = await Venue.find(filters).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

  if (date) {
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    const venueAvailability = await Promise.all(
      venues.map(async (v) => {
        const courts = await Court.find({ venue: v._id });
        if (!courts || courts.length === 0) return { venue: v, available: false };
        let hasAvailable = false;
        for (const c of courts) {
          const bookings = await Booking.find({
            court: c._id,
            startTime: { $gte: startOfDay, $lte: endOfDay },
          }).limit(1);
          if (!bookings || bookings.length === 0) {
            hasAvailable = true;
            break;
          }
        }
        return { venue: v, available: hasAvailable };
      })
    );

    venues = venueAvailability.map((va) => {
      const obj = va.venue.toObject();
      obj.availableOnDate = va.available;
      return obj;
    });
  }

  const total = await Venue.countDocuments(filters);
  res.json({ total, page: Number(page), limit: Number(limit), data: venues });
};