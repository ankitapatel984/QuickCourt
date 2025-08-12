const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    sportType: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['Confirmed', 'Cancelled', 'Completed', 'Pending'], default: 'Confirmed' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

bookingSchema.index({ court: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);