const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'Doctor Management Service', status: 'running' });
});

// TODO: Add your routes here
// app.use('/api/doctors', doctorRoutes);

module.exports = app;
