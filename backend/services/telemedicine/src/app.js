const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not set');
}
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const sessions = new Map();

app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId || decoded.id || decoded.doctorId || decoded.patientId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

app.post('/api/sessions', auth, (req, res) => {
  const { appointmentId, doctorId, patientId } = req.body || {};
  if (!appointmentId || !doctorId || !patientId) return res.status(400).json({ message: 'Missing fields' });

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

app.get('/', (_req, res) => res.json({ service: 'Telemedicine API', status: 'running' }));
app.get('/health', (_req, res) => res.json({ ok: true }));

module.exports = app;
