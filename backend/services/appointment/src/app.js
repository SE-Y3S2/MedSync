const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev')); // request logging

// Raw body needed for Stripe webhooks if ever co-located; keep json last
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/appointments', appointmentRoutes);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ service: 'Appointment Service', status: 'running', timestamp: new Date() })
);

// ── Centralized Error Handler ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ message: 'Validation failed', errors: messages });
  }

  console.error(`[${new Date().toISOString()}] ERROR:`, err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;