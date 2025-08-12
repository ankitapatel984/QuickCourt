const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const courtSchema = new mongoose.Schema({
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  name: { type: String, required: true },
  sportType: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  photo: photoSchema,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Court', courtSchema);