// notificationController.js
// Handles sending SMS and email notifications

const nodemailer = require('nodemailer');
// For SMS, you can use Twilio or similar service. Here, we mock the SMS sending.

// Email transporter setup (example using Gmail, replace with real credentials in production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };
  await transporter.sendMail(mailOptions);
}

// Mock send SMS or use Twilio fallback
async function sendSMS(to, message) {
  if (!to) {
    throw new Error('Destination phone number is required for SMS');
  }

  if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to,
    });
    return;
  }
  // fallback logger for local development
  console.log(`SMS sent to ${to}: ${message}`);
}

module.exports = { sendEmail, sendSMS };