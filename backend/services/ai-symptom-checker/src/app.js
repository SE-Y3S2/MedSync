const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'AI Symptom Checker Service', status: 'running' });
});

// TODO: Add your routes here
// app.use('/api/ai', aiRoutes);

module.exports = app;
