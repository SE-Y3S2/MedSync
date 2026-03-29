const express = require('express');
const cors = require('cors');

const app = express();

const sessions = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Session routes
app.post('/api/sessions', (req, res) => {
  const { appointmentId, doctorId, patientId } = req.body || {};

  if (!appointmentId || !doctorId || !patientId) {
    return res.status(400).json({ message: 'appointmentId, doctorId and patientId are required' });
  }

  const existing = sessions.get(appointmentId);
  if (existing) {
    return res.status(200).json(existing);
  }

  const session = {
    appointmentId,
    doctorId,
    patientId,
    channelName: `medsync_${appointmentId}`,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  sessions.set(appointmentId, session);
  return res.status(201).json(session);
});

app.get('/api/sessions/:appointmentId', (req, res) => {
  const session = sessions.get(req.params.appointmentId);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  return res.json(session);
});

app.put('/api/sessions/:appointmentId/end', (req, res) => {
  const session = sessions.get(req.params.appointmentId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const ended = {
    ...session,
    status: 'ended',
    endedAt: new Date().toISOString()
  };

  sessions.set(req.params.appointmentId, ended);
  return res.json(ended);
});

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'Telemedicine Service', status: 'running' });
});

// TODO: Add your routes here
// app.use('/api/telemedicine', telemedicineRoutes);

module.exports = app;
