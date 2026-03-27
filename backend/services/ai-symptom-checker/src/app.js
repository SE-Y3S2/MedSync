require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const symptomRoutes = require('./routes/symptomRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Symptom checker routes
app.use('/api/symptom-checker', symptomRoutes);

app.get('/', (req, res) => {
  res.json({ service: 'AI Symptom Checker Service', status: 'running' });
});

module.exports = app;