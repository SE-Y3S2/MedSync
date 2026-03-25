const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { client } = require('../config/redis');

// In production, these should be verified from environment variables.
const APP_ID = process.env.AGORA_APP_ID || 'dummy_app_id';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'dummy_cert';

exports.createSession = async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId } = req.body;
    const channelName = `session_${appointmentId}`;
    
    // Generate Agora RTC Tokens
    const expireTime = 3600; // 1 hour validity
    const doctorToken = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, doctorId, RtcRole.PUBLISHER, Math.floor(Date.now() / 1000) + expireTime);
    const patientToken = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, patientId, RtcRole.PUBLISHER, Math.floor(Date.now() / 1000) + expireTime);

    const sessionData = {
      appointmentId,
      channelName,
      doctorToken,
      patientToken,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    // Store in Redis with an expiration of 2 hours
    await client.setEx(`session:${appointmentId}`, 7200, JSON.stringify(sessionData));

    res.status(201).json(sessionData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const data = await client.get(`session:${req.params.appointmentId}`);
    if (!data) return res.status(404).json({ message: 'Session not found' });
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.readySession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    let data = await client.get(`session:${appointmentId}`);
    if (!data) return res.status(404).json({ message: 'Session not found' });
    
    let sessionData = JSON.parse(data);
    sessionData.status = 'ready'; 
    // This state change could be published to Kafka/RabbitMQ to trigger Patient Notification
    
    await client.setEx(`session:${appointmentId}`, 7200, JSON.stringify(sessionData));
    res.json(sessionData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    let data = await client.get(`session:${appointmentId}`);
    if (!data) return res.status(404).json({ message: 'Session not found' });
    
    let sessionData = JSON.parse(data);
    sessionData.status = 'ended';
    sessionData.endedAt = new Date().toISOString();
    
    await client.setEx(`session:${appointmentId}`, 7200, JSON.stringify(sessionData));
    
    // Here we would publish a 'ConsultationEnded' event to trigger AI Symptom Checker's summary generation
    
    res.json(sessionData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.agoraWebhook = async (req, res) => {
  try {
    // Handle unexpected disconnects or server-side events from Agora
    console.log('Received Agora Webhook:', req.body);
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
