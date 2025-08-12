const sendOtp = async (email, code) => {
  console.log(`Sending OTP to ${email}: ${code}`);
  // Integrate real email/SMS provider here
  return true;
};

module.exports = sendOtp;