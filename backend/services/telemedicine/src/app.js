const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Session = require('./models/Session');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET) {
    console.error('[Telemedicine Service] CRITICAL: JWT_SECRET not found in environment.');
}

// Connect to Shared MongoDB Atlas
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Telemedicine Service connected to MongoDB Atlas'))
    .catch(err => console.error('❌ Failed to connect to MongoDB Atlas', err));
}

// Middleware
app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

// Session routes (Persisted in Atlas)
app.post('/api/sessions', auth, async (req, res) => {
  const { appointmentId, doctorId, patientId, signalingUrl } = req.body || {};

  if (!appointmentId || !doctorId || !patientId) return res.status(400).json({ message: 'Missing fields' });

  // Ownership check
  if (req.user.role !== 'admin' && req.user.id !== patientId && req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    let session = await Session.findOne({ appointmentId });
    if (session) {
      if (signalingUrl) {
         session.signalingUrl = signalingUrl;
         await session.save();
      }
      return res.status(200).json(session);
    }

    session = new Session({
      appointmentId, doctorId, patientId,
      signalingUrl,
      status: 'active'
    });

    await session.save();
    return res.status(201).json(session);
  } catch (err) {
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
});

app.get('/api/sessions/:appointmentId', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ appointmentId: req.params.appointmentId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (req.user.role !== 'admin' && req.user.id !== session.patientId && req.user.id !== session.doctorId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(session);
  } catch (err) {
    return res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/sessions/:appointmentId/end', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ appointmentId: req.params.appointmentId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (req.user.role !== 'admin' && req.user.id !== session.doctorId) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();
    return res.json(session);
  } catch (err) {
    return res.status(500).json({ message: 'Database error' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'Telemedicine API', status: 'running' });
});

module.exports = app;
