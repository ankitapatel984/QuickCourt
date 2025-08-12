const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const venueSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    city: { type: String },
    type: { type: String },
    sports: [{ type: String }],
    amenities: [{ type: String }],
    photos: [photoSchema],
    approved: { type: Boolean, default: false },
    startingPrice: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);