const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
} = require('../controllers/authController');

router.post('/register', upload.single('avatar'), register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;