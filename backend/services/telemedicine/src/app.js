const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const sessions = new Map();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[Telemedicine Service] CRITICAL: JWT_SECRET not found in environment.');
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

// Session routes
app.post('/api/sessions', auth, (req, res) => {
  const { appointmentId, doctorId, patientId } = req.body || {};

  if (!appointmentId || !doctorId || !patientId) return res.status(400).json({ message: 'Missing fields' });

  // Ownership check
  if (req.user.role !== 'admin' && req.user.id !== patientId && req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: You cannot create a session for this appointment' });
  }

  const existing = sessions.get(appointmentId);
  if (existing) return res.status(200).json(existing);

  const session = {
    appointmentId, doctorId, patientId,
    channelName: `medsync_${appointmentId}`,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  sessions.set(appointmentId, session);
  return res.status(201).json(session);
});

app.get('/api/sessions/:appointmentId', auth, (req, res) => {
  const session = sessions.get(req.params.appointmentId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  if (req.user.role !== 'admin' && req.user.id !== session.patientId && req.user.id !== session.doctorId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return res.json(session);
});

app.put('/api/sessions/:appointmentId/end', auth, (req, res) => {
  const session = sessions.get(req.params.appointmentId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  if (req.user.role !== 'admin' && req.user.id !== session.doctorId) {
      return res.status(403).json({ message: 'Forbidden: Only the doctor can end a session' });
  }

  const ended = { ...session, status: 'ended', endedAt: new Date().toISOString() };
  sessions.set(req.params.appointmentId, ended);
  return res.json(ended);
});

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'Telemedicine API', status: 'running' });
});

// TODO: Add your routes here
// app.use('/api/telemedicine', telemedicineRoutes);

module.exports = app;
