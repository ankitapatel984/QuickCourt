const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const avatarSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email'],
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: avatarSchema,
    phone: { type: String },
    role: { type: String, enum: ['user', 'facility_owner', 'Admin'], default: 'User' },
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);