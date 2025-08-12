const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadBuffer = (buffer, folder = '') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        timeout: 120000,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const uploadMultiple = async (files = [], folder = '') => {
  const uploaded = [];
  for (const file of files) {
    if (!file || !file.buffer) continue;
    const res = await uploadBuffer(file.buffer, folder);
    uploaded.push({ url: res.secure_url, public_id: res.public_id });
  }
  return uploaded;
};

const destroy = async (public_id) => {
  if (!public_id) return null;
  return cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
};

module.exports = { uploadBuffer, uploadMultiple, destroy };