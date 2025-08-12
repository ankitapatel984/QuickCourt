const Venue = require('../models/Venue');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const { uploadMultiple, destroy } = require('../utils/cloudinaryUpload');

const CLOUD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || 'quickcourt_vendors';

function parsePossibleArray(input) {
  if (input === undefined || input === null) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  if (typeof input === 'string') {
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

exports.createVenue = async (req, res) => {
  const ownerId = req.user._id;
  const { name, description, address, city, type, sports, amenities, startingPrice } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });

  let photos = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await uploadMultiple(req.files, `${CLOUD_FOLDER}/venues`);
    photos = uploaded.map((u) => ({ url: u.url, public_id: u.public_id }));
  }

  const parsedSports = parsePossibleArray(sports);
  const parsedAmenities = parsePossibleArray(amenities);

  const venue = await Venue.create({
    owner: ownerId,
    name,
    description,
    address,
    city,
    type,
    sports: parsedSports,
    amenities: parsedAmenities,
    photos,
    startingPrice: startingPrice || 0,
    approved: false,
  });

  res.status(201).json({ message: 'Venue created, pending admin approval', venue });
};

exports.updateVenue = async (req, res) => {
  const ownerId = req.user._id;
  const { id } = req.params;
  const venue = await Venue.findById(id);
  if (!venue) return res.status(404).json({ message: 'Venue not found' });
  if (!venue.owner.equals(ownerId)) return res.status(403).json({ message: 'Not allowed' });

  if (req.files && req.files.length > 0) {
    const uploaded = await uploadMultiple(req.files, `${CLOUD_FOLDER}/venues`);
    const urls = uploaded.map((u) => ({ url: u.url, public_id: u.public_id }));
    venue.photos = [...(venue.photos || []), ...urls];
  }

  const updates = {};
  ['name', 'description', 'address', 'city', 'type', 'startingPrice'].forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  if (req.body.sports !== undefined) updates.sports = parsePossibleArray(req.body.sports);
  if (req.body.amenities !== undefined) updates.amenities = parsePossibleArray(req.body.amenities);

  Object.assign(venue, updates);

  venue.approved = false;
  await venue.save();

  res.json({ message: 'Venue updated and set to pending approval', venue });
};

exports.addCourt = async (req, res) => {
  const ownerId = req.user._id;
  const { venueId } = req.params;
  const venue = await Venue.findById(venueId);
  if (!venue) return res.status(404).json({ message: 'Venue not found' });
  if (!venue.owner.equals(ownerId)) return res.status(403).json({ message: 'Not allowed' });

  const { name, sportType, pricePerHour } = req.body;
  if (!name || !sportType || pricePerHour == null) return res.status(400).json({ message: 'name, sportType and pricePerHour required' });

  let photoObj = null;
  if (req.file && req.file.buffer) {
    const resUpload = await uploadMultiple([req.file], `${CLOUD_FOLDER}/courts`);
    if (resUpload.length > 0) photoObj = { url: resUpload[0].url, public_id: resUpload[0].public_id };
  }

  const court = await Court.create({
    venue: venue._id,
    name,
    sportType,
    pricePerHour,
    photo: photoObj,
  });

  res.status(201).json({ message: 'Court added', court });
};

exports.updateCourt = async (req, res) => {
  const ownerId = req.user._id;
  const { id } = req.params;
  const court = await Court.findById(id);
  if (!court) return res.status(404).json({ message: 'Court not found' });

  const venue = await Venue.findById(court.venue);
  if (!venue.owner.equals(ownerId)) return res.status(403).json({ message: 'Not allowed' });

  if (req.file && req.file.buffer) {
    if (court.photo && court.photo.public_id) {
      await destroy(court.photo.public_id);
    }
    const resUpload = await uploadMultiple([req.file], `${CLOUD_FOLDER}/courts`);
    if (resUpload.length > 0) court.photo = { url: resUpload[0].url, public_id: resUpload[0].public_id };
  }

  ['name', 'sportType', 'pricePerHour', 'active'].forEach((k) => {
    if (req.body[k] !== undefined) court[k] = req.body[k];
  });

  await court.save();
  res.json({ message: 'Court updated', court });
};

exports.deleteCourt = async (req, res) => {
  const ownerId = req.user._id;
  const { id } = req.params;
  const court = await Court.findById(id);
  if (!court) return res.status(404).json({ message: 'Court not found' });

  const venue = await Venue.findById(court.venue);
  if (!venue.owner.equals(ownerId)) return res.status(403).json({ message: 'Not allowed' });

  if (court.photo && court.photo.public_id) {
    await destroy(court.photo.public_id);
  }

  await court.deleteOne();
  res.json({ message: 'Court deleted' });
};

exports.getOwnerBookings = async (req, res) => {
  const ownerId = req.user._id;
  const bookings = await Booking.find({ owner: ownerId }).populate('user', 'fullName email').populate('venue court');
  res.json({ total: bookings.length, bookings });
};