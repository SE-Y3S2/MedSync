const express = require('express');
const app = express();
const symptomRoutes = require('./routes/symptomRoutes');

app.use(express.json());

// Symptom checker routes
app.use('/api/symptom-checker', symptomRoutes);

app.get('/', (req, res) => {
  res.send('AI Symptom Checker Service is running');
});

module.exports = app;