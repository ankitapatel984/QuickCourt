const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Venue = require('../models/Venue');

const isOverlapping = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

const combineDateAndTime = (dateString, timeString) => {
  const d = new Date(dateString);
  const [hh, mm] = timeString.split(':').map((s) => parseInt(s, 10));
  d.setHours(hh, mm, 0, 0);
  return d;
};

exports.createBooking = async (req, res) => {
  const userId = req.user._id;
  const { venueId, courtId, date, timeSlot, duration = 1, totalAmount } = req.body;

  if (!venueId || !courtId || !date || !timeSlot) {
    return res.status(400).json({ message: 'venueId, courtId, date and timeSlot are required' });
  }

  const venue = await Venue.findById(venueId);
  if (!venue || !venue.approved) return res.status(404).json({ message: 'Venue not found or not approved' });

  const court = await Court.findById(courtId);
  if (!court || !court.active) return res.status(404).json({ message: 'Court not found or not active' });

  let start;
  let end;

  if (timeSlot.includes('-')) {
    const [startStr, endStr] = timeSlot.split('-').map((s) => s.trim());
    start = combineDateAndTime(date, startStr);
    end = combineDateAndTime(date, endStr);
  } else {
    start = combineDateAndTime(date, timeSlot);
    end = new Date(start.getTime() + Number(duration) * 60 * 60 * 1000);
  }

  if (isNaN(start) || isNaN(end) || start >= end) return res.status(400).json({ message: 'Invalid start or end time' });

  const overlapping = await Booking.findOne({
    court: courtId,
    status: { $in: ['Confirmed', 'Pending'] },
    $or: [
      {
        startTime: { $lt: end },
        endTime: { $gt: start },
      },
    ],
  });

  if (overlapping) {
    return res.status(400).json({ message: 'Selected time slot is already booked' });
  }

  let price;
  if (totalAmount != null) {
    price = Number(totalAmount);
  } else {
    const hours = (end - start) / (1000 * 60 * 60);
    price = hours * Number(court.pricePerHour);
  }

  const booking = await Booking.create({
    user: userId,
    owner: venue.owner,
    venue: venueId,
    court: courtId,
    sportType: court.sportType,
    startTime: start,
    endTime: end,
    price,
    status: 'Confirmed',
  });

  res.status(201).json({ message: 'Booking confirmed', booking });
};

exports.getUserBookings = async (req, res) => {
  const userId = req.user._id;
  const bookings = await Booking.find({ user: userId }).populate('venue court').sort({ startTime: -1 });
  res.json({ total: bookings.length, bookings });
};

exports.cancelBooking = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!booking.user.equals(userId) && req.user.role !== 'Admin') return res.status(403).json({ message: 'Not authorized to cancel' });

  const now = new Date();
  if (booking.startTime <= now) return res.status(400).json({ message: 'Cannot cancel past or ongoing bookings' });

  booking.status = 'Cancelled';
  await booking.save();
  res.json({ message: 'Booking cancelled', booking });
};

exports.getAvailableSlots = async (req, res) => {
  const { venueId, courtId, date, duration = 1 } = req.query;
  if (!venueId || !courtId || !date) {
    return res.status(400).json({ message: 'venueId, courtId and date are required' });
  }

  const court = await Court.findById(courtId);
  if (!court) return res.status(404).json({ message: 'Court not found' });

  const requestedDate = new Date(date);
  const dayStart = new Date(requestedDate.setHours(0, 0, 0, 0));
  const startHour = 6;
  const endHour = 22;
  const slotDurationMs = Number(duration) * 60 * 60 * 1000;

  const startOfDay = new Date(dayStart);
  const endOfDay = new Date(dayStart);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    court: courtId,
    status: { $in: ['Confirmed', 'Pending'] },
    startTime: { $lt: endOfDay },
    endTime: { $gt: startOfDay },
  });

  const slots = [];
  for (let h = startHour; h < endHour; ) {
    const slotStart = new Date(dayStart);
    slotStart.setHours(h, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

    if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0 && endHour === 22)) {
      break;
    }

    const overlap = bookings.some((b) => isOverlapping(slotStart, slotEnd, b.startTime, b.endTime));
    if (!overlap) {
      const pad = (n) => n.toString().padStart(2, '0');
      const startStr = `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())}`;
      const endStr = `${pad(slotEnd.getHours())}:${pad(slotEnd.getMinutes())}`;
      slots.push(`${startStr}-${endStr}`);
    }

    h += 1;
  }

  res.json({ date, courtId, venueId, duration: Number(duration), slots });
};