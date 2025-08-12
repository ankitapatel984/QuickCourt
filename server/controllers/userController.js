const User = require('../models/User');
const { uploadBuffer, destroy } = require('../utils/cloudinaryUpload');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

exports.updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name !== undefined) user.fullName = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  res.json({ message: 'Profile updated', user: await User.findById(user._id).select('-password') });
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No avatar file provided' });

  try {
    const folder = (process.env.CLOUDINARY_UPLOAD_FOLDER || 'quickcourt_vendors') + '/avatars';
    const result = await uploadBuffer(req.file.buffer, folder);
    const user = await User.findById(req.user._id);

    if (user.avatar && user.avatar.public_id) {
      await destroy(user.avatar.public_id);
    }

    user.avatar = { url: result.secure_url, public_id: result.public_id };
    await user.save();
    res.json({ message: 'Avatar uploaded', avatar: user.avatar });
  } catch (err) {
    console.error('Avatar upload error', err);
    res.status(500).json({ message: 'Avatar upload failed' });
  }
};