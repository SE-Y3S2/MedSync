const express = require('express');
const cors = require('cors');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/appointments', appointmentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'Appointment Service', status: 'running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;
