const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const sendOtp = require('../utils/sendOtp');
const { uploadBuffer } = require('../utils/cloudinaryUpload');

const createToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
};

exports.register = async (req, res) => {
  const { fullName, name, email, password, role } = req.body;
  const resolvedName = fullName || name;
  if (!resolvedName || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  let avatar = undefined;
  if (req.file && req.file.buffer) {
    try {
      const folder = (process.env.CLOUDINARY_UPLOAD_FOLDER || 'quickcourt_vendors') + '/avatars';
      const r = await uploadBuffer(req.file.buffer, folder);
      avatar = { url: r.secure_url, public_id: r.public_id };
    } catch (err) {
      console.error('Avatar upload failed', err);
    }
  }

  const user = await User.create({
    fullName: resolvedName,
    email,
    password,
    avatar,
    role: role || 'User',
    isVerified: false,
  });

  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await OTP.findOneAndDelete({ user: user._id });
  await OTP.create({ user: user._id, code, expiresAt });

  await sendOtp(email, code);

  res.status(201).json({
    message: 'Registered. Please verify OTP sent to your email.',
    email: user.email,
  });
};

// exports.verifyOtp = async (req, res) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) return res.status(400).json({ message: 'Email and otp are required' });

//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   const record = await OTP.findOne({ user: user._id });
//   if (!record) return res.status(400).json({ message: 'OTP not found or expired' });

//   if (record.code !== otp) return res.status(400).json({ message: 'Invalid OTP' });
//   if (record.expiresAt < new Date()) {
//     await OTP.deleteOne({ user: user._id });
//     return res.status(400).json({ message: 'OTP expired' });
//   }
exports.verifyOtp = async (req, res) => {
  //simulate a successful OTP verification
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and otp are required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  console.log(sendOtp(email, otp));
  if (sendOtp(email, otp)){
    user.isVerified = true;
    await user.save();
    res.json({ message: 'Account verified. You can now login.' });
  }
  res.status(400).json({ message: 'Invalid OTP' });

}
 

exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await OTP.findOneAndDelete({ user: user._id });
  await OTP.create({ user: user._id, code, expiresAt });

  await sendOtp(email, code);
  res.json({ message: 'OTP resent' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  if (!user.isVerified) return res.status(403).json({ message: 'Account not verified' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = createToken(user);

  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  res.json({
    message: 'Logged in successfully',
    user: { id: user._id, email: user.email, role: user.role, fullName: user.fullName, avatar: user.avatar },
  });
};

exports.logout = async (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Logged out' });
};