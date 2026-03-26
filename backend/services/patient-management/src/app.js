const express = require('express');
const app = express();
const path = require('path');
const patientRoutes = require('./routes/patientRoutes');

app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Patient routes
app.use('/api/patients', patientRoutes);

app.get('/', (req, res) => {
  res.send('Patient Management Service is running');
});

module.exports = app;