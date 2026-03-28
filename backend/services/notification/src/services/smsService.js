const sendSMS = async (phoneNumber, message) => {
  try {
    // In a real application, you would integrate Twilio or Clickatell here.
    // Since this is a university assignment, we'll log the mock SMS.
    console.log(`[SMSService] Mocking SMS to ${phoneNumber}: "${message}"`);
  } catch (error) {
    console.error(`[SMSService] Error mocking SMS:`, error.message);
  }
};

module.exports = { sendSMS };
